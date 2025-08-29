import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { generateMetadata as generateSEOMetadata, generateArticleSchema } from '@/lib/seo'
import { 
  Calendar, 
  User, 
  ArrowLeft, 
  Clock,
  Share2,
  BookmarkPlus,
  ThumbsUp
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

interface BlogPostPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: params.slug, deletedAt: null },
      include: { author: true },
    })

    if (!post) {
      return generateSEOMetadata({
        title: 'Post Not Found',
        description: 'The requested blog post could not be found.',
      })
    }

    return generateSEOMetadata({
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || '',
      keywords: [post.title, 'blog', 'tech', 'apps'],
      image: post.featuredImage || undefined,
      url: `/blog/${post.slug}`,
      type: 'article',
    })
  } catch (error) {
    console.error('Error generating metadata:', error)
    return generateSEOMetadata({
      title: 'Blog Post',
      description: 'Read the latest from our blog.',
    })
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const [post, relatedPosts] = await Promise.all([
      prisma.post.findUnique({
        where: {
          slug: params.slug,
          status: 'PUBLISHED',
          deletedAt: null,
        },
        include: {
          author: {
            select: {
              name: true,
              email: true,
            },
          },
          postTags: {
            include: {
              tag: {
                select: {
                  name: true,
                  slug: true,
                },
              },
            },
          },
        },
      }),
      // Get related posts
      prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          slug: { not: params.slug },
        },
        include: {
          author: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 3,
      }),
    ])

    if (!post) {
      notFound()
    }

    // Generate structured data
    const articleSchema = generateArticleSchema({
      title: post.title,
      description: post.excerpt || '',
      content: post.content,
      author: post.author.name || 'Anonymous',
      publishedAt: (post.publishedAt || post.createdAt).toISOString(),
      modifiedAt: post.updatedAt.toISOString(),
      url: `/blog/${post.slug}`,
      image: post.featuredImage || undefined,
    })

    const readingTime = Math.ceil(post.content.replace(/<[^>]*>/g, '').split(' ').length / 200)

    // Extract table of contents from content
    function extractTableOfContents(htmlContent: string) {
      try {
        // Simple regex to match h2 and h3 tags
        const headerRegex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi
        const headers = []
        let match
        
        while ((match = headerRegex.exec(htmlContent)) !== null) {
          const level = parseInt(match[1])
          const id = match[2]
          const text = match[3].replace(/<[^>]*>/g, '') // Remove any HTML tags
          headers.push({ level, id, text })
        }
        
        // If no headers with IDs found, try without IDs and generate them
        if (headers.length === 0) {
          const simpleHeaderRegex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi
          while ((match = simpleHeaderRegex.exec(htmlContent)) !== null) {
            const level = parseInt(match[1])
            const text = match[2].replace(/<[^>]*>/g, '')
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            headers.push({ level, id, text })
          }
        }
        
        return headers
      } catch (error) {
        console.error('Error extracting TOC:', error)
        return []
      }
    }
    
    const tableOfContents = extractTableOfContents(post.content)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
        />
        
        <div className="container py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary">Home</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-primary">Blog</Link>
            <span>/</span>
            <span className="line-clamp-1">{post.title}</span>
          </div>

          {/* Back button */}
          <Link href="/blog" className="inline-flex items-center mb-6 text-sm font-medium transition-colors hover:text-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-3">
              {/* Featured Image */}
              {post.featuredImage && (
                <div className="relative aspect-video mb-8 overflow-hidden rounded-lg">
                  <Image
                    src={post.featuredImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {post.postTags.map((postTag) => (
                  <Badge key={postTag.tag.slug} variant="secondary">
                    {postTag.tag.name}
                  </Badge>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{post.author.name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{readingTime} min read</span>
                </div>
              </div>

              {/* Excerpt */}
              {post.excerpt && (
                <div className="text-lg text-muted-foreground mb-8 p-4 bg-muted/30 rounded-lg border-l-4 border-primary">
                  {post.excerpt}
                </div>
              )}

              {/* Content */}
              <div 
                className="prose prose-neutral dark:prose-invert max-w-none prose-lg"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Actions */}
              <div className="flex items-center justify-between pt-8 mt-8 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    Like (42)
                  </Button>
                  <Button variant="outline" size="sm">
                    <BookmarkPlus className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>

              {/* Author Bio */}
              <Card className="mt-8">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold">
                      {(post.author.name || 'A')[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        {post.author.name || 'Anonymous Author'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Content creator passionate about technology, apps, and making complex topics accessible to everyone.
                        Always exploring the latest in software development and user experience design.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">In This Article</h3>
                    <nav className="space-y-2 text-sm">
                      {tableOfContents.map((header, index) => (
                        <a 
                          key={index}
                          href={`#${header.id}`} 
                          className={`block text-muted-foreground hover:text-primary transition-colors ${
                            header.level === 3 ? 'ml-4' : ''
                          }`}
                        >
                          {header.text}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              )}

              {/* Related Posts */}
              {relatedPosts.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Related Articles</h3>
                    <div className="space-y-4">
                      {relatedPosts.map((relatedPost) => (
                        <Link
                          key={relatedPost.id}
                          href={`/blog/${relatedPost.slug}`}
                          className="block group"
                        >
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 mb-1">
                            {relatedPost.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{relatedPost.author.name || 'Anonymous'}</span>
                            <span>•</span>
                            <span>
                              {formatDate(relatedPost.publishedAt || relatedPost.createdAt, {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Newsletter */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Stay Updated</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get the latest posts delivered right to your inbox.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="email"
                      placeholder="Your email"
                      className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
                    />
                    <Button size="sm" className="w-full">
                      Subscribe
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </>
    )
  } catch (error) {
    console.error('Error loading blog post:', error)
    notFound()
  }
}

