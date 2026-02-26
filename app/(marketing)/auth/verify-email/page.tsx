'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, ChevronLeft, Mail } from 'lucide-react'

type VerifyState = 'loading' | 'success' | 'already-verified' | 'error'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerifyState>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('No verification token provided.')
      return
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (!res.ok) {
          setState('error')
          setMessage(data.error || 'Verification failed.')
          return
        }

        if (data.alreadyVerified) {
          setState('already-verified')
          setMessage(data.message)
        } else {
          setState('success')
          setMessage(data.message)
        }
      } catch {
        setState('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="container flex items-center justify-center min-h-screen-nav py-12">
      <div className="w-full max-w-md">
        <Link
          href={'/' as Route}
          className="inline-flex items-center mb-6 text-sm font-medium transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {state === 'loading' && (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              )}
              {state === 'success' && (
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              )}
              {state === 'already-verified' && (
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              {state === 'error' && (
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
            <CardTitle className="text-2xl">
              {state === 'loading' && 'Verifying Email...'}
              {state === 'success' && 'Email Verified!'}
              {state === 'already-verified' && 'Already Verified'}
              {state === 'error' && 'Verification Failed'}
            </CardTitle>
            <CardDescription>
              {state === 'loading' && 'Please wait while we verify your email address.'}
              {(state === 'success' || state === 'already-verified' || state === 'error') && message}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {state === 'success' && (
              <Button asChild className="w-full">
                <Link href={'/auth/signin' as Route}>Sign In to Your Account</Link>
              </Button>
            )}

            {state === 'already-verified' && (
              <Button asChild className="w-full">
                <Link href={'/auth/signin' as Route}>Go to Sign In</Link>
              </Button>
            )}

            {state === 'error' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  The verification link may have expired or is invalid. Try signing in to receive a new verification email.
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href={'/auth/signin' as Route}>Go to Sign In</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
