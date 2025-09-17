import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SimpleSkinSubmitForm } from '@/components/custom-skins/simple-skin-submit-form'

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

  return <SimpleSkinSubmitForm />
}