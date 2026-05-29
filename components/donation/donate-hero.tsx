// components/donation/donate-hero.tsx
import { GoalProgress } from './goal-progress'

export function DonateHero() {
  return (
    <section className="border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 mb-6">
            Hỗ trợ dự án
          </div>
          <h1 className="text-5xl font-bold tracking-tight leading-[1.1]">
            Giúp WebModSkin<br />tiếp tục miễn phí.
          </h1>
          <p className="mt-6 text-lg text-neutral-600 leading-relaxed">
            Toàn bộ skins, công cụ và bản cập nhật đều miễn phí. Sự ủng hộ của bạn giúp chúng tôi duy trì server, băng thông và phát triển tính năng mới.
          </p>
        </div>
        <div className="mt-12 max-w-2xl">
          <GoalProgress />
        </div>
        <div className="mt-12 flex items-center gap-3">
          <a href="#form" className="px-5 h-11 inline-flex items-center rounded-md bg-black text-white font-medium hover:bg-neutral-800">Ủng hộ ngay</a>
          <a href="#tiers" className="px-5 h-11 inline-flex items-center rounded-md border border-neutral-200 font-medium hover:bg-neutral-50">Xem các mức</a>
        </div>
      </div>
    </section>
  )
}
