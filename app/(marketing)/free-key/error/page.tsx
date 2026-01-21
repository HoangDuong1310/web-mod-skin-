'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft, Clock, Link2Off, ServerOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

const errorMessages: Record<string, { title: string; description: string; icon: React.ReactNode }> = {
    missing_token: {
        title: 'Missing Token',
        description: 'The verification link is incomplete. Please try again from the product page.',
        icon: <Link2Off className="h-8 w-8 text-red-500" />
    },
    invalid_token: {
        title: 'Invalid Session',
        description: 'This verification link is invalid or has already been used.',
        icon: <AlertCircle className="h-8 w-8 text-red-500" />
    },
    session_expired: {
        title: 'Session Expired',
        description: 'This verification session has expired. Please request a new free key.',
        icon: <Clock className="h-8 w-8 text-orange-500" />
    },
    server_error: {
        title: 'Server Error',
        description: 'Something went wrong on our end. Please try again later.',
        icon: <ServerOff className="h-8 w-8 text-red-500" />
    },
    default: {
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        icon: <AlertCircle className="h-8 w-8 text-red-500" />
    }
}

function ErrorPageContent() {
    const searchParams = useSearchParams()
    const reason = searchParams.get('reason') || 'default'

    const errorInfo = errorMessages[reason] || errorMessages.default

    return (
        <div className="container max-w-lg py-16">
            <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {errorInfo.icon}
                    </div>
                    <CardTitle className="text-red-600">{errorInfo.title}</CardTitle>
                    <CardDescription>{errorInfo.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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

export default function ErrorPage() {
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
            <ErrorPageContent />
        </Suspense>
    )
}
