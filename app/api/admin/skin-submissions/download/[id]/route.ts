import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const skinId = params.id

    // Find the skin submission
    const skin = await (prisma as any).skinSubmission.findUnique({
      where: {
        id: skinId,
        deletedAt: null
      }
    })

    if (!skin) {
      return NextResponse.json(
        { error: 'Skin not found' },
        { status: 404 }
      )
    }

    // Get file path
    const filePath = join(process.cwd(), skin.filePath)
    
    try {
      // Read the file
      const fileBuffer = await readFile(filePath)
      
      // Create response with proper headers
      return new NextResponse(new Uint8Array(fileBuffer), {
        headers: {
          'Content-Type': skin.fileType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${skin.fileName}"`,
          'Content-Length': skin.fileSize
        }
      })
    } catch (fileError) {
      console.error('File read error:', fileError)
      return NextResponse.json(
        { error: 'File not found on server' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Admin download error:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}
