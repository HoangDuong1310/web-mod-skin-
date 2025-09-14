import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
  isActive?: boolean
}

const customSkinsBreadcrumbItems: BreadcrumbItem[] = [
  {
    label: 'All Skins',
    href: '/custom-skins'
  },
  {
    label: 'My Gallery', 
    href: '/custom-skins/gallery'
  },
  {
    label: 'My Submissions',
    href: '/profile/submissions'
  }
]

export function CustomSkinsBreadcrumb() {
  const pathname = usePathname()

  return (
    <div className="border-b bg-muted/50">
      <div className="container py-3">
        <div className="flex items-center space-x-2 text-sm">
          {customSkinsBreadcrumbItems.map((item, index) => {
            const isActive = pathname === item.href
            const isLast = index === customSkinsBreadcrumbItems.length - 1

            return (
              <div key={item.href} className="flex items-center space-x-2">
                <Link 
                  href={item.href as any}
                  className={cn(
                    "hover:text-primary transition-colors",
                    isActive 
                      ? "font-medium text-primary" 
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
                {!isLast && (
                  <span className="text-muted-foreground">•</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CustomSkinsBreadcrumb