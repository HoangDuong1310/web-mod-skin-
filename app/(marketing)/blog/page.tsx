import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'
import { formatDate, truncate } from '@/lib/utils'
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { Calendar, User, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return generateDynamicMetadata({
    title: 'Blog',
    description:
      'Latest news, updates, and insights about apps, technology, and software development.',
    keywords: ['blog', 'tech news', 'app updates', 'software', 'technology'],
    url: '/blog',
  })
}

export default async function BlogPage() {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        publishedAt: {
          lte: new Date(),
        },
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
      orderBy: {
        publishedAt: 'desc',
      },
      take: 12,
    })

    const featuredPost = posts.find((post) => post.featured) || posts[0]
    const regularPosts = posts.filter((post) => post.id !== featuredPost?.id)

    return (
      <div className="container py-12">
        {/* Header */}
        <div className="mb-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Blog
          </Badge>
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            Latest from Our Blog
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Stay updated with the latest news, app releases, tech insights, and
            behind-the-scenes stories from our team.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="default">Featured</Badge>
              <span className="text-sm text-muted-foreground">Latest Post</span>
            </div>

            <Card className="overflow-hidden border-2 border-primary/20 transition-colors hover:border-primary/40">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {featuredPost.featuredImage && (
                  <div className="relative aspect-video lg:aspect-auto">
                    <Image
                      src={featuredPost.featuredImage}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <div className="flex flex-col justify-center p-6 lg:p-8">
                  <div className="mb-4 flex flex-wrap gap-2">
                    {featuredPost.postTags.slice(0, 2).map((postTag) => (
                      <Badge key={postTag.tag.slug} variant="secondary">
                        {postTag.tag.name}
                      </Badge>
                    ))}
                  </div>

                  <CardTitle className="mb-4 line-clamp-2 text-2xl">
                    {featuredPost.title}
                  </CardTitle>

                  <CardDescription className="mb-6 line-clamp-3 text-base">
                    {featuredPost.excerpt ||
                      truncate(
                        featuredPost.content.replace(/<[^>]*>/g, ''),
                        200
                      )}
                  </CardDescription>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {featuredPost.author.name || 'Anonymous'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(
                          featuredPost.publishedAt || featuredPost.createdAt
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />5 min read
                      </div>
                    </div>

                    <Button asChild>
                      <Link href={`/blog/${featuredPost.slug}`}>
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Regular Posts Grid */}
        {regularPosts.length > 0 ? (
          <>
            <h2 className="mb-8 text-2xl font-bold">More Articles</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularPosts.map((post) => (
                <Card
                  key={post.id}
                  className="group transition-shadow hover:shadow-lg"
                >
                  {post.featuredImage && (
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={post.featuredImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  )}

                  <CardHeader>
                    <div className="mb-2 flex flex-wrap gap-1">
                      {post.postTags.slice(0, 2).map((postTag) => (
                        <Badge
                          key={postTag.tag.slug}
                          variant="outline"
                          className="text-xs"
                        >
                          {postTag.tag.name}
                        </Badge>
                      ))}
                    </div>

                    <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <CardDescription className="mb-4 line-clamp-3">
                      {post.excerpt ||
                        truncate(post.content.replace(/<[^>]*>/g, ''), 120)}
                    </CardDescription>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {post.author.name || 'Anonymous'}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.publishedAt || post.createdAt, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <span>3 min read</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          !featuredPost && (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">📝</div>
              <h3 className="mb-2 text-xl font-semibold">No Blog Posts Yet</h3>
              <p className="mb-6 text-muted-foreground">
                We're working on some amazing content. Check back soon for the
                latest updates and insights!
              </p>
              <Button asChild>
                <Link href="/products">Browse Apps Instead</Link>
              </Button>
            </div>
          )
        )}

        {/* Newsletter Signup */}
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold">Stay Updated</h2>
          <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
            Subscribe to our newsletter to get the latest blog posts, app
            updates, and exclusive content delivered to your inbox.
          </p>
          <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-md border border-input bg-background px-4 py-2"
            />
            <Button>
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Topics */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-semibold">
            Popular Topics
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              'App Reviews',
              'Tech News',
              'Development Tips',
              'Mobile Apps',
              'Productivity',
              'Security',
              'UI/UX Design',
              'Platform Updates',
            ].map((topic) => (
              <Badge
                key={topic}
                variant="outline"
                className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error loading blog posts:', error)

    return (
      <div className="container py-12 text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-4 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          We're having trouble loading the blog posts. Please try again later.
        </p>
        <Button asChild>
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    )
  }
}
