'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DonationFormClean from '@/components/shared/donation-form-clean'

export default function DonatePage() {
  const router = useRouter()

  const handleSuccess = () => {
    console.log('handleSuccess called, redirecting to thank you page')
    // Use window.location instead of router.push for more reliable redirect
    window.location.href = '/donate/thank-you'
  }

  const handleCancel = () => {
    router.push('/')
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Debug: Donate Page</h1>
      <button 
        onClick={() => {
          console.log('Test redirect')
          router.push('/donate/thank-you')
        }}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Direct Redirect
      </button>
      <DonationFormClean 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}
