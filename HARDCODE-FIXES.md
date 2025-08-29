# Sửa Chữa Text Hardcode - Dynamic Site Settings

## Tổng Quan
Đã sửa tất cả các text hardcode như "Next.js Full-Stack App", "yoursite.com", v.v. để sử dụng dynamic settings từ database giống như trang home.

## Các Thay Đổi Chính

### 1. Tạo Centralized Configuration (`lib/default-config.ts`)
- Tập trung tất cả default values
- Sử dụng environment variables
- Fallback values hợp lý

### 2. Cập Nhật API Routes
- `app/api/settings/site/route.ts`: Sử dụng DEFAULT_CONFIG thay vì hardcode
- `app/api/settings/email/route.ts`: Dynamic fromName từ site settings
- `app/api/admin/seo/validate/route.ts`: Dynamic site URL

### 3. Cập Nhật SEO Libraries
- `lib/dynamic-seo.ts`: Sử dụng DEFAULT_CONFIG cho fallback values
- `lib/seo.ts`: Centralized default configuration
- `app/layout.tsx`: Dynamic structured data

### 4. Cập Nhật Frontend Components
- `app/(app)/dashboard/settings/site-settings-tab.tsx`: Dynamic placeholders và initial values
- `app/(app)/dashboard/settings/email-settings-tab.tsx`: Dynamic email placeholders

## Environment Variables Mới

Thêm vào file `.env` của bạn (tùy chọn):

```env
# Site Configuration
NEXT_PUBLIC_SITE_NAME="Tên Website Của Bạn"
NEXT_PUBLIC_SITE_DESCRIPTION="Mô tả website của bạn"
NEXT_PUBLIC_SITE_URL="https://domain-cua-ban.com"
NEXT_PUBLIC_CONTACT_EMAIL="contact@domain-cua-ban.com"
NEXT_PUBLIC_SUPPORT_EMAIL="support@domain-cua-ban.com"
NEXT_PUBLIC_FROM_NAME="Tên Website Của Bạn"
```

## Cách Hoạt Động

### Trước (Hardcode):
```tsx
siteName: 'Next.js Full-Stack App'
contactEmail: 'admin@yoursite.com'
```

### Sau (Dynamic):
```tsx
siteName: settings.siteName || DEFAULT_CONFIG.siteName
contactEmail: settings.contactEmail || DEFAULT_CONFIG.contactEmail
```

## Ưu Điểm

1. **Tính Nhất Quán**: Tất cả text đều lấy từ site settings trong database
2. **Dễ Tùy Chỉnh**: Admin có thể thay đổi tên site từ dashboard
3. **Environment-Aware**: Tự động detect development/production
4. **Fallback Thông Minh**: Sử dụng env vars hoặc sensible defaults

## Kiểm Tra

Để kiểm tra các thay đổi:

1. Vào Dashboard → Settings → Site Settings
2. Thay đổi "Site Name" 
3. Kiểm tra trang home - tên site sẽ cập nhật ngay lập tức
4. Kiểm tra email settings - fromName sẽ sử dụng site name
5. Kiểm tra SEO metadata trong view source

## Các File Đã Sửa

- ✅ `lib/default-config.ts` (mới)
- ✅ `app/api/settings/site/route.ts`
- ✅ `app/api/settings/email/route.ts`
- ✅ `app/api/admin/seo/validate/route.ts`
- ✅ `lib/dynamic-seo.ts`
- ✅ `lib/seo.ts`
- ✅ `app/layout.tsx`
- ✅ `app/(app)/dashboard/settings/site-settings-tab.tsx`
- ✅ `app/(app)/dashboard/settings/email-settings-tab.tsx`
- ✅ `.env.example` (mới)

Bây giờ ứng dụng của bạn sẽ hoàn toàn dynamic và không còn text hardcode nào!