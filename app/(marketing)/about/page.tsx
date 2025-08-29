import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { prisma } from '@/lib/prisma'
import { 
  Shield, 
  Users, 
  Zap, 
  Award, 
  Download,
  Star,
  Code,
  Heart,
  Globe
} from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  return generateDynamicMetadata({
    title: 'About Us',
    description: 'Learn about our mission to provide the best apps and software for everyone. Trusted by millions of users worldwide.',
    keywords: ['about us', 'company', 'mission', 'apps', 'software'],
  })
}

async function getStats() {
  try {
    const [productCount, downloadCount, overallRating] = await Promise.all([
      // Get total published products
      prisma.product.count({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
        },
      }),
      
      // Get total downloads
      prisma.download.count(),
      
      // Get overall average rating
      prisma.product.aggregate({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          totalReviews: { gt: 0 },
        },
        _avg: {
          averageRating: true,
        },
      }),
    ])

    return {
      appsCount: productCount,
      downloadsCount: downloadCount,
      averageRating: overallRating._avg.averageRating || 4.8,
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      appsCount: 100,
      downloadsCount: 10000,
      averageRating: 4.8,
    }
  }
}

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'Every app is thoroughly tested and scanned for malware before being made available for download.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Our platform is optimized for speed, ensuring quick downloads and seamless user experience.',
  },
  {
    icon: Heart,
    title: 'User Focused',
    description: 'We listen to our community and continuously improve based on user feedback and needs.',
  },
  {
    icon: Award,
    title: 'Quality Assured',
    description: 'Only the highest quality apps make it to our platform. We maintain strict quality standards.',
  },
]

const team = [
  {
    name: 'Alex Johnson',
    role: 'Founder & CEO',
    bio: 'Passionate about bringing the best software to everyone. 10+ years in tech industry.',
    avatar: '👨‍💼',
  },
  {
    name: 'Sarah Chen',
    role: 'Head of Product',
    bio: 'Ensures every app meets our high standards. Former Google product manager.',
    avatar: '👩‍💻',
  },
  {
    name: 'Mike Rodriguez',
    role: 'Lead Developer',
    bio: 'Builds the platform that powers millions of downloads. Full-stack expert.',
    avatar: '👨‍💻',
  },
  {
    name: 'Emma Wilson',
    role: 'Community Manager',
    bio: 'Connects with our amazing community of users and developers worldwide.',
    avatar: '👩‍🎨',
  },
]

const displayStats = [
  { 
    label: 'Apps Available', 
    value: '500+',
    icon: Download 
  },
  { 
    label: 'Total Downloads', 
    value: '100K+',
    icon: Users 
  },
  { 
    label: 'Countries Served', 
    value: '150+',
    icon: Globe 
  },
  { 
    label: 'Average Rating', 
    value: '4.8★',
    icon: Star 
  },
]

export default async function AboutPage() {
  const stats = await getStats()
  
  const dynamicStats = [
    { 
      label: 'Apps Available', 
      value: stats.appsCount >= 500 ? '500+' : `${stats.appsCount}+`,
      icon: Download 
    },
    { 
      label: 'Total Downloads', 
      value: stats.downloadsCount >= 1000000 
        ? `${Math.floor(stats.downloadsCount / 1000000)}M+` 
        : stats.downloadsCount >= 1000 
          ? `${Math.floor(stats.downloadsCount / 1000)}K+`
          : `${stats.downloadsCount.toLocaleString()}+`,
      icon: Users 
    },
    { 
      label: 'Countries Served', 
      value: '150+', // This can remain static as it's about global reach
      icon: Globe 
    },
    { 
      label: 'Average Rating', 
      value: `${Number(stats.averageRating).toFixed(1)}★`,
      icon: Star 
    },
  ]

  return (
    <div className="container py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="mb-4">About Us</Badge>
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          We're on a Mission to Make 
          <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent"> Great Software </span>
          Accessible to Everyone
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Since 2020, we've been curating and providing the best applications and software 
          for millions of users worldwide. Our platform makes it easy to discover, 
          download, and enjoy amazing apps across all your devices.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
        {dynamicStats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="p-6">
              <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Story Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              It all started when our founder, Alex Johnson, struggled to find reliable, 
              safe software for his projects. Existing platforms were either too complicated, 
              unsafe, or simply didn't have the quality apps he needed.
            </p>
            <p>
              That's when the idea was born: create a platform that prioritizes security, 
              quality, and user experience above all else. A place where developers can 
              showcase their best work and users can discover amazing apps with confidence.
            </p>
            <p>
              Today, we're proud to serve over 2 million users across 150+ countries, 
              offering a carefully curated selection of apps that meet our strict quality standards.
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 text-center">
            <div className="text-6xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold mb-2">Launched in 2020</h3>
            <p className="text-muted-foreground">
              From a simple idea to serving millions of users worldwide
            </p>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">What We Stand For</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our core values guide everything we do, from the apps we choose to 
            feature to how we interact with our community.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {values.map((value) => (
            <Card key={value.title} className="border-2">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <value.icon className="h-6 w-6" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  {value.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Team */}
      <div className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The passionate people behind the platform, working hard to bring you 
            the best app discovery experience.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member) => (
            <Card key={member.name} className="text-center">
              <CardHeader>
                <div className="text-4xl mb-3">{member.avatar}</div>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <Badge variant="secondary" className="w-fit mx-auto">
                  {member.role}
                </Badge>
              </CardHeader>
              <CardContent>
                <CardDescription>{member.bio}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mission Statement */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 mb-16 text-center">
        <Code className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          To democratize access to great software by creating a trusted platform where 
          developers can reach users and users can discover amazing apps safely and easily. 
          We believe everyone deserves access to tools that help them be more productive, 
          creative, and connected.
        </p>
      </div>

      {/* CTA Section */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Join Our Community</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Whether you're a user looking for great apps or a developer wanting to share your work, 
          we'd love to have you as part of our growing community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/products" className="inline-flex items-center justify-center h-11 px-8 font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Start Shopping
          </Link>
          <Link href="/contact" className="inline-flex items-center justify-center h-11 px-8 font-medium border border-input bg-background rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  )
}

