import { Suspense } from 'react'
import { Metadata } from 'next'
import CustomSkinsPage from '@/components/custom-skins/custom-skins-page'
import CustomSkinsLoading from '@/components/custom-skins/custom-skins-loading'

export const metadata: Metadata = {
  title: 'Custom Skins - League of Legends Mod Collection',
  description: 'Discover amazing custom skins for League of Legends champions created by our talented community. Transform your favorite champions with unique, high-quality mods.',
  keywords: 'League of Legends, custom skins, LOL mods, champion skins, game modifications, community skins',
}

export default function CustomSkinsPageRoute() {
  return (
    <div className="container py-12">
      <Suspense fallback={<CustomSkinsLoading />}>
        <CustomSkinsPage />
      </Suspense>
    </div>
  )
}
