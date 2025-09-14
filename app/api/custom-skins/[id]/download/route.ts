import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

// Common download handler for both GET and POST
async function handleDownload(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log('Download request for skin:', id)

    // No authentication required - public downloads for approved skins

    // Find the custom skin (published skins, not submissions)
    const skin = await prisma.customSkin.findFirst({
      where: {
        id,
        status: 'APPROVED',
        deletedAt: null
      }
    })

    if (!skin) {
      return NextResponse.json({ error: 'Skin not found' }, { status: 404 })
    }

    // Get absolute file path
    const filePath = join(process.cwd(), skin.filePath.replace(/^\//, ''))
    console.log('Attempting to serve file:', filePath)

    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('File not found at path:', filePath)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    console.log('File exists, attempting to read...')
    
    try {
      const fileBuffer = await readFile(filePath)
      console.log('File read successfully, size:', fileBuffer.length, 'bytes')

      // Track download in database (optional - continue even if fails)
      try {
        // Track download without user session (public access)
        // await prisma.skinDownload.create({
        //   data: {
        //     skinId: id,
        //     ipAddress: request.headers.get('x-forwarded-for') || 
        //               request.headers.get('x-real-ip') || 
        //               'unknown',
        //     userAgent: request.headers.get('user-agent') || 'unknown'
        //   }
        // })

        // Update download count on CustomSkin
        await prisma.customSkin.update({
          where: { id },
          data: {
            downloadCount: {
              increment: 1
            }
          }
        })

        console.log('Download tracked successfully')
      } catch (dbError) {
        console.log('Warning: Could not track download:', dbError)
        // Continue with download even if tracking fails
      }

      // Return file with proper headers
      return new Response(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${skin.fileName}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      })
    } catch (fileError) {
      console.error('Error reading file:', fileError)
      return NextResponse.json({ error: 'Error reading file' }, { status: 500 })
    }
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export both GET and POST methods
export async function GET(
  request: NextRequest,
  params: { params: { id: string } }
) {
  return handleDownload(request, params)
}

export async function POST(
  request: NextRequest,
  params: { params: { id: string } }
) {
  return handleDownload(request, params)
}