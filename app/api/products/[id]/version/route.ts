import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { apiLimiter } from '@/lib/rate-limit'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const rateLimitResult = await apiLimiter(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { message: 'Quá nhiều requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const productId = params.id

    // Tìm sản phẩm theo ID
    const product = await prisma.product.findUnique({
      where: { 
        id: productId,
        deletedAt: null 
      }
    })

    if (!product) {
      return NextResponse.json(
        { message: 'Không tìm thấy sản phẩm' },
        { status: 404 }
      )
    }

    // Lấy version từ version field
    const version = product.version || 'N/A'

    return NextResponse.json({
      message: 'Thành công',
      version: version
    })

  } catch (error) {
    console.error('Version API error:', error)
    return NextResponse.json(
      { message: 'Lỗi server nội bộ' },
      { status: 500 }
    )
  }
}
