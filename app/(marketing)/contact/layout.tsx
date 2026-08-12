import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Liên hệ hỗ trợ | Mod Skin LoL',
  description:
    'Liên hệ đội ngũ Mod Skin LoL để được hỗ trợ cài đặt, xử lý lỗi và góp ý về custom skin League of Legends.',
  alternates: {
    canonical: '/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
