import type { Metadata } from 'next'
import React from 'react'

// Authentication routes (signin/signup/forgot-password/reset-password/verify-email)
// must NOT be indexed by Google. Token URLs (?token=...) and login forms have no
// search value and pollute coverage reports as "Discovered - currently not indexed".
// follow:true keeps internal link equity flowing.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
