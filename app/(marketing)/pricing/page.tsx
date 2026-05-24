import { redirect } from 'next/navigation'

// App is now free - no pricing page needed
export default function PricingPage() {
  redirect('/products')
}
