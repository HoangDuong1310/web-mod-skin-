# Review System - User Guide

## Tổng quan
Hệ thống đánh giá cho phép người dùng:
- Đánh giá sản phẩm từ 1-5 sao
- Viết nhận xét chi tiết với tiêu đề và nội dung
- Review ẩn danh (guest) hoặc với tài khoản đăng nhập
- Xem và lọc đánh giá của các sản phẩm

## Cách sử dụng

### 1. Thêm Review System vào Product Page

```tsx
import { ProductReviews } from '@/components/shared/product-reviews'

export default function ProductPage({ params }: { params: { slug: string } }) {
  // ... load product data
  
  return (
    <div>
      {/* Product info */}
      <div className="product-details">
        {/* ... */}
      </div>
      
      {/* Reviews section */}
      <ProductReviews productId={product.id} />
    </div>
  )
}
```

### 2. Sử dụng riêng lẻ

```tsx
import { ReviewForm } from '@/components/shared/review-form'
import { ReviewList } from '@/components/shared/review-list'

function CustomReviewSection({ productId }: { productId: string }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  
  const handleReviewCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }
  
  return (
    <div className="space-y-6">
      <ReviewForm 
        productId={productId} 
        onReviewCreated={handleReviewCreated}
      />
      
      <ReviewList 
        productId={productId} 
        refreshTrigger={refreshTrigger}
      />
    </div>
  )
}
```

## Tính năng

### ReviewForm
- **Rating**: Chọn từ 1-5 sao bằng cách click
- **Title**: Tiêu đề cho đánh giá (bắt buộc)
- **Content**: Nội dung chi tiết (bắt buộc)
- **Guest Info**: Tên và email (chỉ khi chưa đăng nhập)
- **Duplicate Check**: Tự động kiểm tra và ngăn review trùng lặp

### ReviewList
- **Filtering**: Lọc theo số sao (All, 5 stars, 4 stars, v.v.)
- **Sorting**: Sắp xếp theo thời gian mới nhất, cũ nhất, rating cao nhất, thấp nhất
- **Pagination**: Load more reviews (10 per page)
- **Statistics**: Hiển thị rating trung bình và phân bố rating
- **User Display**: Avatar và tên user hoặc "Anonymous" cho guest

## API Endpoints

### GET /api/reviews
Lấy danh sách reviews với filtering và pagination

**Query Parameters:**
- `productId`: ID sản phẩm (bắt buộc)
- `page`: Trang hiện tại (default: 1)  
- `limit`: Số reviews per page (default: 10, max: 100)
- `rating`: Filter theo rating (1-5)
- `sort`: newest|oldest|highest|lowest (default: newest)

**Response:**
```json
{
  "reviews": [...],
  "stats": {
    "averageRating": 4.2,
    "totalReviews": 15,
    "distribution": { "5": 8, "4": 4, "3": 2, "2": 1, "1": 0 }
  },
  "pagination": {
    "page": 1,
    "pages": 2,
    "total": 15
  }
}
```

### POST /api/reviews
Tạo review mới

**Body:**
```json
{
  "productId": "product-id",
  "rating": 5,
  "title": "Great product!",
  "content": "Really love this software...",
  "guestName": "John Doe", // chỉ khi guest
  "guestEmail": "john@example.com" // chỉ khi guest
}
```

### GET /api/reviews/check
Kiểm tra user đã review sản phẩm chưa

**Query:** `?productId=product-id`

**Response:**
```json
{
  "hasReviewed": true,
  "canReview": false,
  "existingReview": {
    "id": "review-id",
    "rating": 5,
    "title": "My review",
    "content": "...",
    "createdAt": "2025-08-28T..."
  }
}
```

## Database Schema

Reviews được lưu trong bảng `reviews` với các trường:
- `id`, `productId`, `rating` (1-5)
- `title`, `content`
- `userId` (null cho guest), `guestName`, `guestEmail`
- `isVerified` (true cho user đăng nhập)
- `isVisible` (cho moderation)
- `createdAt`, `updatedAt`, `deletedAt`

## Validation

### Client-side
- Rating: 1-5 (bắt buộc)
- Title: 1-200 ký tự (bắt buộc)
- Content: 1-2000 ký tự (bắt buộc)
- Guest name: 1-100 ký tự (bắt buộc khi guest)
- Guest email: Valid email format (bắt buộc khi guest)

### Server-side
- Sử dụng Zod schemas cho validation
- Check product tồn tại
- Check duplicate review per user
- Sanitize input data

## Error Handling

- Form validation errors hiển thị inline
- API errors hiển thị toast notifications
- Loading states cho UX tốt hơn
- 404 cho product không tồn tại
- 400 cho duplicate reviews
- 500 cho server errors

## Customization

### Styling
Components sử dụng Tailwind CSS và có thể customize:
- Colors qua CSS variables
- Spacing và typography
- Card layouts
- Button styles

### Behavior
- Số reviews per page (default 10)
- Rating scale (hiện tại 1-5)
- Required fields
- Guest review permissions
