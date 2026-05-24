import { redirect } from 'next/navigation'

// App is now free - no checkout needed
export default function CheckoutPage() {
  redirect('/products')
}
