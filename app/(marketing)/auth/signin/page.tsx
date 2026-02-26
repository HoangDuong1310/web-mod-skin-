'use client'

import { useState } from 'react'
import type { Route } from 'next'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getPostLoginRedirectUrl } from '@/lib/redirect-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  ChevronLeft,
  Github,
  Chrome,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackParam = searchParams.get('callbackUrl')
  const callbackUrl: Route = (callbackParam as Route) || ('/' as Route)
  const error = searchParams.get('error')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError('')
    setShowVerifyPrompt(false)

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        // Check if it's an unverified email error
        if (result.error.includes('EMAIL_NOT_VERIFIED') || result.error === 'CredentialsSignin') {
          // Try to detect if it's email-not-verified by attempting a check
          try {
            const checkRes = await fetch('/api/auth/resend-verification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: formData.email }),
            })
            const checkData = await checkRes.json()
            if (checkData.alreadyVerified) {
              setFormError('Email hoặc mật khẩu không đúng')
            } else if (checkRes.ok) {
              setShowVerifyPrompt(true)
              setFormError('Email chưa được xác minh. Chúng tôi đã gửi lại email xác minh cho bạn.')
            } else {
              setFormError('Email hoặc mật khẩu không đúng')
            }
          } catch {
            setFormError('Email hoặc mật khẩu không đúng')
          }
        } else {
          setFormError('Email hoặc mật khẩu không đúng')
        }
      } else {
        // Check if sign in was successful
        const session = await getSession()
        if (session) {
          const redirectUrl = getPostLoginRedirectUrl(session, callbackParam || undefined)
          router.push(redirectUrl as Route)
        } else {
          setFormError('Authentication failed. Please try again.')
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setFormError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true)
    try {
      await signIn(provider, {
        callbackUrl: callbackParam || '/',
        redirect: true
      })
    } catch (error) {
      console.error('OAuth sign in error:', error)
      setFormError('OAuth sign in failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResending(true)
    setResendMessage('')
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      })
      const data = await response.json()
      if (response.ok) {
        setResendMessage('Email xác minh đã được gửi lại!')
      } else {
        setResendMessage(data.error || 'Không thể gửi lại email')
      }
    } catch {
      setResendMessage('Lỗi mạng. Vui lòng thử lại.')
    } finally {
      setResending(false)
    }
  }

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password'
      case 'OAuthSignin':
        return 'Error occurred during OAuth sign in'
      case 'OAuthCallback':
        return 'Error occurred during OAuth callback'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account'
      case 'EmailCreateAccount':
        return 'Could not create email account'
      case 'Callback':
        return 'Error occurred during callback'
      case 'OAuthAccountNotLinked':
        return 'Email already exists with different provider'
      case 'EmailSignin':
        return 'Could not send email'
      case 'CredentialsSignup':
        return 'Could not create account'
      case 'SessionRequired':
        return 'Please sign in to access this page'
      default:
        return error ? 'An error occurred during authentication' : null
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen-nav py-12">
      <div className="w-full max-w-md">
        {/* Back to home */}
        <Link href={'/' as Route} className="inline-flex items-center mb-6 text-sm font-medium transition-colors hover:text-primary">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to access the admin panel
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Verification Prompt */}
            {showVerifyPrompt && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
                <Mail className="h-4 w-4 text-amber-600" />
                <AlertDescription className="space-y-3">
                  <p className="text-amber-800 dark:text-amber-200">
                    Your email has not been verified. A verification email has been sent to <strong>{formData.email}</strong>.
                  </p>
                  {resendMessage && (
                    <p className="text-sm text-amber-700 dark:text-amber-300">{resendMessage}</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resending}
                    onClick={handleResendVerification}
                    className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-950"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Error Messages */}
            {!showVerifyPrompt && (error || formError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {getErrorMessage(error) || formError}
                </AlertDescription>
              </Alert>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* OAuth Options */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                onClick={() => handleOAuthSignIn('google')}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Google
              </Button>
              <Button
                variant="outline"
                type="button"
                disabled={isLoading}
                onClick={() => handleOAuthSignIn('github')}
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </Button>
            </div>

            {/* Footer Links */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href={'/auth/signup' as Route} className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
              <Link href={'/auth/forgot-password' as Route} className="text-sm text-primary hover:underline">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link href={'/terms' as Route} className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href={'/privacy' as Route} className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}


