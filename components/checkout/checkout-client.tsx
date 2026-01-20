'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Check, 
  Copy, 
  Loader2, 
  CreditCard,
  Shield,
  Clock,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Coffee,
  Landmark,
  CreditCardIcon
} from 'lucide-react'
import { BANK_CONFIG, KOFI_CONFIG, PAYPAL_CONFIG, CONTACT_INFO } from '@/lib/payment-config'

interface Plan {
  id: string
  name: string
  slug: string
  description: string | null
  price: number
  comparePrice: number | null
  currency: string
  durationType: string
  durationValue: number
  features: string[]
  maxDevices: number
  originalPriceVND?: number
}

interface CheckoutClientProps {
  plan: Plan
}

type PaymentMethod = 'kofi' | 'paypal' | 'bank'

export function CheckoutClient({ plan }: CheckoutClientProps) {
  const [orderNumber, setOrderNumber] = useState('')
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [orderCreated, setOrderCreated] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [copied, setCopied] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  // Polling để tự động redirect khi đơn hàng đã có key
  useEffect(() => {
    if (!orderNumber) return;
    let redirecting = false;
    
    const interval = setInterval(async () => {
      if (redirecting) return; // Prevent multiple redirects
      
      try {
        const res = await fetch(`/api/orders?orderNumber=${orderNumber}`);
        if (!res.ok) return;
        
        const data = await res.json();
        const order = data.orders?.[0];
        
        // Kiểm tra đơn hàng đã hoàn thành chưa
        if (order && order.paymentStatus === 'COMPLETED' && order.keyId) {
          redirecting = true;
          clearInterval(interval);
          router.push('/profile/licenses');
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [orderNumber, router]);

  // Determine if using VND or USD display
  const isVN = plan.currency === 'VND'
  
  // Default payment method based on currency
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(isVN ? 'bank' : 'kofi')
  // Actual payment for bank transfer is in VND
  const paymentPriceVND = plan.originalPriceVND || plan.price
  // USD price for Ko-fi/PayPal
  const paymentPriceUSD = plan.currency === 'USD' ? plan.price : (plan.originalPriceVND ? plan.price : Math.ceil(plan.price / 25000 * 100) / 100)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/checkout/${plan.slug}?currency=${plan.currency}`)
    }
  }, [status, router, plan.slug, plan.currency])

  // Create order when component mounts
  useEffect(() => {
    if (session?.user && !orderNumber) {
      createOrder()
    }
  }, [session])

  // Force payment method to 'bank' for Vietnamese users (currency VND)
  useEffect(() => {
    if (isVN) {
      setPaymentMethod('bank');
    }
  }, [isVN]);

  // Auto-redirect to Ko-fi when order is created and Ko-fi is selected
  useEffect(() => {
    if (orderCreated && orderNumber && paymentMethod === 'kofi') {
      const kofiLink = getKofiLink();
      window.open(kofiLink, '_blank');
    }
  }, [orderCreated, orderNumber, paymentMethod]);

  const createOrder = async () => {
    if (isCreatingOrder) return
    setIsCreatingOrder(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          paymentMethod: paymentMethod === 'kofi' ? 'KOFI' : paymentMethod === 'paypal' ? 'PAYPAL' : 'BANK_TRANSFER',
          currency: plan.currency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || (isVN ? 'Không thể tạo đơn hàng' : 'Cannot create order'))
      }

      setOrderId(data.order.id)
      setOrderNumber(data.order.orderNumber)
      setOrderCreated(true)
    } catch (error: any) {
      toast({
        title: isVN ? 'Lỗi' : 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsCreatingOrder(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: isVN ? 'Đã copy!' : 'Copied!',
      description: isVN ? 'Nội dung đã được copy vào clipboard' : 'Content copied to clipboard',
    })
  }

  const formatPrice = (price: number, currency: string = 'VND') => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
      }).format(price)
    }
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatPriceVND = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatPriceUSD = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(price)
  }

  const getDurationText = () => {
    if (isVN) {
      const types: Record<string, string> = {
        DAY: 'ngày',
        WEEK: 'tuần',
        MONTH: 'tháng',
        QUARTER: 'quý',
        YEAR: 'năm',
        LIFETIME: 'vĩnh viễn',
      }
      if (plan.durationType === 'LIFETIME') return 'Vĩnh viễn'
      return `${plan.durationValue} ${types[plan.durationType] || plan.durationType}`
    } else {
      const types: Record<string, string> = {
        DAY: 'day',
        WEEK: 'week',
        MONTH: 'month',
        QUARTER: 'quarter',
        YEAR: 'year',
        LIFETIME: 'Lifetime',
      }
      if (plan.durationType === 'LIFETIME') return 'Lifetime'
      const unit = types[plan.durationType] || plan.durationType
      return `${plan.durationValue} ${unit}${plan.durationValue > 1 ? 's' : ''}`
    }
  }

  // Generate Ko-fi link with pre-filled amount
  const getKofiLink = () => {
    const message = encodeURIComponent(`Order: ${orderNumber} ${plan.name}`)
    return `${KOFI_CONFIG.pageUrl}?hidefeed=true&widget=true&embed=true&preview=true&amount=${paymentPriceUSD}&message=${message}`
  }

  // Generate VietQR URL
  const getVietQRUrl = () => {
    const params = new URLSearchParams()
    params.append('amount', String(paymentPriceVND))
    params.append('addInfo', orderNumber)
    params.append('accountName', BANK_CONFIG.accountName)
    return `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNo}-${BANK_CONFIG.template}.jpg?${params.toString()}`
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  // Strip any '-' from orderNumber for display
  const displayOrderCode = orderNumber.replace(/-/g, '')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-8">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/pricing" 
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isVN ? 'Quay lại bảng giá' : 'Back to pricing'}
          </Link>
          <h1 className="text-3xl font-bold">{isVN ? 'Thanh toán' : 'Checkout'}</h1>
          <p className="text-muted-foreground mt-2">
            {isVN 
              ? 'Chọn phương thức thanh toán và hoàn tất đơn hàng' 
              : 'Choose payment method and complete your order'}
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Order Summary - Left side */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {isVN ? 'Thông tin đơn hàng' : 'Order Information'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  <Badge variant="secondary">{getDurationText()}</Badge>
                </div>

                <Separator />

                {/* Features */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">{isVN ? 'Bao gồm:' : 'Includes:'}</p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    <li className="text-sm flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span>
                        {isVN 
                          ? `Tối đa ${plan.maxDevices} thiết bị` 
                          : `Up to ${plan.maxDevices} device${plan.maxDevices > 1 ? 's' : ''}`}
                      </span>
                    </li>
                  </ul>
                </div>

                <Separator />

                {/* Price */}
                <div className="space-y-2">
                  {plan.comparePrice && (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{isVN ? 'Giá gốc:' : 'Original price:'}</span>
                      <span className="line-through">{formatPrice(plan.comparePrice, plan.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>{isVN ? 'Tổng thanh toán:' : 'Total:'}</span>
                    <span className="text-primary">{formatPrice(plan.price, plan.currency)}</span>
                  </div>
                  {plan.comparePrice && (
                    <div className="text-right">
                      <Badge variant="destructive" className="text-xs">
                        {isVN ? 'Tiết kiệm' : 'Save'} {formatPrice(plan.comparePrice - plan.price, plan.currency)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Order Code */}
                {orderNumber && (
                  <>
                    <Separator />
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">
                        {isVN ? 'Mã đơn hàng:' : 'Order Code:'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-primary font-mono text-lg">{displayOrderCode}</p>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyToClipboard(displayOrderCode)}
                        >
                          {copied ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Shield className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">{isVN ? 'Thanh toán an toàn' : 'Secure payment'}</p>
                    <p className="text-muted-foreground mt-1">
                      {isVN 
                        ? 'Sau khi thanh toán, hãy liên hệ với chúng tôi kèm mã đơn hàng để nhận license key.'
                        : 'After payment, contact us with your order code to receive your license key.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Methods - Right side */}
          <div className="lg:col-span-3 space-y-6">
            {isCreatingOrder ? (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {isVN ? 'Đang tạo đơn hàng...' : 'Creating order...'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : orderCreated ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5" />
                    {isVN ? 'Chọn phương thức thanh toán' : 'Choose Payment Method'}
                  </CardTitle>
                  <CardDescription>
                    {isVN 
                      ? 'Chọn phương thức phù hợp với bạn' 
                      : 'Select the method that works best for you'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="bank">Chuyển khoản ngân hàng</TabsTrigger>
                      {!isVN && <TabsTrigger value="kofi">Ko-fi (USD)</TabsTrigger>}
                      {!isVN && <TabsTrigger value="paypal">PayPal (USD)</TabsTrigger>}
                    </TabsList>

                    {/* Ko-fi Payment */}
                    <TabsContent value="kofi" className="space-y-4">
                      <div className="text-center p-4 bg-[#FF5E5B]/10 rounded-lg border border-[#FF5E5B]/20">
                        <Coffee className="h-12 w-12 mx-auto mb-3 text-[#FF5E5B]" />
                        <h3 className="font-semibold text-lg mb-2">
                          {isVN ? 'Thanh toán qua Ko-fi' : 'Pay via Ko-fi'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isVN 
                            ? `Số tiền: ${formatPriceUSD(paymentPriceUSD)} - Hỗ trợ nhiều phương thức thanh toán quốc tế`
                            : `Amount: ${formatPriceUSD(paymentPriceUSD)} - Supports multiple international payment methods`}
                        </p>
                        <Button 
                          className="bg-[#FF5E5B] hover:bg-[#e54542] text-white"
                          size="lg"
                          asChild
                        >
                          <a href={getKofiLink()} target="_blank" rel="noopener noreferrer">
                            <Coffee className="h-4 w-4 mr-2" />
                            {isVN ? 'Thanh toán trên Ko-fi' : 'Pay on Ko-fi'}
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      </div>

                      <div className="p-4 border rounded-lg space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {isVN ? 'Hướng dẫn:' : 'Instructions:'}
                        </h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>{isVN ? 'Nhấn nút "Thanh toán trên Ko-fi" ở trên' : 'Click "Pay on Ko-fi" button above'}</li>
                          <li>{isVN ? 'Hoàn tất thanh toán trên trang Ko-fi' : 'Complete payment on Ko-fi page'}</li>
                          <li>
                            {isVN 
                              ? `Gửi mã đơn hàng "${displayOrderCode}" qua một trong các kênh liên hệ bên dưới`
                              : `Send order code "${displayOrderCode}" through one of the contact channels below`}
                          </li>
                          <li>{isVN ? 'Nhận license key trong vòng 24h' : 'Receive license key within 24h'}</li>
                        </ol>
                      </div>
                    </TabsContent>

                    {/* PayPal Payment */}
                    <TabsContent value="paypal" className="space-y-4">
                      <div className="text-center p-4 bg-[#0070BA]/10 rounded-lg border border-[#0070BA]/20">
                        <a
                          href={PAYPAL_CONFIG.paypalMe}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0070BA] text-white rounded-lg text-lg font-bold hover:bg-[#005ea6] transition"
                        >
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12c0-6.627-5.373-12-12-12zm0 22.153c-5.605 0-10.153-4.548-10.153-10.153S6.395 1.847 12 1.847 22.153 6.395 22.153 12 17.605 22.153 12 22.153zm2.153-13.846h-1.077V6.077c0-.297-.24-.538-.538-.538h-1.077c-.297 0-.538.241-.538.538v2.23h-1.077c-.297 0-.538.241-.538.538v1.077c0 .297.241.538.538.538h1.077v2.23c0 .297.241.538.538.538h1.077c.297 0 .538-.241.538-.538v-2.23h1.077c.297 0 .538-.241.538-.538v-1.077c0-.297-.241-.538-.538-.538z"/></svg>
                          {isVN ? 'Chuyển tiền qua PayPal.me' : 'Pay via PayPal.me'}
                        </a>
                        <p className="mt-3 text-lg font-bold text-[#0070BA]">
                          {formatPriceUSD(paymentPriceUSD)}
                        </p>
                      </div>

                      <div className="p-4 border rounded-lg space-y-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          {isVN ? 'Hướng dẫn:' : 'Instructions:'}
                        </h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>{isVN ? 'Nhấn nút bên trên để chuyển đến trang PayPal.me' : 'Click the button above to go to PayPal.me'}</li>
                          <li>{isVN ? `Chuyển đúng số tiền ${formatPriceUSD(paymentPriceUSD)}` : `Send exactly ${formatPriceUSD(paymentPriceUSD)}`}</li>
                          <li>{isVN ? `Ghi chú nội dung: "${displayOrderCode}"` : `Add note: "${displayOrderCode}"`}</li>
                          <li>{isVN ? 'Sau khi chuyển, liên hệ với chúng tôi để nhận key' : 'After transfer, contact us to receive your key'}</li>
                        </ol>
                      </div>
                    </TabsContent>

                    {/* Bank Transfer (Vietnam) */}
                    <TabsContent value="bank" className="space-y-4">
                      <div className="text-center">
                        <div className="bg-white p-4 rounded-lg shadow-sm inline-block mb-4">
                          <Image
                            src={getVietQRUrl()}
                            alt={isVN ? 'QR Code chuyển khoản' : 'Bank Transfer QR Code'}
                            width={220}
                            height={220}
                            className="rounded"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {isVN 
                            ? 'Quét mã QR bằng ứng dụng ngân hàng' 
                            : 'Scan QR with your banking app'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">{isVN ? 'Ngân hàng' : 'Bank'}</p>
                            <p className="font-medium">VCB</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">{isVN ? 'Số tài khoản' : 'Account number'}</p>
                            <p className="font-medium font-mono">{BANK_CONFIG.accountNo}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(BANK_CONFIG.accountNo)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">{isVN ? 'Chủ tài khoản' : 'Account holder'}</p>
                            <p className="font-medium">{BANK_CONFIG.accountName}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">{isVN ? 'Số tiền' : 'Amount'}</p>
                            <p className="font-bold text-primary">{formatPriceVND(paymentPriceVND)}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(String(paymentPriceVND))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex justify-between items-center p-3 bg-primary/10 border-2 border-primary/20 rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              {isVN ? 'Nội dung chuyển khoản' : 'Transfer content'}
                            </p>
                            <p className="font-bold text-primary font-mono">{displayOrderCode}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(displayOrderCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>

                        <p className="text-xs text-destructive text-center">
                          {isVN 
                            ? '⚠️ Nhập chính xác nội dung chuyển khoản'
                            : '⚠️ Enter the exact transfer content'}
                        </p>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <Separator className="my-6" />

                  {/* Contact Section */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-center">
                      {isVN ? '📬 Hỗ trợ nhận License Key' : '📬 License Key Support'}
                    </h4>
                    <p className="text-sm text-muted-foreground text-center">
                      {isVN
                        ? `Thông thường, License Key sẽ được cấp tự động sau khi thanh toán thành công. Nếu đơn hàng chưa tự động hoàn thành hoặc bạn chưa nhận được key, vui lòng liên hệ với chúng tôi để được hỗ trợ. Khi liên hệ, bạn có thể cung cấp mã đơn hàng nếu cần thiết để tra cứu nhanh hơn.`
                        : `Normally, your License Key will be delivered automatically after successful payment. If your order is not completed automatically or you haven't received your key, please contact us for support. You may provide your order code if needed for faster lookup.`}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" asChild>
                        <a href={CONTACT_INFO.discord} target="_blank" rel="noopener noreferrer">
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                          </svg>
                          Discord
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={CONTACT_INFO.telegram} target="_blank" rel="noopener noreferrer">
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                          </svg>
                          Telegram
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={CONTACT_INFO.facebook} target="_blank" rel="noopener noreferrer">
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={`mailto:${CONTACT_INFO.email}?subject=Order ${displayOrderCode}&body=Hi, I just paid for order ${displayOrderCode}. Please send me the license key.`}>
                          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Email
                        </a>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-400 text-center flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" />
                      {isVN 
                        ? 'License key sẽ được gửi trong vòng 24h sau khi xác nhận thanh toán' 
                        : 'License key will be sent within 24h after payment confirmation'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">
                      {isVN ? 'Không thể tạo đơn hàng' : 'Cannot create order'}
                    </p>
                    <Button onClick={createOrder}>{isVN ? 'Thử lại' : 'Try again'}</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
