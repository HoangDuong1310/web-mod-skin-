# Hướng dẫn khắc phục lỗi Upload File lớn

## Vấn đề
Files từ 150MB trở lên bị kẹt ở trạng thái "saving" mà không hoàn thành upload.

## Nguyên nhân
1. **Timeout Vercel**: Serverless functions có giới hạn thời gian thực thi
2. **Không có error handling**: Thiếu xử lý timeout và log lỗi
3. **Thiếu progress feedback**: Người dùng không biết file có đang được xử lý

## Đã khắc phục
1. ✅ **Thêm maxDuration**: Kéo dài timeout lên 5 phút cho upload routes
2. ✅ **Cải thiện logging**: Thêm log chi tiết cho quá trình upload
3. ✅ **Timeout handling**: Thêm AbortController và timeout 5 phút ở frontend
4. ✅ **Progress indicator**: Hiển thị tiến trình upload cho người dùng
5. ✅ **Vercel config**: Tối ưu cấu hình deployment

## Giới hạn hiện tại
- **Vercel Hobby**: 10 giây timeout (không đủ cho file lớn)
- **Vercel Pro**: 60 giây timeout (đủ cho file ~100MB)
- **Vercel Enterprise**: 5 phút timeout (đủ cho file ~300MB)

## Khuyến nghị
1. **Upgrade Vercel plan** nếu cần upload file >100MB thường xuyên
2. **Tối ưu file size** trước khi upload (nén file, loại bỏ file không cần thiết)
3. **Monitor logs** để tracking các upload thất bại

## Monitoring
Kiểm tra logs để debug:
```bash
# Development
npm run dev

# Production (Vercel)
vercel logs
```

Các log quan trọng:
- `🔵 Starting file upload for product {id}`
- `📁 File details: {name}, Size: {size}MB`
- `✅ File saved successfully in {time}ms`
- `❌ File upload error`
