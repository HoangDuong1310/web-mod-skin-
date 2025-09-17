import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate } from '@/lib/utils'
import type { Product, Category } from '@prisma/client'

interface ProductsTableProps {
  products: (Product & { category: Pick<Category, 'name' | 'slug'> | null })[]
}

export function ProductsTable({ products }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No products found
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Product</th>
              <th className="px-4 py-3 text-left font-medium">Category</th>
              <th className="px-4 py-3 text-left font-medium">Price</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Stock</th>
              <th className="px-4 py-3 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b">
                <td className="px-4 py-3">
                  <div className="font-medium">{product.title}</div>
                  <div className="text-muted-foreground">{product.slug}</div>
                </td>
                <td className="px-4 py-3">
                  {product.category ? (
                    <span className="text-muted-foreground">
                      {product.category.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No category</span>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">
                  {formatPrice(Number(product.price))}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      product.status === 'PUBLISHED'
                        ? 'default'
                        : product.status === 'DRAFT'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {product.status.toLowerCase()}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      product.stock > 0 
                        ? 'text-foreground' 
                        : 'text-destructive'
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(product.createdAt, { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


