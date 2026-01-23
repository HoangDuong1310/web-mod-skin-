'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Copy, Clock, ArrowLeft, Loader2 } from 'lucide-react'
import { formatDateVN } from '@/lib/utils'
import Link from 'next/link'

interface KeyData {
    key: string
    expiresAt: string
    maxDevices: number
}

interface SessionData {
    status: string
    product: {
        id: string
        title: string
        slug: string
    }
    licenseKey: KeyData | null
}

function SuccessPageContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState<SessionData | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (!token) {
            setLoading(false)
            return
        }

        const fetchSession = async () => {
            try {
                const response = await fetch(`/api/free-key/claim?token=${token}`)
                const data = await response.json()
                if (response.ok) {
                    setSession(data)
                }
            } catch (error) {
                console.error('Failed to fetch session:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchSession()
    }, [token])

    const handleCopyKey = async () => {
        if (!session?.licenseKey?.key) return

        try {
            await navigator.clipboard.writeText(session.licenseKey.key)
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

    if (!session?.licenseKey) {
        return (
            <div className="container max-w-lg py-16">
                <Card>
                    <CardHeader>
                        <CardTitle>Key Not Found</CardTitle>
                        <CardDescription>
                            Unable to find your free key. Please try again from the product page.
                        </CardDescription>
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

    return (
        <div className="container max-w-lg py-16">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardHeader>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-center text-green-700 dark:text-green-400">
                        Your Free Key
                    </CardTitle>
                    <CardDescription className="text-center">
                        Use this key to activate your 4-hour trial
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
                        <div className="flex items-center justify-between gap-2">
                            <code className="text-xl font-mono font-bold tracking-wider">
                                {session.licenseKey.key}
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
                            <span>Expires: {formatExpiryTime(session.licenseKey.expiresAt)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {session.product && (
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

export default function SuccessPage() {
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
            <SuccessPageContent />
        </Suspense>
    )
}
