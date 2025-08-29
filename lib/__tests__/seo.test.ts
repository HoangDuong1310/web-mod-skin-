import { describe, it, expect } from 'vitest'
import { 
  generateMetadata, 
  generateWebsiteSchema, 
  generateBreadcrumbSchema,
  generateProductSchema,
  generateArticleSchema 
} from '../seo'

describe('SEO utilities', () => {
  describe('generateMetadata', () => {
    it('should generate basic metadata', () => {
      const metadata = generateMetadata({
        title: 'Test Page',
        description: 'Test description',
        keywords: ['test', 'page'],
      })

      expect(metadata.title).toBe('Test Page | Test App')
      expect(metadata.description).toBe('Test description')
      expect(metadata.keywords).toBe('test, page')
      expect(metadata.openGraph?.title).toBe('Test Page | Test App')
      expect(metadata.openGraph?.description).toBe('Test description')
      expect(metadata.twitter?.title).toBe('Test Page | Test App')
      expect(metadata.twitter?.description).toBe('Test description')
    })

    it('should handle missing title', () => {
      const metadata = generateMetadata({
        description: 'Test description',
      })

      expect(metadata.title).toBe('Test App')
    })

    it('should generate correct canonical URL', () => {
      const metadata = generateMetadata({
        title: 'Test Page',
        url: '/test-page',
      })

      expect(metadata.alternates?.canonical).toBe('http://localhost:3000/test-page')
    })
  })

  describe('generateWebsiteSchema', () => {
    it('should generate correct website schema', () => {
      const schema = generateWebsiteSchema()

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('WebSite')
      expect(schema.name).toBe('Test App')
      expect(schema.url).toBe('http://localhost:3000')
      expect(schema.potentialAction).toEqual({
        '@type': 'SearchAction',
        target: 'http://localhost:3000/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      })
    })
  })

  describe('generateBreadcrumbSchema', () => {
    it('should generate correct breadcrumb schema', () => {
      const items = [
        { name: 'Home', url: '/' },
        { name: 'Products', url: '/products' },
        { name: 'Smartphones', url: '/products/smartphones' },
      ]

      const schema = generateBreadcrumbSchema(items)

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(3)
      expect(schema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'http://localhost:3000/',
      })
      expect(schema.itemListElement[2]).toEqual({
        '@type': 'ListItem',
        position: 3,
        name: 'Smartphones',
        item: 'http://localhost:3000/products/smartphones',
      })
    })
  })

  describe('generateProductSchema', () => {
    it('should generate correct product schema', () => {
      const productData = {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with Pro camera system',
        price: 999.99,
        currency: 'USD',
        availability: 'InStock' as const,
        category: 'Electronics',
        brand: 'Apple',
        sku: 'IPHONE15PRO',
        url: '/products/iphone-15-pro',
        image: ['https://example.com/image1.jpg'],
        reviews: {
          reviewCount: 100,
          ratingValue: 4.5,
        },
      }

      const schema = generateProductSchema(productData)

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Product')
      expect(schema.name).toBe('iPhone 15 Pro')
      expect(schema.description).toBe('Latest iPhone with Pro camera system')
      expect(schema.category).toBe('Electronics')
      expect(schema.sku).toBe('IPHONE15PRO')
      expect(schema.brand).toEqual({
        '@type': 'Brand',
        name: 'Apple',
      })
      expect(schema.offers).toEqual({
        '@type': 'Offer',
        price: 999.99,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        url: 'http://localhost:3000/products/iphone-15-pro',
      })
      expect(schema.aggregateRating).toEqual({
        '@type': 'AggregateRating',
        reviewCount: 100,
        ratingValue: 4.5,
        bestRating: 5,
        worstRating: 1,
      })
    })
  })

  describe('generateArticleSchema', () => {
    it('should generate correct article schema', () => {
      const articleData = {
        title: 'The Future of Technology',
        description: 'Exploring upcoming tech trends',
        content: 'Article content here...',
        author: 'John Doe',
        publishedAt: '2024-01-01T00:00:00Z',
        modifiedAt: '2024-01-02T00:00:00Z',
        url: '/blog/future-of-technology',
        category: 'Technology',
        image: 'https://example.com/article-image.jpg',
      }

      const schema = generateArticleSchema(articleData)

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Article')
      expect(schema.headline).toBe('The Future of Technology')
      expect(schema.description).toBe('Exploring upcoming tech trends')
      expect(schema.author).toEqual({
        '@type': 'Person',
        name: 'John Doe',
      })
      expect(schema.publisher).toEqual({
        '@type': 'Organization',
        name: 'Test App',
        logo: {
          '@type': 'ImageObject',
          url: 'http://localhost:3000/logo.png',
        },
      })
      expect(schema.datePublished).toBe('2024-01-01T00:00:00Z')
      expect(schema.dateModified).toBe('2024-01-02T00:00:00Z')
      expect(schema.mainEntityOfPage).toEqual({
        '@type': 'WebPage',
        '@id': 'http://localhost:3000/blog/future-of-technology',
      })
      expect(schema.image).toBe('https://example.com/article-image.jpg')
      expect(schema.articleSection).toBe('Technology')
    })
  })
})

