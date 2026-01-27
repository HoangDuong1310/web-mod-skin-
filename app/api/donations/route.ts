import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { strictLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

// Validation schema cho donation
const createDonationSchema = z.object({
  amount: z.number()
    .min(1, 'Số tiền tối thiểu là 1')
    .max(10000, 'Số tiền tối đa là 10,000 USD')
    .positive('Số tiền phải lớn hơn 0'),
  currency: z.string().default('USD'),
  paymentMethod: z.enum(['KOFI', 'BANK_TRANSFER', 'MANUAL']),
  donorName: z.string()
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên không được vượt quá 100 ký tự')
    .regex(/^[\p{L}\p{N}\s\-_.\'()]+$/u, 'Tên chỉ được chứa chữ cái, số, khoảng trắng và một số ký tự đặc biệt'),
  donorEmail: z.string()
    .email('Email không hợp lệ')
    .max(255, 'Email không được vượt quá 255 ký tự')
    .or(z.literal('')),
  message: z.string()
    .max(500, 'Lời nhắn không được vượt quá 500 ký tự')
    .optional(),
  isAnonymous: z.boolean().default(false),
  goalId: z.string().optional(),
  qrUrl: z.string().url().optional().or(z.literal('')),
  transferNote: z.string().max(200).optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100)
    const status = searchParams.get('status')

    const where: any = {}
    if (status) where.status = status

    const [donations, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          goal: {
            select: { title: true }
          }
        }
      }),
      prisma.donation.count({ where })
    ])

    return NextResponse.json({
      donations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching donations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch donations' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  // Áp dụng rate limiting nghiêm ngặt - chỉ 5 requests/phút/IP
  const rateLimitResult = await strictLimiter(req)
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
        }
      }
    )
  }

  try {
    // Parse và validate body
    const body = await req.json()

    // Validate input
    const validationResult = createDonationSchema.safeParse(body)
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Kiểm tra IP đã donate gần đây chưa (trong vòng 1 phút)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     req.ip || 
                     'unknown'

    const recentDonation = await prisma.donation.findFirst({
      where: {
        OR: [
          { donorEmail: data.donorEmail },
          { 
            // Lưu IP vào DB để kiểm tra (nếu cần mở rộng schema)
            // Hiện tại chỉ kiểm tra email
          }
        ],
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000) // 1 phút
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (recentDonation) {
      return NextResponse.json(
        { error: 'Bạn đã tạo donation gần đây. Vui lòng đợi 1 phút trước khi tạo mới.' },
        { status: 429 }
      )
    }

    // Tạo donation với status PENDING (chờ xác nhận)
    const donation = await prisma.donation.create({
      data: {
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        donorName: data.donorName,
        donorEmail: data.donorEmail || null,
        message: data.message || null,
        isAnonymous: data.isAnonymous,
        goalId: data.goalId,
        status: 'PENDING',
        transferNote: data.transferNote || null,
      }
    })

    return NextResponse.json(
      { 
        success: true, 
        donation: {
          id: donation.id,
          amount: donation.amount,
          message: 'Donation đã được tạo. Vui lòng hoàn tất thanh toán.'
        }
      },
      { 
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString()
        }
      }
    )
  } catch (error) {
    console.error('Error creating donation:', error)
    
    // Check for Prisma unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Donation này đã tồn tại' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create donation' },
      { status: 500 }
    )
  }
}
