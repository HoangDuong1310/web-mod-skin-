import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { CheckoutClient } from '@/components/checkout/checkout-client'
import { getCountryFromHeaders, getCurrencyForCountry } from '@/lib/geo'

interface CheckoutPageProps {
  params: { planSlug: string }
  searchParams: { currency?: string }
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { 
      slug: params.planSlug,
      isActive: true,
      deletedAt: null,
    },
  })

  if (!plan) {
    notFound()
  }

  // Detect currency from URL param or headers
  const headersList = headers()
  const countryCode = getCountryFromHeaders(headersList)
  const detectedCurrency = getCurrencyForCountry(countryCode)
  const currency = searchParams.currency === 'USD' || searchParams.currency === 'VND' 
    ? searchParams.currency 
    : detectedCurrency
  const isVN = currency === 'VND'

  // Serialize plan for client with currency-specific data
  const serializedPlan = {
    id: plan.id,
    name: isVN ? plan.name : (plan.nameEn || plan.name),
    slug: plan.slug,
    description: isVN ? plan.description : (plan.descriptionEn || plan.description),
    price: isVN ? Number(plan.price) : (plan.priceUsd ? Number(plan.priceUsd) : Number(plan.price)),
    comparePrice: isVN 
      ? (plan.comparePrice ? Number(plan.comparePrice) : null)
      : (plan.comparePriceUsd ? Number(plan.comparePriceUsd) : null),
    currency: currency,
    durationType: plan.durationType,
    durationValue: plan.durationValue,
    features: isVN 
      ? (plan.features ? JSON.parse(plan.features as string) : [])
      : (plan.featuresEn ? JSON.parse(plan.featuresEn as string) : (plan.features ? JSON.parse(plan.features as string) : [])),
    maxDevices: plan.maxDevices,
    // Keep original VND price for actual payment
    originalPriceVND: Number(plan.price),
  }

  return <CheckoutClient plan={serializedPlan} />
}

export async function generateMetadata({ params, searchParams }: CheckoutPageProps) {
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { slug: params.planSlug },
  })

  if (!plan) {
    return { title: 'Plan not found' }
  }

  const isVN = searchParams.currency !== 'USD'
  const name = isVN ? plan.name : (plan.nameEn || plan.name)

  return {
    title: isVN ? `Thanh toán - ${name}` : `Checkout - ${name}`,
    description: isVN ? `Mua gói ${name}` : `Purchase ${name} plan`,
  }
}
