/**
 * API Route: /api/reseller/register
 * Đăng ký làm reseller
 * Method: POST
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(200),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Bạn cần đăng nhập để đăng ký reseller' },
        { status: 401 }
      )
    }

    // Check if user already has a reseller profile
    const existingReseller = await prisma.reseller.findUnique({
      where: { userId: session.user.id },
    })

    if (existingReseller) {
      return NextResponse.json(
        { error: 'Bạn đã đăng ký reseller rồi', resellerId: existingReseller.id, status: existingReseller.status },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = registerSchema.parse(body)

    // Create reseller profile
    const reseller = await prisma.reseller.create({
      data: {
        userId: session.user.id,
        businessName: validated.businessName,
        contactEmail: validated.contactEmail,
        contactPhone: validated.contactPhone || null,
        website: validated.website || null,
        description: validated.description || null,
        status: 'PENDING',
      },
    })

    // Update user role to RESELLER
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'RESELLER' },
    })

    return NextResponse.json({
      success: true,
      message: 'Đăng ký reseller thành công! Vui lòng chờ admin duyệt.',
      reseller: {
        id: reseller.id,
        businessName: reseller.businessName,
        status: reseller.status,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Reseller register error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
