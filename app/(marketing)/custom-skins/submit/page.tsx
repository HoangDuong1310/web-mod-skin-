import { Suspense } from 'react'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SkinSubmitForm from '@/components/custom-skins/skin-submit-form'

export const metadata: Metadata = {
  title: 'Submit Custom Skin - League of Legends Mod Skins',
  description: 'Submit your custom League of Legends skin to share with the community. Upload your mod files and showcase your creativity.',
  keywords: 'submit skin, upload mod, League of Legends, custom skin submission, mod upload',
  robots: {
    index: false,
    follow: false
  }
}

export default async function SubmitSkinPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/custom-skins/submit')
  }

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20 py-16 sm:py-24">
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Submit Your{' '}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Custom Skin
              </span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Share your creativity with the League of Legends community. Upload your custom skin and 
              showcase your work to thousands of players.
            </p>
          </div>
        </div>
      </section>

      {/* Submit Form */}
      <section className="py-12">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <Suspense fallback={
              <div className="bg-card rounded-lg p-8 border">
                <div className="animate-pulse space-y-6">
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-10 bg-muted rounded"></div>
                  <div className="h-6 bg-muted rounded w-1/4"></div>
                  <div className="h-32 bg-muted rounded"></div>
                  <div className="h-10 bg-muted rounded w-32"></div>
                </div>
              </div>
            }>
              <SkinSubmitForm />
            </Suspense>
          </div>
        </div>
      </section>
    </>
  )
}