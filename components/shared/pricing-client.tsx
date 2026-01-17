'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Star, Zap, Sparkles, Globe } from 'lucide-react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  nameEn?: string
  slug: string
  description: string | null
  descriptionEn?: string | null
  price: number
  comparePrice: number | null
  currency: string
  priceUsd?: number | null
  comparePriceUsd?: number | null
  durationType: string
  durationValue: number
  features: string[]
  featuresEn?: string[]
  maxDevices: number
  isPopular: boolean
  isFeatured: boolean
  color: string | null
  // Transformed fields
  displayName?: string
  displayDescription?: string | null
  displayPrice?: number
  displayComparePrice?: number | null
  displayCurrency?: string
  displayFeatures?: string[]
}

interface PricingClientProps {
  plans: Plan[]
  initialCurrency?: 'VND' | 'USD'
  initialLocale?: 'vi' | 'en'
}

const durationLabels: Record<string, { vi: string; en: string }> = {
  DAY: { vi: 'ngày', en: 'day' },
  WEEK: { vi: 'tuần', en: 'week' },
  MONTH: { vi: 'tháng', en: 'month' },
  QUARTER: { vi: 'quý', en: 'quarter' },
  YEAR: { vi: 'năm', en: 'year' },
  LIFETIME: { vi: '', en: '' },
}

export function PricingClient({ plans, initialCurrency = 'VND', initialLocale = 'vi' }: PricingClientProps) {
  const [currency, setCurrency] = useState<'VND' | 'USD'>(initialCurrency)
  const locale = currency === 'USD' ? 'en' : 'vi'
  
  const formatPrice = (price: number, curr: string) => {
    if (curr === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price)
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(price)
  }

  const formatDuration = (type: string, value: number) => {
    if (type === 'LIFETIME') return locale === 'vi' ? 'Vĩnh viễn' : 'Lifetime'
    const label = durationLabels[type]?.[locale] || durationLabels[type]?.vi || ''
    return `${value} ${label}`
  }

  const getDiscount = (price: number, comparePrice: number | null) => {
    if (!comparePrice || comparePrice <= price) return null
    return Math.round((1 - price / comparePrice) * 100)
  }
  
  // Get price based on currency
  const getPrice = (plan: Plan) => {
    if (currency === 'USD' && plan.priceUsd) {
      return Number(plan.priceUsd)
    }
    return plan.displayPrice || Number(plan.price)
  }
  
  const getComparePrice = (plan: Plan) => {
    if (currency === 'USD' && plan.comparePriceUsd) {
      return Number(plan.comparePriceUsd)
    }
    return plan.displayComparePrice || (plan.comparePrice ? Number(plan.comparePrice) : null)
  }
  
  const getName = (plan: Plan) => {
    if (currency === 'USD' && plan.nameEn) return plan.nameEn
    return plan.displayName || plan.name
  }
  
  const getDescription = (plan: Plan) => {
    if (currency === 'USD' && plan.descriptionEn) return plan.descriptionEn
    return plan.displayDescription || plan.description
  }
  
  const getFeatures = (plan: Plan): string[] => {
    if (currency === 'USD' && plan.featuresEn && plan.featuresEn.length > 0) {
      return plan.featuresEn
    }
    return plan.displayFeatures || plan.features || []
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {locale === 'vi' ? 'Hiện chưa có gói cước nào. Vui lòng quay lại sau!' : 'No plans available. Please check back later!'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Currency Switcher */}
      <div className="flex justify-center gap-2">
        <Button
          variant={currency === 'VND' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrency('VND')}
        >
          🇻🇳 VND
        </Button>
        <Button
          variant={currency === 'USD' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCurrency('USD')}
        >
          🌍 USD
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plans.map((plan) => {
          const price = getPrice(plan)
          const comparePrice = getComparePrice(plan)
          const discount = getDiscount(price, comparePrice)
          const isHighlighted = plan.isPopular || plan.isFeatured
          const name = getName(plan)
          const description = getDescription(plan)
          const features = getFeatures(plan)
        
          return (
          <Card 
            key={plan.id} 
            className={`relative flex flex-col ${isHighlighted ? 'border-primary shadow-lg scale-105' : ''}`}
            style={plan.color ? { borderColor: plan.color } : undefined}
          >
            {/* Badges */}
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {locale === 'vi' ? 'Phổ biến nhất' : 'Most Popular'}
                </Badge>
              </div>
            )}
            {plan.isFeatured && !plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <Badge variant="secondary" className="px-3 py-1">
                  <Zap className="h-3 w-3 mr-1" />
                  {locale === 'vi' ? 'Đề xuất' : 'Recommended'}
                </Badge>
              </div>
            )}
            {discount && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge variant="destructive" className="px-2 py-1">
                  -{discount}%
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{name}</CardTitle>
              <CardDescription>
                {formatDuration(plan.durationType, plan.durationValue)}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 text-center">
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">
                    {formatPrice(price, currency)}
                  </span>
                </div>
                {comparePrice && (
                  <div className="text-muted-foreground line-through text-sm mt-1">
                    {formatPrice(comparePrice, currency)}
                  </div>
                )}
                {plan.durationType !== 'LIFETIME' && (
                  <div className="text-sm text-muted-foreground mt-1">
                    / {formatDuration(plan.durationType, plan.durationValue)}
                  </div>
                )}
              </div>

              {/* Description */}
              {description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {description}
                </p>
              )}

              {/* Device limit */}
              <div className="mb-4 text-sm">
                <Badge variant="outline">
                  {locale === 'vi' ? `Tối đa ${plan.maxDevices} thiết bị` : `Max ${plan.maxDevices} devices`}
                </Badge>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <ul className="space-y-2 text-left">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                variant={isHighlighted ? 'default' : 'outline'}
                asChild
              >
                <Link href={`/checkout/${plan.slug}?currency=${currency}`}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {locale === 'vi' ? 'Mua ngay' : 'Buy Now'}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        )
      })}
      </div>
    </div>
  )
}
