import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { strictLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Validation schema cho donation
// Sử dụng regex đơn giản tương thích với webpack
const nameRegex = /^[a-zA-Z0-9\s\-_.'()ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀẾỂỄỆỉịọốồộổỗơớờởỡợụủứừửữựỳýỵỷỹ]+$/u

const createDonationSchema = z.object({
  amountVND: z.number()
    .int('Số tiền phải là số nguyên')
    .min(1000, 'Số tiền tối thiểu là 1.000₫')
    .max(500_000_000, 'Số tiền quá lớn'),
  paymentMethod: z.enum(['VIETQR', 'KOFI']),
  donorName: z.string().min(2).max(100).regex(nameRegex).optional(),
  message: z.string().max(500).optional(),
  isAnonymous: z.boolean().default(false),
  goalId: z.string().optional(),
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

    const { getServerSession } = await import('next-auth')
    const { authOptions } = await import('@/lib/auth')
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id ?? null

    const { generateTransferNote } = await import('@/lib/transfer-note')
    const transferNote = generateTransferNote(userId)

    const donation = await prisma.donation.create({
      data: {
        amount: data.amountVND,           // legacy Decimal column mirrors VND
        amountVND: data.amountVND,
        currency: 'VND',
        paymentMethod: data.paymentMethod === 'KOFI' ? 'KOFI' : 'BANK_TRANSFER',
        userId,
        donorName: data.isAnonymous ? null : (data.donorName ?? session?.user?.name ?? null),
        donorEmail: session?.user?.email ?? null,
        message: data.message ?? null,
        isAnonymous: data.isAnonymous,
        goalId: data.goalId ?? null,
        transferNote,
        status: 'PENDING',
      },
    })

    return NextResponse.json(
      {
        donationId: donation.id,
        transferNote,
        amountVND: data.amountVND,
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
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
