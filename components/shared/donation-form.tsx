'use client'

"use client"

import DonationFormClean from './donation-form-clean'

export interface DonationGoal {
  id: string
  title: string
  currency: string
}

export interface DonationFormProps {
  goal?: DonationGoal | null
  onSuccess?: () => void
  onCancel?: () => void
}

export function DonationForm(props: DonationFormProps) {
  return <DonationFormClean {...props} />
}
