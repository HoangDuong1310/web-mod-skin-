import type { Metadata } from 'next'
import { DEFAULT_CONFIG } from '@/lib/default-config'

interface SEOConfig {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'product'
  locale?: string
  siteName?: string
}

const defaultConfig = {
  siteName: DEFAULT_CONFIG.siteName,
  description: DEFAULT_CONFIG.siteDescription,
  url: DEFAULT_CONFIG.siteUrl,
  locale: 'en_US',
}

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description = defaultConfig.description,
    keywords = [],
    image,
    url,
    type = 'website',
    locale = defaultConfig.locale,
    siteName = defaultConfig.siteName,
  } = config

  const fullTitle = title ? `${title} | ${siteName}` : siteName
  const fullUrl = url ? `${defaultConfig.url}${url}` : defaultConfig.url
  const imageUrl = image ? (image.startsWith('http') ? image : `${defaultConfig.url}${image}`) : null

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(', '),
    authors: [{ name: siteName }],
    creator: siteName,
    publisher: siteName,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: type as any,
      locale,
      url: fullUrl,
      title: fullTitle,
      description,
      siteName,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || siteName,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: imageUrl ? [imageUrl] : [],
      creator: '@yourhandle', // Update with your Twitter handle
    },
    alternates: {
      canonical: fullUrl,
      languages: {
        'en-US': `${fullUrl}`,
        'vi-VN': `${fullUrl}/vi`,
      },
    },
  }
}

// JSON-LD Schema generators
export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: defaultConfig.siteName,
    description: defaultConfig.description,
    url: defaultConfig.url,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${defaultConfig.url}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${defaultConfig.url}${item.url}`,
    })),
  }
}

interface ProductSchemaData {
  name: string
  description: string
  image?: string[]
  price: number
  currency: string
  availability: 'InStock' | 'OutOfStock'
  category: string
  brand?: string
  sku?: string
  url: string
  reviews?: {
    reviewCount: number
    ratingValue: number
    bestRating?: number
    worstRating?: number
  }
}

export function generateProductSchema(data: ProductSchemaData) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    category: data.category,
    url: `${defaultConfig.url}${data.url}`,
    offers: {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: data.currency,
      availability: `https://schema.org/${data.availability}`,
      url: `${defaultConfig.url}${data.url}`,
    },
  }

  if (data.image && Array.isArray(data.image) && data.image.length > 0) {
    schema.image = data.image.map(img => 
      img.startsWith('http') ? img : `${defaultConfig.url}${img}`
    )
  }

  if (data.brand) {
    schema.brand = {
      '@type': 'Brand',
      name: data.brand,
    }
  }

  if (data.sku) {
    schema.sku = data.sku
  }

  if (data.reviews) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      reviewCount: data.reviews.reviewCount,
      ratingValue: data.reviews.ratingValue,
      bestRating: data.reviews.bestRating || 5,
      worstRating: data.reviews.worstRating || 1,
    }
  }

  return schema
}

interface ArticleSchemaData {
  title: string
  description: string
  content: string
  author: string
  publishedAt: string
  modifiedAt?: string
  image?: string
  url: string
  category?: string
}

export function generateArticleSchema(data: ArticleSchemaData) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    articleBody: data.content,
    author: {
      '@type': 'Person',
      name: data.author,
    },
    publisher: {
      '@type': 'Organization',
      name: defaultConfig.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${defaultConfig.url}/logo.png`,
      },
    },
    datePublished: data.publishedAt,
    dateModified: data.modifiedAt || data.publishedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${defaultConfig.url}${data.url}`,
    },
    image: data.image ? (data.image.startsWith('http') ? data.image : `${defaultConfig.url}${data.image}`) : undefined,
    articleSection: data.category,
  }
}

// Helper to inject JSON-LD script
export function createJsonLdScript(schema: any) {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(schema),
    },
  }
}

