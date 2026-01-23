'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Key, Copy, CheckCircle2, Loader2, ArrowLeft, Clock } from 'lucide-react'
import { formatDateVN } from '@/lib/utils'
import Link from 'next/link'

interface KeyData {
    key: string
    expiresAt: string
    maxDevices: number
    duration: string
}

interface SessionData {
    status: string
    product: {
        id: string
        title: string
        slug: string
    }
    licenseKey: KeyData | null
    expiresAt: string
    isExpired: boolean
}

function ClaimPageContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(true)
    const [claiming, setClaiming] = useState(false)
    const [session, setSession] = useState<SessionData | null>(null)
    const [keyData, setKeyData] = useState<KeyData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!token) {
            setError('Invalid token')
            setLoading(false)
            return
        }

        // Check session status
        const checkSession = async () => {
            try {
                const response = await fetch(`/api/free-key/claim?token=${token}`)
                const data = await response.json()

                if (!response.ok) {
                    setError(data.error || 'Session not found')
                    return
                }

                setSession(data)

                if (data.status === 'CLAIMED' && data.licenseKey) {
                    setKeyData(data.licenseKey)
                }
            } catch (err) {
                setError('Failed to load session')
            } finally {
                setLoading(false)
            }
        }

        checkSession()
    }, [token])

    const handleClaim = async () => {
        if (!token) return

        setClaiming(true)

        try {
            const response = await fetch('/api/free-key/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken: token })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to claim key')
            }

            setKeyData({
                key: data.key,
                expiresAt: data.expiresAt,
                maxDevices: data.maxDevices,
                duration: data.duration
            })

            toast.success('Your free key has been generated!')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to claim key')
            toast.error(err instanceof Error ? err.message : 'Failed to claim key')
        } finally {
            setClaiming(false)
        }
    }

    const handleCopyKey = async () => {
        if (!keyData?.key) return

        try {
            await navigator.clipboard.writeText(keyData.key)
            setCopied(true)
            toast.success('Key copied to clipboard!')
            setTimeout(() => setCopied(false), 2000)
        } catch {
            toast.error('Failed to copy key')
        }
    }

    const formatExpiryTime = (expiresAt: string) => {
        return formatDateVN(expiresAt)
    }

    if (loading) {
        return (
            <div className="container max-w-lg py-16">
                <Card>
                    <CardContent className="py-12 text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <p className="mt-4 text-muted-foreground">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container max-w-lg py-16">
                <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/products">
                            <Button variant="outline" className="w-full">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Products
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (keyData) {
        return (
            <div className="container max-w-lg py-16">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                    <CardHeader>
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <CardTitle className="text-center text-green-700 dark:text-green-400">
                            Your Free Key is Ready!
                        </CardTitle>
                        <CardDescription className="text-center">
                            Use this key to activate your 4-hour trial
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                            <div className="flex items-center justify-between gap-2">
                                <code className="text-xl font-mono font-bold tracking-wider">
                                    {keyData.key}
                                </code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleCopyKey}
                                    className="shrink-0"
                                >
                                    {copied ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Copy className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>Expires: {formatExpiryTime(keyData.expiresAt)}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {session?.product && (
                                <Link href={`/products/${session.product.slug}`}>
                                    <Button variant="outline" className="w-full">
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to {session.product.title}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Ready to claim
    return (
        <div className="container max-w-lg py-16">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Key className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-center">Claim Your Free Key</CardTitle>
                    <CardDescription className="text-center">
                        You've completed the verification. Click below to get your 4-hour license key.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {session?.product && (
                        <div className="text-center text-sm text-muted-foreground">
                            For: <span className="font-medium">{session.product.title}</span>
                        </div>
                    )}

                    <Button
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        size="lg"
                        onClick={handleClaim}
                        disabled={claiming}
                    >
                        {claiming ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating Key...
                            </>
                        ) : (
                            <>
                                <Key className="h-4 w-4 mr-2" />
                                Claim Free Key
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ClaimPage() {
    return (
        <Suspense fallback={
            <div className="container max-w-lg py-16">
                <Card>
                    <CardContent className="py-12 text-center">
                        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                        <p className="mt-4 text-muted-foreground">Loading...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <ClaimPageContent />
        </Suspense>
    )
}
