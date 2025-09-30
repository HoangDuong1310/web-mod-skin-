/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'http',
        hostname: 'ddragon.leagueoflegends.com',
      },
      {
        protocol: 'https',
        hostname: 'ddragon.leagueoflegends.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://translate.googleapis.com https://translate.google.com https://www.googletagmanager.com https://ssl.google-analytics.com https://www.google-analytics.com https://connect.facebook.net https://static.cloudflareinsights.com https://v1.hitokoto.cn https://fastly.jsdelivr.net https://cubism.live2d.com; script-src-elem 'self' 'unsafe-inline' https://www.googletagmanager.com https://ssl.google-analytics.com https://www.google-analytics.com https://connect.facebook.net https://static.cloudflareinsights.com https://fastly.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; img-src 'self' data: blob: https: https://www.google-analytics.com https://ssl.google-analytics.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: https://translate.googleapis.com https://www.google-analytics.com https://analytics.google.com https://ssl.google-analytics.com https://stats.g.doubleclick.net https://region1.google-analytics.com https://cloudflareinsights.com https://v1.hitokoto.cn https://fastly.jsdelivr.net; object-src 'self' data:; frame-ancestors 'none';",
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      // Fallback to API routes if main sitemap/robots fail
      {
        source: '/sitemap.xml',
        destination: '/sitemap.xml', // First try Next.js MetadataRoute
      },
      {
        source: '/robots.txt',
        destination: '/robots.txt', // First try Next.js MetadataRoute
      },
    ]
  },
}

module.exports = nextConfig
