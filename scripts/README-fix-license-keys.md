# Hướng dẫn chạy script sửa License Keys

## Mục đích

Script này sẽ sửa lại tất cả các license key đã tồn tại trên server để:
- ✅ Cập nhật đúng `maxDevices` từ plan
- ✅ Tính lại đúng `expiresAt` dựa trên plan và ngày kích hoạt
- ✅ Thiết lập LIFETIME keys có expiresAt = null

## Cách chạy

### Trên Server Production

```bash
# SSH vào server
ssh user@your-server

# Di chuyển vào thư mục project
cd /path/to/your/project

# Chạy script
npm run fix-license-keys

# Hoặc
npx tsx scripts/fix-license-keys.ts
```

### Trên Local (Development)

```bash
# Đảm bảo bạn đang ở thư mục root của project
cd d:/need to do/new

# Chạy script
npm run fix-license-keys
```

## Kết quả

Script sẽ hiển thị:

```
🔧 Starting license key fix script...

📊 Found 50 license keys to check

  ⚠️  Key ABCD-1234-EFGH-5678: maxDevices 1 → 2
  ⚠️  Key ABCD-1234-EFGH-5678: expiresAt 2024-01-20 → 2024-02-01
  ✅ Fixed key ABCD-1234-EFGH-5678
  
  ... (nhiều key khác)

📈 Summary:
  ✅ Fixed: 35
  ⏭️  Skipped (already correct): 12
  ❌ Errors: 0

✨ Script completed!
```

## Lưu ý quan trọng

> **⚠️ QUAN TRỌNG**: Script này sẽ cập nhật trực tiếp vào database. Nên:
> 1. **Backup database trước** khi chạy script
> 2. Test trên môi trường development/staging trước
> 3. Chạy vào thời gian ít người dùng

## Backup Database (khuyến nghị)

```bash
# PostgreSQL
pg_dump -U username dbname > backup_$(date +%Y%m%d_%H%M%S).sql

# MySQL
mysqldump -u username -p dbname > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Kiểm tra sau khi chạy

Sau khi chạy script, kiểm tra vài license key bằng cách:

1. Vào Admin Dashboard
2. Xem thông tin license key
3. Kiểm tra:
   - `maxDevices` có đúng với plan không
   - `expiresAt` có đúng với (activatedAt + plan duration) không
   - LIFETIME keys có expiresAt = null không

## Rollback (nếu có vấn đề)

Nếu có vấn đề, restore database từ backup:

```bash
# PostgreSQL
psql -U username dbname < backup_20240119_054000.sql

# MySQL  
mysql -u username -p dbname < backup_20240119_054000.sql
```
