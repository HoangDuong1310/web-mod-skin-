'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Key, ExternalLink, Copy, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface GetFreeKeyButtonProps {
    productId: string
    productTitle?: string
    className?: string
}

type SessionStatus = 'idle' | 'generating' | 'waiting' | 'completed' | 'claiming' | 'claimed' | 'error'

interface KeyData {
    key: string
    expiresAt: string
    maxDevices: number
    duration: string
}

export function GetFreeKeyButton({
    productId,
    productTitle,
    className = ''
}: GetFreeKeyButtonProps) {
    const [status, setStatus] = useState<SessionStatus>('idle')
    const [shortenedUrl, setShortenedUrl] = useState<string | null>(null)
    const [sessionToken, setSessionToken] = useState<string | null>(null)
    const [keyData, setKeyData] = useState<KeyData | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    // Poll for session completion
    const checkSessionStatus = useCallback(async () => {
        if (!sessionToken) return

        try {
            const response = await fetch(`/api/free-key/claim?token=${sessionToken}`)
            const data = await response.json()

            if (data.status === 'COMPLETED') {
                setStatus('completed')
                // Stop polling
                return true
            } else if (data.status === 'CLAIMED' && data.licenseKey) {
                setStatus('claimed')
                setKeyData({
                    key: data.licenseKey.key,
                    expiresAt: data.licenseKey.expiresAt,
                    maxDevices: data.licenseKey.maxDevices,
                    duration: '4 hours'
                })
                return true
            } else if (data.status === 'EXPIRED' || data.isExpired) {
                setStatus('error')
                setError('Session has expired. Please try again.')
                return true
            }

            return false
        } catch (error) {
            console.error('Error checking session status:', error)
            return false
        }
    }, [sessionToken])

    // Start polling when waiting
    useEffect(() => {
        if (status !== 'waiting' || !sessionToken) return

        const interval = setInterval(async () => {
            const done = await checkSessionStatus()
            if (done) {
                clearInterval(interval)
            }
        }, 3000) // Check every 3 seconds

        return () => clearInterval(interval)
    }, [status, sessionToken, checkSessionStatus])

    const handleGetFreeKey = async () => {
        setStatus('generating')
        setError(null)

        try {
            const response = await fetch('/api/free-key/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate link')
            }

            setShortenedUrl(data.shortenedUrl)
            setSessionToken(data.sessionToken)
            setStatus('waiting')

            // Open the link in a new tab
            window.open(data.shortenedUrl, '_blank')

            toast.info('Complete the page to get your free key!', {
                duration: 5000
            })
        } catch (error) {
            setStatus('error')
            setError(error instanceof Error ? error.message : 'An error occurred')
            toast.error(error instanceof Error ? error.message : 'An error occurred')
        }
    }

    const handleClaimKey = async () => {
        if (!sessionToken) return

        setStatus('claiming')

        try {
            const response = await fetch('/api/free-key/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken })
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
            setStatus('claimed')

            toast.success('Your free key has been generated!')
        } catch (error) {
            setStatus('error')
            setError(error instanceof Error ? error.message : 'An error occurred')
            toast.error(error instanceof Error ? error.message : 'An error occurred')
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

    const handleReset = () => {
        setStatus('idle')
        setShortenedUrl(null)
        setSessionToken(null)
        setKeyData(null)
        setError(null)
    }

    const formatExpiryTime = (expiresAt: string) => {
        const date = new Date(expiresAt)
        return date.toLocaleString('vi-VN')
    }

    // Render based on status
    if (status === 'claimed' && keyData) {
        return (
            <Card className={`bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 ${className}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg text-green-700 dark:text-green-400">
                            Free Key Generated!
                        </CardTitle>
                    </div>
                    <CardDescription>
                        Your 4-hour license key is ready
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border">
                        <div className="flex items-center justify-between gap-2">
                            <code className="text-lg font-mono font-bold tracking-wider">
                                {keyData.key}
                            </code>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleCopyKey}
                                className="shrink-0"
                            >
                                {copied ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Expires: {formatExpiryTime(keyData.expiresAt)}</span>
                        </div>
                        <Badge variant="secondary">
                            {keyData.maxDevices} device{keyData.maxDevices > 1 ? 's' : ''}
                        </Badge>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
                        Get Another Key
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (status === 'waiting' || status === 'completed') {
        return (
            <Card className={`border-yellow-200 dark:border-yellow-800 ${className}`}>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        {status === 'waiting' ? (
                            <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
                        ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        <CardTitle className="text-lg">
                            {status === 'waiting' ? 'Waiting for Completion' : 'Ready to Claim!'}
                        </CardTitle>
                    </div>
                    <CardDescription>
                        {status === 'waiting'
                            ? 'Complete the ad page to receive your key'
                            : 'Click below to get your free key'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {status === 'waiting' && shortenedUrl && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.open(shortenedUrl, '_blank')}
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open Link Again
                        </Button>
                    )}

                    {status === 'completed' && (
                        <Button
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                            onClick={handleClaimKey}
                        >
                            <Key className="h-4 w-4 mr-2" />
                            Claim Your Free Key
                        </Button>
                    )}

                    <Button variant="ghost" size="sm" onClick={handleReset} className="w-full">
                        Cancel
                    </Button>
                </CardContent>
            </Card>
        )
    }

    if (status === 'error') {
        return (
            <Card className={`border-red-200 dark:border-red-800 ${className}`}>
                <CardContent className="pt-6 space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">{error}</span>
                    </div>
                    <Button variant="outline" onClick={handleReset} className="w-full">
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        )
    }

    // Default idle state
    return (
        <Button
            variant="outline"
            size="lg"
            className={`w-full border-dashed border-2 hover:border-primary hover:bg-primary/5 ${className}`}
            onClick={handleGetFreeKey}
            disabled={status === 'generating'}
        >
            {status === 'generating' ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Key className="h-4 w-4 mr-2" />
                    Get Key Free (4 Hours)
                </>
            )}
        </Button>
    )
}
