import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { Eye, Download, Star } from 'lucide-react'

interface Software {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  stock: number // Using as download count
  averageRating: number
  totalReviews: number
  createdAt: Date
  category?: {
    name: string
    slug: string
  }
  _count: {
    reviews: number
  }
}

interface SoftwareTableProps {
  software: Software[]
}

export function SoftwareTable({ software }: SoftwareTableProps) {
  if (!software.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No software found
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {software.map((item) => (
        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{item.title}</h3>
              <Badge 
                variant={
                  item.status === 'PUBLISHED' ? 'default' : 
                  item.status === 'DRAFT' ? 'secondary' : 
                  'outline'
                }
              >
                {item.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {item.category && (
                <span>{item.category.name}</span>
              )}
              
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                <span>{item.stock.toLocaleString()} downloads</span>
              </div>
              
              {item._count.reviews > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{Number(item.averageRating).toFixed(1)} ({item._count.reviews})</span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              Added {formatDate(item.createdAt)}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button className="p-2 hover:bg-muted rounded-md">
              <Eye className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
