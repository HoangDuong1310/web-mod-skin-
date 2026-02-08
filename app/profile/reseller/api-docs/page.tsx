'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Copy, ArrowLeft, Key, Zap, ShoppingCart, BarChart3, Wallet, User } from 'lucide-react'

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  const { toast } = useToast()
  return (
    <div className="relative group">
      <pre className="bg-zinc-950 text-zinc-100 rounded-lg p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 text-zinc-400 hover:text-white hover:bg-zinc-800"
        onClick={() => {
          navigator.clipboard.writeText(code)
          toast({ title: 'Đã copy!' })
        }}
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  )
}

function EndpointCard({
  method,
  path,
  title,
  description,
  auth,
  params,
  body,
  response,
  curl,
}: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  title: string
  description: string
  auth: 'API Key' | 'Session'
  params?: { name: string; type: string; desc: string; required?: boolean }[]
  body?: { name: string; type: string; desc: string; required?: boolean }[]
  response: string
  curl?: string
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PUT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <Badge className={methodColors[method]}>{method}</Badge>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{path}</code>
          <Badge variant="outline" className="text-xs">{auth}</Badge>
        </div>
        <CardTitle className="text-lg mt-2">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Parameters */}
        {params && params.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Query Parameters</h4>
            <div className="space-y-1">
              {params.map((p) => (
                <div key={p.name} className="flex items-start gap-2 text-sm">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">
                    {p.name}
                  </code>
                  <span className="text-muted-foreground text-xs">{p.type}</span>
                  {p.required && <Badge variant="destructive" className="text-[10px] h-4">required</Badge>}
                  <span className="text-sm">{p.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body */}
        {body && body.length > 0 && (
          <div>
            <h4 className="font-semibold text-sm mb-2">Request Body (JSON)</h4>
            <div className="space-y-1">
              {body.map((b) => (
                <div key={b.name} className="flex items-start gap-2 text-sm">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs shrink-0">
                    {b.name}
                  </code>
                  <span className="text-muted-foreground text-xs">{b.type}</span>
                  {b.required && <Badge variant="destructive" className="text-[10px] h-4">required</Badge>}
                  <span className="text-sm">{b.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Example Response */}
        <div>
          <h4 className="font-semibold text-sm mb-2">Response</h4>
          <CodeBlock code={response} language="json" />
        </div>

        {/* cURL Example */}
        {curl && (
          <div>
            <h4 className="font-semibold text-sm mb-2">cURL Example</h4>
            <CodeBlock code={curl} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ResellerApiDocsPage() {
  const { status } = useSession()

  if (status === 'unauthenticated') {
    redirect('/auth/signin')
  }

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/profile/reseller">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Reseller API Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Hướng dẫn tích hợp API cho đại lý bán key
        </p>
      </div>

      {/* Authentication Guide */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Xác thực (Authentication)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            Hầu hết các API endpoint yêu cầu API Key trong header <code className="bg-muted px-1.5 py-0.5 rounded">Authorization</code>.
          </p>
          <CodeBlock code={`Authorization: Bearer YOUR_API_KEY`} />
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>⚠️ Bảo mật:</strong> Không bao giờ chia sẻ API Key. Nếu key bị lộ, hãy liên hệ admin để tạo key mới.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Lấy API Key</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Đăng ký reseller tại <Link href="/profile/reseller" className="text-primary underline">/profile/reseller</Link></li>
              <li>Chờ admin duyệt tài khoản</li>
              <li>Admin sẽ cấp API Key cho bạn</li>
              <li>Xem API Key tại dashboard reseller, tab &quot;Thông tin API&quot;</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Endpoints by Category */}
      <Tabs defaultValue="free-key">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="free-key" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Free Key
          </TabsTrigger>
          <TabsTrigger value="purchase" className="gap-1.5">
            <ShoppingCart className="h-3.5 w-3.5" />
            Mua Key
          </TabsTrigger>
          <TabsTrigger value="balance" className="gap-1.5">
            <Wallet className="h-3.5 w-3.5" />
            Số dư
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Thống kê
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
        </TabsList>

        {/* Free Key Tab */}
        <TabsContent value="free-key" className="mt-6">
          <h2 className="text-xl font-bold mb-4">Free Key API</h2>
          <p className="text-muted-foreground mb-6">
            Tạo key miễn phí cho khách hàng. Số lượng tạo bị giới hạn theo quota ngày/tháng do admin cấu hình.
          </p>

          <EndpointCard
            method="POST"
            path="/api/reseller/free-key"
            title="Tạo Free Key"
            description="Tạo một hoặc nhiều key miễn phí theo plan được admin cấu hình"
            auth="API Key"
            body={[
              { name: 'quantity', type: 'number', desc: 'Số lượng key (1-50, mặc định 1)' },
            ]}
            response={`{
  "success": true,
  "keys": [
    {
      "key": "FREE-XXXX-XXXX-XXXX",
      "plan": "Free 1 Day",
      "expiresAt": "2025-01-16T10:30:00.000Z",
      "activatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "generated": 1,
  "quota": {
    "daily": { "used": 5, "limit": 100, "remaining": 95 },
    "monthly": { "used": 50, "limit": 3000, "remaining": 2950 }
  }
}`}
            curl={`curl -X POST ${baseUrl}/api/reseller/free-key \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"quantity": 1}'`}
          />

          <EndpointCard
            method="GET"
            path="/api/reseller/free-key"
            title="Kiểm tra Quota"
            description="Xem số lượng free key còn lại trong ngày và tháng"
            auth="API Key"
            response={`{
  "success": true,
  "quota": {
    "daily": { "used": 5, "limit": 100, "remaining": 95 },
    "monthly": { "used": 50, "limit": 3000, "remaining": 2950 }
  },
  "freeKeyPlan": {
    "name": "Free 1 Day",
    "durationType": "DAY",
    "durationValue": 1
  }
}`}
            curl={`curl ${baseUrl}/api/reseller/free-key \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </TabsContent>

        {/* Purchase Tab */}
        <TabsContent value="purchase" className="mt-6">
          <h2 className="text-xl font-bold mb-4">Mua Key API</h2>
          <p className="text-muted-foreground mb-6">
            Mua key từ các plan có sẵn với giá chiết khấu dành cho reseller. Yêu cầu có đủ số dư trong tài khoản.
          </p>

          <EndpointCard
            method="GET"
            path="/api/reseller/plans"
            title="Danh sách Plans"
            description="Xem tất cả plans có sẵn với giá reseller"
            auth="API Key"
            response={`{
  "success": true,
  "plans": [
    {
      "id": "plan_id",
      "name": "1 Month License",
      "originalPrice": 100000,
      "resellerPrice": 80000,
      "discountPercent": 20,
      "durationType": "MONTH",
      "durationValue": 1,
      "maxDevices": 1,
      "features": ["Feature 1", "Feature 2"]
    }
  ],
  "discountPercent": 20
}`}
            curl={`curl ${baseUrl}/api/reseller/plans \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />

          <EndpointCard
            method="POST"
            path="/api/reseller/keys"
            title="Mua Keys"
            description="Mua key từ plan đã chọn. Số tiền sẽ trừ từ số dư reseller."
            auth="API Key"
            body={[
              { name: 'planId', type: 'string', desc: 'ID của plan muốn mua', required: true },
              { name: 'quantity', type: 'number', desc: 'Số lượng key (mặc định 1)', required: false },
            ]}
            response={`{
  "success": true,
  "keys": [
    {
      "key": "RSL-XXXX-XXXX-XXXX",
      "plan": "1 Month License",
      "expiresAt": "2025-02-15T10:30:00.000Z"
    }
  ],
  "quantity": 1,
  "totalCost": 80000,
  "remainingBalance": 920000,
  "transaction": {
    "id": "txn_id",
    "type": "PURCHASE",
    "amount": -80000
  }
}`}
            curl={`curl -X POST ${baseUrl}/api/reseller/keys \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"planId": "PLAN_ID", "quantity": 1}'`}
          />

          <EndpointCard
            method="GET"
            path="/api/reseller/keys"
            title="Danh sách Keys đã mua/tạo"
            description="Xem tất cả keys đã mua hoặc tạo free"
            auth="API Key"
            params={[
              { name: 'page', type: 'number', desc: 'Số trang (mặc định 1)' },
              { name: 'limit', type: 'number', desc: 'Số key/trang (mặc định 20)' },
              { name: 'type', type: 'string', desc: 'Lọc theo loại: PURCHASED hoặc FREE' },
            ]}
            response={`{
  "success": true,
  "keys": [
    {
      "id": "alloc_id",
      "key": "RSL-XXXX-XXXX-XXXX",
      "type": "PURCHASED",
      "status": "ACTIVE",
      "plan": { "name": "1 Month License" },
      "expiresAt": "2025-02-15T10:30:00.000Z",
      "allocatedAt": "2025-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 50,
    "totalPages": 3
  }
}`}
            curl={`curl "${baseUrl}/api/reseller/keys?page=1&limit=20&type=PURCHASED" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </TabsContent>

        {/* Balance Tab */}
        <TabsContent value="balance" className="mt-6">
          <h2 className="text-xl font-bold mb-4">Số dư & Giao dịch</h2>

          <EndpointCard
            method="GET"
            path="/api/reseller/balance"
            title="Xem số dư & lịch sử giao dịch"
            description="Xem số dư hiện tại và lịch sử nạp/mua"
            auth="API Key"
            params={[
              { name: 'page', type: 'number', desc: 'Số trang' },
              { name: 'limit', type: 'number', desc: 'Số giao dịch/trang' },
            ]}
            response={`{
  "success": true,
  "balance": 920000,
  "totalSpent": 80000,
  "transactions": [
    {
      "id": "txn_id",
      "type": "PURCHASE",
      "amount": -80000,
      "description": "Mua 1 keys - 1 Month License",
      "balanceAfter": 920000,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    {
      "id": "txn_id",
      "type": "CREDIT",
      "amount": 1000000,
      "description": "Admin nạp tiền",
      "balanceAfter": 1000000,
      "createdAt": "2025-01-14T10:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "totalItems": 2, "totalPages": 1 }
}`}
            curl={`curl "${baseUrl}/api/reseller/balance?page=1" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="mt-6">
          <h2 className="text-xl font-bold mb-4">Thống kê</h2>

          <EndpointCard
            method="GET"
            path="/api/reseller/stats"
            title="Thống kê tổng hợp"
            description="Xem thống kê chi tiết về tài khoản reseller"
            auth="API Key"
            response={`{
  "success": true,
  "stats": {
    "balance": 920000,
    "totalSpent": 80000,
    "discountPercent": 20,
    "totalKeys": 51,
    "purchasedKeys": 1,
    "freeKeys": 50,
    "activeKeys": 45,
    "expiredKeys": 6,
    "quota": {
      "daily": { "used": 5, "limit": 100, "remaining": 95 },
      "monthly": { "used": 50, "limit": 3000, "remaining": 2950 }
    },
    "recentActivity": [
      {
        "type": "PURCHASE",
        "amount": -80000,
        "description": "Mua 1 keys",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}`}
            curl={`curl ${baseUrl}/api/reseller/stats \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <h2 className="text-xl font-bold mb-4">Profile</h2>
          <p className="text-muted-foreground mb-6">
            Các endpoint này sử dụng session authentication (đăng nhập trên web), không dùng API Key.
          </p>

          <EndpointCard
            method="GET"
            path="/api/reseller/profile"
            title="Xem thông tin reseller"
            description="Lấy thông tin profile, cấu hình, API keys"
            auth="Session"
            response={`{
  "success": true,
  "reseller": {
    "id": "...",
    "businessName": "Shop Game ABC",
    "contactEmail": "contact@example.com",
    "status": "APPROVED",
    "balance": 920000,
    "discountPercent": 20,
    "freeKeyQuotaDaily": 100,
    "freeKeyQuotaMonthly": 3000,
    "maxKeysPerOrder": 100,
    "totalSpent": 80000,
    "totalKeys": 51,
    "freeKeyPlan": { "name": "Free 1 Day" },
    "apiKeys": [
      {
        "id": "...",
        "apiKey": "rsl_xxxxxxxxxx",
        "isActive": true,
        "lastUsedAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}`}
            curl={`# Sử dụng session cookie (đăng nhập trên web)
curl ${baseUrl}/api/reseller/profile \\
  -H "Cookie: next-auth.session-token=YOUR_SESSION"`}
          />

          <EndpointCard
            method="PUT"
            path="/api/reseller/profile"
            title="Cập nhật thông tin"
            description="Cập nhật thông tin liên hệ của reseller"
            auth="Session"
            body={[
              { name: 'businessName', type: 'string', desc: 'Tên doanh nghiệp' },
              { name: 'contactEmail', type: 'string', desc: 'Email liên hệ' },
              { name: 'contactPhone', type: 'string', desc: 'Số điện thoại' },
              { name: 'website', type: 'string', desc: 'Website' },
              { name: 'description', type: 'string', desc: 'Mô tả' },
            ]}
            response={`{
  "success": true,
  "reseller": { ... }
}`}
            curl={`curl -X PUT ${baseUrl}/api/reseller/profile \\
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \\
  -H "Content-Type: application/json" \\
  -d '{"businessName": "New Name"}'`}
          />
        </TabsContent>
      </Tabs>

      {/* Error Codes */}
      <Separator className="my-8" />
      <Card>
        <CardHeader>
          <CardTitle>Mã lỗi thường gặp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">HTTP Status</th>
                  <th className="text-left py-2 pr-4">Mô tả</th>
                  <th className="text-left py-2">Cách xử lý</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline">401</Badge></td>
                  <td className="py-2 pr-4">API Key không hợp lệ hoặc thiếu</td>
                  <td className="py-2 text-muted-foreground">Kiểm tra lại Authorization header</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline">403</Badge></td>
                  <td className="py-2 pr-4">Tài khoản chưa được duyệt / bị tạm ngưng</td>
                  <td className="py-2 text-muted-foreground">Liên hệ admin</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline">400</Badge></td>
                  <td className="py-2 pr-4">Dữ liệu gửi lên không hợp lệ</td>
                  <td className="py-2 text-muted-foreground">Kiểm tra request body</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline">409</Badge></td>
                  <td className="py-2 pr-4">Hết quota free key</td>
                  <td className="py-2 text-muted-foreground">Chờ reset quota hoặc liên hệ admin tăng</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline">402</Badge></td>
                  <td className="py-2 pr-4">Không đủ số dư</td>
                  <td className="py-2 text-muted-foreground">Nạp thêm tiền thông qua admin</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4"><Badge variant="outline">429</Badge></td>
                  <td className="py-2 pr-4">Rate limit</td>
                  <td className="py-2 text-muted-foreground">Giảm tần suất gọi API</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Integration Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Mẹo tích hợp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-1">🔄 Tự động tạo free key cho khách</h4>
            <p className="text-sm text-muted-foreground">
              Tích hợp endpoint <code className="bg-muted px-1 rounded">POST /api/reseller/free-key</code> vào website/bot để tự động cấp key trial cho khách hàng.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm mb-1">💰 Kiểm tra quota trước khi tạo</h4>
            <p className="text-sm text-muted-foreground">
              Gọi <code className="bg-muted px-1 rounded">GET /api/reseller/free-key</code> để kiểm tra quota remaining trước khi tạo key, tránh lỗi 409.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm mb-1">📦 Mua key hàng loạt</h4>
            <p className="text-sm text-muted-foreground">
              Sử dụng parameter <code className="bg-muted px-1 rounded">quantity</code> để mua nhiều keys cùng lúc, tiết kiệm số lần gọi API.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm mb-1">📊 Kiểm tra số dư thường xuyên</h4>
            <p className="text-sm text-muted-foreground">
              Gọi <code className="bg-muted px-1 rounded">GET /api/reseller/balance</code> để theo dõi số dư và thiết lập cảnh báo khi sắp hết tiền.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
