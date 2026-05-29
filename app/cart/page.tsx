import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart } from 'lucide-react'

// Sales/cart page — keep out of the search index (donate-first site).
// Crawlable (not blocked in robots.txt) so Google can read this noindex and
// drop any already-indexed /cart URL. follow:true still lets links be crawled.
export const metadata = {
  robots: { index: false, follow: true },
}

export default function CartPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground">
                Add some products to get started!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
