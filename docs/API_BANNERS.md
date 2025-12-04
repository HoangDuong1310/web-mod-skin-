# 📢 Banner API Documentation

API để quản lý và lấy thông tin banner thông báo cho Web và App.

## Base URL

```
https://your-domain.com/api/banners
```

---

## 🔓 Public Endpoints (Không cần đăng nhập)

### 1. Lấy danh sách banner cho App

Lấy các banner đang active và được cấu hình hiển thị trên app.

```http
GET /api/banners?app=true
```

#### Query Parameters

| Parameter  | Type     | Required | Description                                      |
|------------|----------|----------|--------------------------------------------------|
| `app`      | boolean  | Yes      | Set `true` để lấy banner cho app                 |
| `position` | string   | No       | Lọc theo vị trí: `TOP`, `BOTTOM`, `MODAL`        |
| `type`     | string   | No       | Lọc theo loại: `INFO`, `LIVESTREAM`, `PROMOTION`, `WARNING`, `SUCCESS`, `EVENT` |

#### Response Success (200)

```json
{
  "banners": [
    {
      "id": "clxxxxxxxxxxxxxxxxxx",
      "title": "🔴 Đang Livestream!",
      "content": "Tham gia ngay để nhận quà",
      "linkUrl": "https://youtube.com/live/xxx",
      "linkText": "Xem ngay",
      "imageUrl": "https://example.com/banner.jpg",
      "backgroundColor": "#ef4444",
      "textColor": "#ffffff",
      "type": "LIVESTREAM",
      "position": "TOP",
      "isDismissible": true,
      "showOnMobile": true,
      "targetAudience": "ALL",
      "priority": 100,
      "appVisible": true,
      "appData": "{\"deepLink\":\"myapp://livestream\",\"showAsNotification\":true}",
      "startDate": "2025-12-03T10:00:00.000Z",
      "endDate": "2025-12-03T14:00:00.000Z"
    }
  ]
}
```

#### Response Fields

| Field            | Type    | Description                                           |
|------------------|---------|-------------------------------------------------------|
| `id`             | string  | ID duy nhất của banner                                |
| `title`          | string  | Tiêu đề banner                                        |
| `content`        | string  | Nội dung mô tả (có thể null)                          |
| `linkUrl`        | string  | URL khi click vào banner (có thể null)                |
| `linkText`       | string  | Text hiển thị trên nút bấm (có thể null)              |
| `imageUrl`       | string  | URL hình ảnh banner (có thể null)                     |
| `backgroundColor`| string  | Mã màu nền HEX (ví dụ: #ef4444)                       |
| `textColor`      | string  | Mã màu chữ HEX (ví dụ: #ffffff)                       |
| `type`           | string  | Loại banner (xem bảng bên dưới)                       |
| `position`       | string  | Vị trí hiển thị: `TOP`, `BOTTOM`, `MODAL`             |
| `isDismissible`  | boolean | Cho phép người dùng đóng banner                       |
| `showOnMobile`   | boolean | Hiển thị trên mobile web                              |
| `targetAudience` | string  | Đối tượng: `ALL`, `AUTHENTICATED`, `GUEST`            |
| `priority`       | number  | Độ ưu tiên (số lớn hơn = ưu tiên cao hơn)             |
| `appVisible`     | boolean | Banner có hiển thị trên app không                     |
| `appData`        | string  | JSON string chứa data bổ sung cho app                 |
| `startDate`      | string  | Thời gian bắt đầu hiển thị (ISO 8601, có thể null)    |
| `endDate`        | string  | Thời gian kết thúc hiển thị (ISO 8601, có thể null)   |

#### Banner Types

| Type        | Description              | Suggested Color |
|-------------|--------------------------|-----------------|
| `INFO`      | Thông báo chung          | Blue (#3b82f6)  |
| `LIVESTREAM`| Thông báo livestream     | Red (#ef4444)   |
| `PROMOTION` | Khuyến mãi               | Purple (#a855f7)|
| `WARNING`   | Cảnh báo                 | Yellow (#eab308)|
| `SUCCESS`   | Thành công               | Green (#22c55e) |
| `EVENT`     | Sự kiện                  | Orange (#f97316)|

#### Target Audience

| Value           | Description                    |
|-----------------|--------------------------------|
| `ALL`           | Tất cả người dùng              |
| `AUTHENTICATED` | Chỉ người dùng đã đăng nhập    |
| `GUEST`         | Chỉ người dùng chưa đăng nhập  |

---

### 2. Lấy banner theo vị trí

```http
GET /api/banners?position=TOP
GET /api/banners?position=MODAL
GET /api/banners?position=BOTTOM
```

---

### 3. Lấy banner theo loại

```http
GET /api/banners?type=LIVESTREAM
```

---

### 4. Kết hợp filter

```http
GET /api/banners?app=true&position=TOP&type=LIVESTREAM
```

---

### 5. Track lượt xem/click

Ghi nhận thống kê khi người dùng xem hoặc click vào banner.

```http
POST /api/banners/{id}/track
```

#### Request Body

```json
{
  "action": "view"
}
```

hoặc

```json
{
  "action": "click"
}
```

#### Response Success (200)

```json
{
  "success": true
}
```

---

## 🔒 Admin Endpoints (Yêu cầu đăng nhập Admin)

### 1. Lấy tất cả banner (Admin)

```http
GET /api/banners?mode=manage
```

#### Headers

```
Cookie: next-auth.session-token=xxx
```

#### Query Parameters

| Parameter | Type   | Default | Description          |
|-----------|--------|---------|----------------------|
| `mode`    | string | -       | Set `manage` để lấy tất cả |
| `page`    | number | 1       | Số trang             |
| `limit`   | number | 20      | Số item mỗi trang    |

#### Response

```json
{
  "banners": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### 2. Lấy chi tiết banner

```http
GET /api/banners/{id}
```

#### Response

```json
{
  "banner": {
    "id": "clxxxxxxxxxxxxxxxxxx",
    "title": "...",
    "viewCount": 1500,
    "clickCount": 120,
    "createdAt": "2025-12-01T00:00:00.000Z",
    "updatedAt": "2025-12-03T00:00:00.000Z",
    ...
  }
}
```

---

### 3. Tạo banner mới

```http
POST /api/banners
```

#### Headers

```
Content-Type: application/json
Cookie: next-auth.session-token=xxx
```

#### Request Body

```json
{
  "title": "🔴 Đang Livestream!",
  "content": "Tham gia ngay để nhận quà",
  "linkUrl": "https://youtube.com/live/xxx",
  "linkText": "Xem ngay",
  "imageUrl": "https://example.com/banner.jpg",
  "backgroundColor": "#ef4444",
  "textColor": "#ffffff",
  "type": "LIVESTREAM",
  "position": "TOP",
  "isActive": true,
  "isDismissible": true,
  "showOnMobile": true,
  "startDate": "2025-12-03T10:00:00.000Z",
  "endDate": "2025-12-03T14:00:00.000Z",
  "priority": 100,
  "targetAudience": "ALL",
  "appVisible": true,
  "appData": "{\"deepLink\":\"myapp://livestream\"}"
}
```

#### Required Fields

| Field   | Type   | Description    |
|---------|--------|----------------|
| `title` | string | Tiêu đề banner |

#### Response Success (201)

```json
{
  "banner": {...},
  "message": "Tạo banner thành công"
}
```

---

### 4. Cập nhật banner

```http
PATCH /api/banners/{id}
```

#### Request Body

Gửi các field cần cập nhật (không bắt buộc gửi tất cả).

```json
{
  "isActive": false,
  "title": "Tiêu đề mới"
}
```

#### Response Success (200)

```json
{
  "banner": {...},
  "message": "Cập nhật banner thành công"
}
```

---

### 5. Xóa banner (Soft Delete)

```http
DELETE /api/banners/{id}
```

#### Response Success (200)

```json
{
  "message": "Xóa banner thành công"
}
```

---

## 📱 App Integration Guide

### Cách sử dụng trong App

#### 1. Fetch banners khi app khởi động

```kotlin
// Android (Kotlin)
suspend fun fetchBanners(): List<Banner> {
    val response = api.get("https://your-domain.com/api/banners?app=true")
    return response.banners
}
```

```swift
// iOS (Swift)
func fetchBanners() async throws -> [Banner] {
    let url = URL(string: "https://your-domain.com/api/banners?app=true")!
    let (data, _) = try await URLSession.shared.data(from: url)
    let response = try JSONDecoder().decode(BannerResponse.self, from: data)
    return response.banners
}
```

```dart
// Flutter (Dart)
Future<List<Banner>> fetchBanners() async {
  final response = await http.get(
    Uri.parse('https://your-domain.com/api/banners?app=true'),
  );
  final data = jsonDecode(response.body);
  return (data['banners'] as List).map((e) => Banner.fromJson(e)).toList();
}
```

#### 2. Xử lý appData

Field `appData` chứa JSON string với các thông tin bổ sung cho app:

```json
{
  "deepLink": "myapp://livestream/123",
  "showAsNotification": true,
  "notificationTitle": "🔴 Livestream đang diễn ra!",
  "notificationBody": "Nhấn để tham gia ngay",
  "soundEnabled": true,
  "vibrate": true
}
```

Parse và sử dụng:

```dart
// Flutter example
final appData = jsonDecode(banner.appData);
if (appData['showAsNotification'] == true) {
  showLocalNotification(
    title: appData['notificationTitle'],
    body: appData['notificationBody'],
  );
}

// Handle deep link
if (appData['deepLink'] != null) {
  navigateToDeepLink(appData['deepLink']);
}
```

#### 3. Track events

Gọi API track khi người dùng tương tác:

```dart
// Khi banner được hiển thị
await http.post(
  Uri.parse('https://your-domain.com/api/banners/$bannerId/track'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'action': 'view'}),
);

// Khi người dùng click vào banner
await http.post(
  Uri.parse('https://your-domain.com/api/banners/$bannerId/track'),
  headers: {'Content-Type': 'application/json'},
  body: jsonEncode({'action': 'click'}),
);
```

---

## 🔄 Polling Strategy

Để cập nhật banner realtime (ví dụ: livestream notification):

```dart
// Poll mỗi 60 giây
Timer.periodic(Duration(seconds: 60), (_) async {
  final banners = await fetchBanners();
  final livestream = banners.firstWhere(
    (b) => b.type == 'LIVESTREAM',
    orElse: () => null,
  );
  
  if (livestream != null && !shownBannerIds.contains(livestream.id)) {
    showLivestreamNotification(livestream);
    shownBannerIds.add(livestream.id);
  }
});
```

---

## ❌ Error Responses

### 400 Bad Request

```json
{
  "error": "Dữ liệu không hợp lệ",
  "details": [...]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 404 Not Found

```json
{
  "error": "Không tìm thấy banner"
}
```

### 500 Internal Server Error

```json
{
  "error": "Không thể lấy danh sách banner"
}
```

---

## 📝 Notes

1. **Timezone**: Tất cả datetime đều ở định dạng ISO 8601 (UTC)
2. **Caching**: Nên cache response và refresh mỗi 1-5 phút
3. **Priority**: Banner có priority cao hơn sẽ được trả về trước
4. **Scheduling**: Banner chỉ hiển thị trong khoảng `startDate` - `endDate`
5. **Soft Delete**: Banner bị xóa vẫn lưu trong DB với `deletedAt` timestamp

---

## 🧪 Test Endpoints

```bash
# Lấy banners cho app
curl -X GET "https://your-domain.com/api/banners?app=true"

# Lấy banners livestream
curl -X GET "https://your-domain.com/api/banners?app=true&type=LIVESTREAM"

# Track view
curl -X POST "https://your-domain.com/api/banners/{id}/track" \
  -H "Content-Type: application/json" \
  -d '{"action": "view"}'
```
