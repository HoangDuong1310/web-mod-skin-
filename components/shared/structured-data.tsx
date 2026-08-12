interface StructuredDataProps {
  data: Record<string, any>
}

export function StructuredData({ data }: StructuredDataProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}

// Website Schema
export function WebsiteStructuredData({
  siteName,
  siteDescription,
  siteUrl,
}: {
  siteName: string
  siteDescription: string
  siteUrl: string
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description: siteDescription,
    url: siteUrl,
  }

  return <StructuredData data={schema} />
}

// Organization Schema
export function OrganizationStructuredData({
  siteName,
  siteDescription,
  siteUrl,
  logo,
  socialLinks,
}: {
  siteName: string
  siteDescription: string
  siteUrl: string
  logo?: string
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    description: siteDescription,
    url: siteUrl,
    ...(logo && { logo: logo.startsWith('http') ? logo : `${siteUrl}${logo}` }),
    sameAs: Object.values(socialLinks || {}).filter(Boolean),
  }

  return <StructuredData data={schema} />
}
