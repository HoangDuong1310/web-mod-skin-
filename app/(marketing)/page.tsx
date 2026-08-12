import Image from 'next/image'
import Link from 'next/link'
import type { Metadata, Route } from 'next'
import {
  ArrowRight,
  BookOpen,
  Download,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { generateDynamicMetadata, getSEOSettings } from '@/lib/dynamic-seo'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  return generateDynamicMetadata({ url: '/' })
}

const discoveryCards = [
  {
    icon: Download,
    title: 'Tải Mod Skin LoL',
    description:
      'Xem phiên bản phần mềm mới nhất, yêu cầu hệ thống và hướng dẫn tải đúng tệp.',
    href: '/products',
    cta: 'Xem phiên bản hiện có',
  },
  {
    icon: Gamepad2,
    title: 'Kho custom skin LoL',
    description:
      'Khám phá skin cộng đồng theo tướng, xem ảnh preview và tải từng bản mod riêng.',
    href: '/custom-skins',
    cta: 'Khám phá custom skins',
  },
  {
    icon: BookOpen,
    title: 'Hướng dẫn và xử lý lỗi',
    description:
      'Làm theo hướng dẫn cài đặt, cập nhật và các bước khắc phục lỗi thường gặp.',
    href: '/blog',
    cta: 'Đọc hướng dẫn',
  },
]

const benefits = [
  {
    icon: Sparkles,
    title: 'Nội dung được phân loại',
    description:
      'Tìm nhanh công cụ, custom skin và bài hướng dẫn thay vì tải từ các liên kết không rõ nguồn.',
  },
  {
    icon: Wrench,
    title: 'Hướng dẫn thực tế',
    description:
      'Các bước cài đặt và xử lý lỗi được trình bày rõ ràng cho người mới bắt đầu.',
  },
  {
    icon: ShieldCheck,
    title: 'Thông tin rủi ro minh bạch',
    description:
      'Luôn kiểm tra phiên bản, sao lưu dữ liệu và tuân thủ chính sách hiện hành của Riot Games.',
  },
]

const faqs = [
  {
    question: 'Mod Skin LoL là gì?',
    answer:
      'Mod Skin LoL là công cụ hoặc gói tùy chỉnh thay đổi hình ảnh, hiệu ứng hoặc âm thanh của trang phục ở phía máy người chơi. Đây không phải sản phẩm chính thức của Riot Games.',
  },
  {
    question: 'Tôi nên tải phiên bản nào?',
    answer:
      'Hãy mở trang Ứng dụng, đọc ngày cập nhật, yêu cầu hệ thống và ghi chú tương thích của từng phiên bản trước khi tải.',
  },
  {
    question: 'Vì sao mod skin không hoạt động sau khi LoL cập nhật?',
    answer:
      'Bản cập nhật game có thể thay đổi tệp hoặc cơ chế tương thích. Hãy kiểm tra bản mod mới nhất, xem hướng dẫn xử lý lỗi và không dùng tệp cũ khi chưa xác nhận.',
  },
  {
    question: 'Dùng mod skin có hoàn toàn không có rủi ro không?',
    answer:
      'Không công cụ bên thứ ba nào có thể bảo đảm rủi ro bằng không. Bạn nên đọc chính sách hiện hành của Riot Games, chỉ tải từ nguồn tin cậy và không cung cấp thông tin đăng nhập game.',
  },
]

export default async function HomePage() {
  const [settings, reviews] = await Promise.all([
    getSEOSettings(),
    prisma.review
      .findMany({
        where: {
          isVisible: true,
          deletedAt: null,
          rating: 5,
          product: { is: { deletedAt: null } },
        },
        include: {
          user: { select: { name: true, image: true } },
          product: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
      })
      .catch((error) => {
        console.error('Failed to load homepage reviews:', error)
        return []
      }),
  ])

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c'),
        }}
      />

      <section className="relative isolate overflow-hidden py-20 sm:py-28">
        <Image
          src="/images/img.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={70}
          className="-z-20 object-cover object-center"
        />
        <div
          className="absolute inset-0 -z-10 bg-background/85"
          aria-hidden="true"
        />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Công cụ và custom skin cho Liên Minh Huyền Thoại
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Mod Skin LoL và kho custom skin cập nhật cho game thủ Việt
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              {settings.siteDescription ||
                'Tải Mod Skin LoL, khám phá custom skin Liên Minh Huyền Thoại và xem hướng dẫn cài đặt, cập nhật, xử lý lỗi tại một nơi.'}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center rounded-md bg-primary px-8 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Tải Mod Skin LoL <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/custom-skins"
                className="inline-flex h-12 items-center justify-center rounded-md border border-input bg-background px-8 text-lg font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Xem kho custom skin
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="bat-dau-heading">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="bat-dau-heading"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Bạn muốn bắt đầu từ đâu?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Chọn đúng mục để tải công cụ, tìm skin hoặc xử lý sự cố nhanh hơn.
            </p>
          </div>
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 md:grid-cols-3">
            {discoveryCards.map((item) => (
              <Card key={item.href} className="flex h-full flex-col">
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription className="text-base leading-7">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Link
                    href={item.href as Route}
                    className="inline-flex items-center font-medium text-primary hover:underline"
                  >
                    {item.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section
        className="border-y bg-muted/30 py-16 sm:py-24"
        aria-labelledby="loi-ich-heading"
      >
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="loi-ich-heading"
              className="text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Thông tin cần thiết trước khi cài mod skin
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-3">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <benefit.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{benefit.title}</h3>
                <p className="mt-3 leading-7 text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-xl border bg-background p-6">
            <h3 className="text-xl font-semibold">Cài đặt theo 3 bước</h3>
            <ol className="mt-4 grid gap-4 sm:grid-cols-3">
              <li>
                <strong className="block text-primary">01. Kiểm tra</strong>
                <span className="text-sm text-muted-foreground">
                  Đọc phiên bản và yêu cầu hệ thống.
                </span>
              </li>
              <li>
                <strong className="block text-primary">02. Tải đúng tệp</strong>
                <span className="text-sm text-muted-foreground">
                  Dùng liên kết trên trang chi tiết sản phẩm.
                </span>
              </li>
              <li>
                <strong className="block text-primary">
                  03. Làm theo hướng dẫn
                </strong>
                <span className="text-sm text-muted-foreground">
                  Cài đặt, khởi động và kiểm tra trong game.
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24" aria-labelledby="faq-heading">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <h2
              id="faq-heading"
              className="text-center text-3xl font-bold tracking-tight sm:text-4xl"
            >
              Câu hỏi thường gặp về Mod Skin LoL
            </h2>
            <div className="mt-10 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-lg border bg-card p-5"
                >
                  <summary className="cursor-pointer list-none font-semibold">
                    {faq.question}
                  </summary>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Mod Skin LoL là dự án cộng đồng và không liên kết, tài trợ hoặc
              xác nhận bởi Riot Games.
            </p>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section
          className="border-t bg-muted/30 py-16 sm:py-24"
          aria-labelledby="danh-gia-heading"
        >
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                id="danh-gia-heading"
                className="text-3xl font-bold tracking-tight sm:text-4xl"
              >
                Đánh giá từ người dùng
              </h2>
              <p className="mt-4 text-muted-foreground">
                Phản hồi mới nhất đã được công khai trên nền tảng.
              </p>
            </div>
            <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardHeader>
                    <div
                      className="flex items-center gap-1"
                      role="img"
                      aria-label={`${review.rating || 5} trên 5 sao`}
                    >
                      {Array.from({
                        length: Math.max(1, Math.min(5, review.rating || 5)),
                      }).map((_, index) => (
                        <Star
                          key={index}
                          className="h-4 w-4 fill-yellow-400 text-yellow-400"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <blockquote className="text-sm leading-6 text-muted-foreground">
                      “{review.content}”
                    </blockquote>
                    <cite className="mt-4 block text-sm font-semibold not-italic">
                      {review.user?.name || review.guestName || 'Người dùng'}
                    </cite>
                    <p className="text-xs text-muted-foreground">
                      {review.product?.title || 'Mod Skin LoL'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
