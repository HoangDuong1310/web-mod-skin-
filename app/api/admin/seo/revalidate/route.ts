import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can revalidate SEO' },
        { status: 403 }
      )
    }

    // Revalidate all pages that use SEO settings
    revalidatePath('/')
    revalidatePath('/products')
    revalidatePath('/categories')
    revalidatePath('/blog')
    revalidatePath('/about')
    revalidatePath('/contact')
    
    // Revalidate SEO files
    revalidatePath('/sitemap.xml')
    revalidatePath('/robots.txt')
    
    // Revalidate tags related to SEO
    revalidateTag('seo-settings')
    revalidateTag('site-settings')

    return NextResponse.json({
      message: 'SEO cache revalidated successfully',
      timestamp: new Date().toISOString(),
      revalidated: [
        '/',
        '/products',
        '/categories', 
        '/blog',
        '/about',
        '/contact',
        '/sitemap.xml',
        '/robots.txt'
      ]
    })

  } catch (error) {
    console.error('❌ Error revalidating SEO cache:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate SEO cache' },
      { status: 500 }
    )
  }
}
