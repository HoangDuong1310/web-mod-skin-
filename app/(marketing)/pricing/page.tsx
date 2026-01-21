import { Metadata } from 'next'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateDynamicMetadata } from '@/lib/dynamic-seo'
import { PricingClient } from '@/components/shared/pricing-client'
import { getCountryFromHeaders, getCurrencyForCountry } from '@/lib/geo'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return generateDynamicMetadata({
    title: 'Bảng giá',
    description: 'Chọn gói cước phù hợp với nhu cầu của bạn',
    url: '/pricing',
  })
}

async function getPlans() {
  const plans = await prisma.subscriptionPlan.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      // Exclude HOUR plans (free keys) - they are for ad bypass only
      durationType: { not: 'HOUR' },
    },
    select: {
      id: true,
      name: true,
      nameEn: true,
      slug: true,
      description: true,
      descriptionEn: true,
      price: true,
      comparePrice: true,
      currency: true,
      priceUsd: true,
      comparePriceUsd: true,
      durationType: true,
      durationValue: true,
      features: true,
      featuresEn: true,
      maxDevices: true,
      isPopular: true,
      isFeatured: true,
      color: true,
    },
    orderBy: [
      { priority: 'desc' },
      { price: 'asc' },
    ],
  })

  return plans.map(plan => ({
    ...plan,
    price: Number(plan.price),
    comparePrice: plan.comparePrice ? Number(plan.comparePrice) : null,
    priceUsd: plan.priceUsd ? Number(plan.priceUsd) : null,
    comparePriceUsd: plan.comparePriceUsd ? Number(plan.comparePriceUsd) : null,
    features: plan.features ? JSON.parse(plan.features) : [],
    featuresEn: plan.featuresEn ? JSON.parse(plan.featuresEn) : [],
  }))
}

export default async function PricingPage() {
  const plans = await getPlans()

  // Detect country/currency from headers
  const headersList = headers()
  const countryCode = getCountryFromHeaders(headersList)
  const initialCurrency = getCurrencyForCountry(countryCode)
  const isVN = initialCurrency === 'VND'

  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          {isVN ? 'Chọn gói phù hợp với bạn' : 'Choose the right plan for you'}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {isVN
            ? 'Tất cả các gói đều bao gồm đầy đủ tính năng. Chọn thời hạn phù hợp với nhu cầu sử dụng của bạn.'
            : 'All plans include full features. Choose the duration that suits your needs.'}
        </p>
      </div>

      <PricingClient plans={plans} initialCurrency={initialCurrency} />

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">
          {isVN ? 'Câu hỏi thường gặp' : 'Frequently Asked Questions'}
        </h2>
        <div className="max-w-3xl mx-auto text-left space-y-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {isVN ? 'License key hoạt động như thế nào?' : 'How does the license key work?'}
            </h3>
            <p className="text-muted-foreground">
              {isVN
                ? 'Sau khi thanh toán, bạn sẽ nhận được một license key qua email. Nhập key này vào ứng dụng để kích hoạt và sử dụng đầy đủ tính năng.'
                : 'After payment, you will receive a license key via email. Enter this key in the application to activate and use all features.'}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {isVN ? 'Tôi có thể sử dụng trên bao nhiêu thiết bị?' : 'How many devices can I use?'}
            </h3>
            <p className="text-muted-foreground">
              {isVN
                ? 'Số thiết bị tối đa được ghi rõ ở mỗi gói. Bạn có thể hủy kích hoạt thiết bị cũ để kích hoạt trên thiết bị mới nếu cần.'
                : 'Maximum devices are specified for each plan. You can deactivate old devices to activate on new ones if needed.'}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {isVN ? 'Key có thể chuyển nhượng được không?' : 'Can the key be transferred?'}
            </h3>
            <p className="text-muted-foreground">
              {isVN
                ? 'Key được gắn với thiết bị (HWID) nên không thể chuyển nhượng. Vui lòng liên hệ hỗ trợ nếu cần reset thiết bị.'
                : 'Keys are bound to devices (HWID) and cannot be transferred. Please contact support if you need to reset devices.'}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {isVN ? 'Chính sách hoàn tiền?' : 'Refund policy?'}
            </h3>
            <p className="text-muted-foreground">
              {isVN
                ? 'Chúng tôi hỗ trợ hoàn tiền trong vòng 7 ngày nếu key chưa được kích hoạt. Vui lòng liên hệ qua trang Contact để được hỗ trợ.'
                : 'We support refunds within 7 days if the key has not been activated. Please contact us through the Contact page for assistance.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
