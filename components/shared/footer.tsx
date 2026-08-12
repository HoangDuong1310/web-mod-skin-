import Image from 'next/image'
import Link from 'next/link'
import type { Route } from 'next'

const footerNavigation = {
  explore: [
    { name: 'Ứng dụng Mod Skin LoL', href: '/products' },
    { name: 'Kho custom skins', href: '/custom-skins' },
    { name: 'Danh mục', href: '/categories' },
    { name: 'Blog hướng dẫn', href: '/blog' },
  ],
  information: [
    { name: 'Giới thiệu', href: '/about' },
    { name: 'Liên hệ hỗ trợ', href: '/contact' },
    { name: 'Ủng hộ dự án', href: '/donate' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Link
              href={'/' as Route}
              className="inline-flex items-center gap-3 font-semibold"
            >
              <Image
                src="/images/logo.ico"
                alt="Logo Mod Skin LoL"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span>Mod Skin LoL</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Nơi tổng hợp ứng dụng, custom skin Liên Minh Huyền Thoại và hướng
              dẫn cài đặt dành cho cộng đồng game thủ Việt.
            </p>
            <p className="mt-3 max-w-sm text-xs leading-5 text-muted-foreground">
              Dự án cộng đồng, không liên kết hoặc được Riot Games tài trợ.
            </p>
          </div>
          <FooterColumn title="Khám phá" items={footerNavigation.explore} />
          <FooterColumn
            title="Thông tin"
            items={footerNavigation.information}
          />
        </div>
        <div className="mt-10 border-t pt-8">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Mod Skin LoL. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  items,
}: {
  title: string
  items: Array<{ name: string; href: string }>
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href as Route}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
