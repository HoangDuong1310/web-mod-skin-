import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const path = searchParams.get('path')
    const tag = searchParams.get('tag')

    // Check for secret to confirm this is a valid request
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
    }

    if (path) {
      revalidatePath(path)
      return NextResponse.json({ 
        revalidated: true, 
        path,
        now: Date.now() 
      })
    }

    if (tag) {
      revalidateTag(tag)
      return NextResponse.json({ 
        revalidated: true, 
        tag,
        now: Date.now() 
      })
    }

    return NextResponse.json({
      message: 'Missing path or tag parameter'
    }, { status: 400 })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({
      message: 'Error revalidating'
    }, { status: 500 })
  }
}


