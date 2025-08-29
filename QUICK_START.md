# ⚡ Quick Start Guide - 3 phút setup!

## 🚨 **LỖI THƯỜNG GẶP VÀ CÁCH FIX**

### ✅ **Đã Fix:**
- [x] `next.config.ts` → `next.config.js` (Next.js không hỗ trợ TS config)
- [x] Seed script JSON error → Dùng `tsx` thay `ts-node`
- [x] Thứ tự setup sai → Phải làm `.env` trước!

## 🔧 **Setup Đúng Thứ Tự (QUAN TRỌNG!)**

### 1️⃣ **Environment Variables (BẮT BUỘC TRƯỚC!)**
```bash
# Tạo file .env từ template
cp .env.example .env

# Hoặc tạo .env với nội dung:
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
APP_NAME="Next.js Full-Stack App"
APP_URL="http://localhost:3000"
REVALIDATE_SECRET="your-revalidate-secret"
```

### 2️⃣ **Database (Sau khi có .env)**
```bash
# Tạo tables trong database
npx prisma migrate dev --name init

# Seed data mẫu
npm run seed
```

### 3️⃣ **Khởi Động**
```bash
npm run dev
# ➜ http://localhost:3000
```

## 🎯 **Kiểm Tra Thành Công**

Sau khi `npm run seed` thành công, bạn sẽ thấy:
```
🌱 Starting database seeding...
✅ Users created
✅ Categories created
✅ Products created
✅ Tags created
✅ Posts and tags created
✅ Sample order created
🎉 Database seeding completed successfully!
```

## 📂 **Cấu Trúc Dự Án**

```
✅ Dependencies installed  
✅ next.config.ts → .js (fixed)
✅ Database migrations ready
✅ Seed data populated
✅ Development server working
```

## 🚀 **Pages & Routes Sẵn Sàng**

- **Homepage**: `http://localhost:3000` - Landing page với hero
- **Dashboard**: `http://localhost:3000/app/dashboard` - Admin panel
- **API**: `http://localhost:3000/api/health` - Health check

## 🔑 **Login Test**

Default users được tạo bởi seed:
- **Admin**: `admin@example.com` (role: ADMIN)
- **User**: `user@example.com` (role: USER)
- **Password**: Bất kỳ (demo mode)

## 📊 **Features Hoạt Động**

- [x] Authentication với Auth.js
- [x] Database với Prisma + MySQL
- [x] API routes với validation
- [x] Admin dashboard với stats
- [x] Dark/Light theme
- [x] Responsive design
- [x] SEO optimization
- [x] Rate limiting
- [x] Testing setup

## 🛠️ **Scripts Quan Trọng**

```bash
npm run dev          # Development server
npm run build        # Production build
npm run seed         # Seed database
npm run test         # Run tests
npx prisma studio    # Database browser
```

## ⚠️ **Nếu Gặp Lỗi**

### Lỗi database connection:
- Kiểm tra MySQL đang chạy
- Verify DATABASE_URL trong .env
- Tạo database nếu chưa có

### Lỗi migration:
```bash
# Reset và chạy lại
npx prisma migrate reset
npx prisma migrate dev --name init
```

### Lỗi Next.js build:
```bash
# Clear cache
rm -rf .next
npm run dev
```

## 🎉 **Hoàn Thành!**

Project đã sẵn sàng 100% cho development!

**Bước tiếp theo**: Bắt đầu code tính năng mới trong:
- `app/` - Pages mới  
- `components/` - UI components
- `app/api/` - API endpoints
- `lib/` - Utilities

Happy coding! 🚀

