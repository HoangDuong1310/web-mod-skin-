'use client'

import { useRouter } from 'next/navigation'
import AddSoftwareForm from '@/components/dashboard/add-software-form'

export default function NewSoftwareClient() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to software management page on success
    router.push('/dashboard/software')
  }

  const handleCancel = () => {
    // Redirect back to software management
    router.push('/dashboard/software')
  }

  return (
    <AddSoftwareForm 
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}
