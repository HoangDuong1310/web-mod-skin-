# 📚 API Documentation - License Key System

## Tổng quan

Tài liệu này mô tả các API endpoints và yêu cầu cần thiết để tích hợp hệ thống License Key vào ứng dụng desktop/mobile của bạn.

**Base URL:** `https://your-domain.com/api`

---

## ⚠️ YÊU CẦU BẮT BUỘC

### 🌐 Kết nối Internet

> **QUAN TRỌNG:** App **BẮT BUỘC** phải có kết nối Internet để hoạt động. Không hỗ trợ chế độ offline.

| Yêu cầu | Mô tả |
|---------|-------|
| **Kết nối mạng** | Bắt buộc có Internet |
| **Chế độ Offline** | ❌ KHÔNG hỗ trợ |
| **Heartbeat** | Mỗi 5 phút phải ping server |
| **Timeout cho phép** | Tối đa 10 phút không có heartbeat |

### Lý do yêu cầu Online:

1. **Bảo mật License** - Ngăn chặn crack/bypass offline
2. **Kiểm soát thiết bị** - Đảm bảo đúng số device đang dùng
3. **Thu hồi key tức thì** - Admin có thể ban/suspend ngay lập tức
4. **Tracking sử dụng** - Ghi log hoạt động realtime

### Hành vi khi mất mạng:

```
[App đang chạy] → [Mất kết nối Internet]
    ↓
1. Heartbeat thất bại
    ↓
2. App retry 3 lần (mỗi lần cách 30 giây)
    ↓
3. Nếu vẫn fail sau 3 lần:
   → Hiển thị cảnh báo "Mất kết nối - Vui lòng kiểm tra mạng"
   → KHÓA các tính năng premium
   → Cho phép thử lại thủ công
    ↓
4. Nếu mất kết nối > 10 phút:
   → Tự động đăng xuất
   → Yêu cầu activate lại khi có mạng
```

---

## �️ HƯỚNG DẪN CHUYỂN TỪ APP OFFLINE SANG ONLINE LICENSE

> Nếu app hiện tại của bạn đang chạy offline (không cần đăng nhập, không cần mạng), hãy làm theo các bước sau để tích hợp hệ thống License Key.

### Tổng quan thay đổi cần làm

```
[App hiện tại - Offline]          [App sau khi tích hợp - Online]
├─ Mở app → Dùng luôn             ├─ Mở app → Check mạng
├─ Không cần đăng nhập            ├─ Nhập license key (lần đầu)
├─ Không cần Internet             ├─ Verify key với server
└─ Dùng mãi mãi                   ├─ Heartbeat mỗi 5 phút
                                  └─ Hết hạn → Yêu cầu gia hạn
```

### Checklist những việc cần làm trên App

#### 1. 📡 Thêm HTTP Client
- [ ] Thêm thư viện HTTP (HttpClient, OkHttp, Retrofit, axios, etc.)
- [ ] Cấu hình base URL của API server
- [ ] Xử lý SSL/TLS certificate

#### 2. 💾 Lưu trữ License Key
- [ ] Tạo secure storage để lưu key (encrypted)
- [ ] Lưu: license key, HWID, activation status
- [ ] Không lưu plaintext!

#### 3. 🖥️ Tạo các màn hình UI mới

**Màn hình Nhập Key (bắt buộc):**
```
┌─────────────────────────────────────┐
│         KÍCH HOẠT LICENSE           │
│                                     │
│  Nhập License Key:                  │
│  ┌─────────────────────────────┐    │
│  │ XXXX-XXXX-XXXX-XXXX         │    │
│  └─────────────────────────────┘    │
│                                     │
│  [    KÍCH HOẠT    ]                │
│                                     │
│  Chưa có key? Mua tại: link...      │
└─────────────────────────────────────┘
```

**Màn hình Loading/Verifying:**
```
┌─────────────────────────────────────┐
│                                     │
│         ⏳ Đang xác thực...         │
│                                     │
│    Vui lòng chờ trong giây lát      │
│                                     │
└─────────────────────────────────────┘
```

**Màn hình Lỗi mạng:**
```
┌─────────────────────────────────────┐
│                                     │
│    ⚠️ Không có kết nối mạng         │
│                                     │
│  App yêu cầu Internet để hoạt động  │
│                                     │
│  [    THỬ LẠI    ]                  │
│                                     │
└─────────────────────────────────────┘
```

**Màn hình Key hết hạn:**
```
┌─────────────────────────────────────┐
│                                     │
│    ⏰ License đã hết hạn            │
│                                     │
│  Key: ABCD-****-****-WXYZ           │
│  Hết hạn: 15/01/2026                │
│                                     │
│  [   GIA HẠN NGAY   ]               │
│  [   NHẬP KEY KHÁC  ]               │
│                                     │
└─────────────────────────────────────┘
```

**Màn hình Thông tin License (tùy chọn):**
```
┌─────────────────────────────────────┐
│         THÔNG TIN LICENSE           │
│                                     │
│  Gói: Pro Monthly                   │
│  Key: ABCD-****-****-WXYZ           │
│  Hết hạn: 15/02/2026 (còn 25 ngày)  │
│  Thiết bị: 1/2                      │
│                                     │
│  [  GỠ THIẾT BỊ NÀY  ]              │
│                                     │
└─────────────────────────────────────┘
```

#### 4. 🔄 Implement License Logic

**File cần tạo:**
```
app/
├── services/
│   ├── LicenseService         # Gọi API license
│   ├── NetworkService         # Check kết nối mạng
│   └── StorageService         # Lưu/đọc key encrypted
├── models/
│   └── LicenseInfo            # Model chứa thông tin license
├── utils/
│   └── HardwareId             # Tạo HWID
└── ui/
    ├── LicenseInputScreen     # Màn hình nhập key
    ├── LicenseInfoScreen      # Màn hình thông tin
    └── ErrorDialogs           # Các dialog lỗi
```

#### 5. 🚀 Thay đổi Flow khởi động App

**Trước (Offline):**
```
main() {
    showMainScreen();  // Vào thẳng app
}
```

**Sau (Online License):**
```
main() {
    // 1. Check Internet
    if (!hasInternet()) {
        showNoInternetScreen();
        return;
    }
    
    // 2. Check saved license
    savedKey = storage.getLicenseKey();
    
    if (savedKey == null) {
        // Chưa có key → yêu cầu nhập
        showLicenseInputScreen();
        return;
    }
    
    // 3. Verify key với server
    showLoadingScreen("Đang xác thực...");
    
    result = await licenseService.activate(savedKey, hwid);
    
    if (result.success) {
        // OK → vào app
        startHeartbeatTimer();
        showMainScreen();
    } else {
        // Lỗi → xử lý theo error code
        handleLicenseError(result.error);
    }
}
```

#### 6. ⏱️ Implement Heartbeat Timer

```
class HeartbeatManager {
    timer = null;
    INTERVAL = 5 * 60 * 1000;  // 5 phút
    
    start() {
        // Chạy ngay lần đầu
        this.sendHeartbeat();
        
        // Lặp mỗi 5 phút
        this.timer = setInterval(() => {
            this.sendHeartbeat();
        }, this.INTERVAL);
    }
    
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
    
    async sendHeartbeat() {
        try {
            result = await api.heartbeat(key, hwid);
            
            if (!result.valid) {
                // Key không còn hợp lệ
                this.stop();
                forceLogout(result.error);
            }
        } catch (networkError) {
            // Xử lý mất mạng (retry logic)
            this.handleNetworkError();
        }
    }
}
```

#### 7. 🌐 Monitor Network Status

```
class NetworkMonitor {
    
    startMonitoring() {
        // Lắng nghe sự kiện mạng
        onNetworkChange((isOnline) => {
            if (isOnline) {
                // Có mạng lại → heartbeat ngay
                heartbeatManager.sendHeartbeat();
            } else {
                // Mất mạng → hiện warning
                showNetworkWarning();
            }
        });
    }
}
```

### Code mẫu đầy đủ (C# / WinForms)

```csharp
// LicenseService.cs
public class LicenseService
{
    private readonly HttpClient _client;
    private const string BASE_URL = "https://your-domain.com/api";
    
    public LicenseService()
    {
        _client = new HttpClient();
        _client.Timeout = TimeSpan.FromSeconds(10);
    }
    
    public async Task<LicenseResult> ActivateAsync(string key, string hwid, string deviceName)
    {
        var request = new
        {
            key = key,
            hwid = hwid,
            deviceName = deviceName,
            deviceInfo = new
            {
                os = Environment.OSVersion.ToString(),
                machine = Environment.MachineName,
                appVersion = Application.ProductVersion
            }
        };
        
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        try
        {
            var response = await _client.PostAsync($"{BASE_URL}/license/activate", content);
            var responseJson = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<LicenseResult>(responseJson);
        }
        catch (HttpRequestException)
        {
            return new LicenseResult { Success = false, Error = "NETWORK_ERROR" };
        }
        catch (TaskCanceledException)
        {
            return new LicenseResult { Success = false, Error = "TIMEOUT" };
        }
    }
    
    public async Task<HeartbeatResult> HeartbeatAsync(string key, string hwid)
    {
        var request = new { key = key, hwid = hwid };
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _client.PostAsync($"{BASE_URL}/license/heartbeat", content);
        var responseJson = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<HeartbeatResult>(responseJson);
    }
}

// Program.cs - Entry point
static async Task Main()
{
    Application.EnableVisualStyles();
    
    // 1. Check Internet
    if (!NetworkInterface.GetIsNetworkAvailable())
    {
        MessageBox.Show(
            "App yêu cầu kết nối Internet để hoạt động.\nVui lòng kiểm tra mạng và thử lại.",
            "Không có kết nối",
            MessageBoxButtons.OK,
            MessageBoxIcon.Warning
        );
        return;
    }
    
    // 2. Check saved license
    var savedKey = SecureStorage.GetLicenseKey();
    
    if (string.IsNullOrEmpty(savedKey))
    {
        // Hiện form nhập key
        Application.Run(new LicenseInputForm());
        return;
    }
    
    // 3. Verify with server
    var splashForm = new SplashForm("Đang xác thực license...");
    splashForm.Show();
    
    var licenseService = new LicenseService();
    var hwid = HardwareId.Generate();
    var result = await licenseService.ActivateAsync(savedKey, hwid, Environment.MachineName);
    
    splashForm.Close();
    
    if (result.Success)
    {
        // Start heartbeat và vào app
        HeartbeatManager.Instance.Start(savedKey, hwid);
        Application.Run(new MainForm());
    }
    else
    {
        // Xử lý lỗi
        HandleLicenseError(result.Error);
    }
}
```

### Tóm tắt những gì cần code

| STT | Việc cần làm | Độ ưu tiên |
|-----|--------------|------------|
| 1 | Tạo HWID generator | 🔴 Cao |
| 2 | Tạo HTTP service gọi API | 🔴 Cao |
| 3 | Tạo secure storage lưu key | 🔴 Cao |
| 4 | Tạo màn hình nhập license key | 🔴 Cao |
| 5 | Sửa flow khởi động app | 🔴 Cao |
| 6 | Implement heartbeat timer (5 phút) | 🔴 Cao |
| 7 | Tạo màn hình/dialog lỗi | 🟡 Trung bình |
| 8 | Monitor network status | 🟡 Trung bình |
| 9 | Tạo màn hình thông tin license | 🟢 Thấp |
| 10 | Tạo màn hình key hết hạn | 🟢 Thấp |

---

## 💾 DỮ LIỆU LƯU TRỮ TỪ APP

### Thông tin được Server lưu khi Activate

Khi app gọi `/api/license/activate`, server sẽ lưu các thông tin sau:

| Field | Lưu ở đâu | Mô tả |
|-------|-----------|-------|
| `hwid` | `key_activations.hwid` | Hardware ID (đã hash SHA-256) |
| `deviceName` | `key_activations.deviceName` | Tên thiết bị do user/app đặt |
| `deviceInfo` | `key_activations.deviceInfo` | JSON chứa thông tin máy |
| `ipAddress` | `key_activations.ipAddress` | IP address khi activate |
| `userAgent` | `key_activations.userAgent` | User-Agent string |
| `activatedAt` | `key_activations.activatedAt` | Thời gian kích hoạt |
| `lastSeenAt` | `key_activations.lastSeenAt` | Cập nhật mỗi heartbeat |

### Ví dụ deviceInfo nên gửi

```json
{
  "os": "Windows 11 Pro 64-bit",
  "osVersion": "10.0.22621",
  "cpu": "Intel Core i7-12700K",
  "cpuCores": 12,
  "ram": "32 GB",
  "gpu": "NVIDIA RTX 3080",
  "screenResolution": "2560x1440",
  "computerName": "DESKTOP-ABC123",
  "appVersion": "1.2.0",
  "appBuildNumber": "20260117"
}
```

### Admin có thể xem được gì?

Trong Dashboard, admin có thể xem:

```
┌─────────────────────────────────────────────────────────────┐
│  CHI TIẾT THIẾT BỊ ĐÃ KÍCH HOẠT                            │
├─────────────────────────────────────────────────────────────┤
│  HWID: a1b2c3d4e5f6... (đã hash)                           │
│  Tên thiết bị: PC Gaming của Minh                          │
│  IP: 113.xxx.xxx.xxx                                        │
│  Kích hoạt: 15/01/2026 10:30                               │
│  Lần cuối online: 2 phút trước                              │
│                                                             │
│  Thông tin máy:                                             │
│  - OS: Windows 11 Pro 64-bit                                │
│  - CPU: Intel Core i7-12700K (12 cores)                     │
│  - RAM: 32 GB                                               │
│  - App version: 1.2.0                                       │
└─────────────────────────────────────────────────────────────┘
```

### Log hành động (Usage Logs)

Server cũng ghi log mọi hành động:

| Action | Mô tả |
|--------|-------|
| `VALIDATE` | Kiểm tra key |
| `ACTIVATE` | Kích hoạt thiết bị mới |
| `DEACTIVATE` | Gỡ thiết bị |
| `HEARTBEAT` | Ping định kỳ |
| `SUSPEND` | Admin tạm khóa |
| `REVOKE` | Admin thu hồi |
| `RESET_HWID` | Admin reset HWID |
| `EXTEND` | Admin gia hạn |
| `BAN` | Admin cấm key |

---

## 👤 GÁN LICENSE CHO TÀI KHOẢN NGƯỜI DÙNG

### Tính năng Admin

Admin có thể gán license key cho một tài khoản người dùng cụ thể (user đã đăng ký trên website).

**Lợi ích:**
- User có thể xem license của mình trong trang Profile
- Dễ quản lý và hỗ trợ khách hàng
- Liên kết đơn hàng với user

### Cách gán (trên Dashboard)

1. Vào **Dashboard → Licenses**
2. Click **⋮** (menu) ở license cần gán
3. Chọn **"Gán cho người dùng"**
4. Tìm user bằng email hoặc tên
5. Click chọn user để gán

### API Gán User (cho Admin)

**Endpoint:** `PATCH /api/admin/licenses/{id}`

**Request Body:**
```json
{
  "userId": "user_id_here"
}
```

**Gỡ user khỏi license:**
```json
{
  "userId": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đã cập nhật license",
  "data": {
    "id": "...",
    "key": "XXXX-XXXX-XXXX-XXXX",
    "userId": "user_id_here",
    "user": {
      "id": "user_id_here",
      "name": "Nguyễn Văn A",
      "email": "user@example.com"
    }
  }
}
```

### API Tìm User (cho Admin)

**Endpoint:** `GET /api/admin/users/search?q={query}`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_id",
      "name": "Nguyễn Văn A",
      "email": "user@example.com",
      "image": "...",
      "role": "USER",
      "licenseCount": 2
    }
  ]
}
```

### Lưu ý

- License có thể tồn tại **không cần gắn với user** (bán key riêng)
- Một user có thể có **nhiều license keys**
- Gán user chỉ để quản lý, **không ảnh hưởng** đến việc activate bằng HWID
- App vẫn dùng HWID để verify, không dùng user ID

---

## �🔑 Endpoints cho App

### 1. Validate Key (Kiểm tra key hợp lệ)

Kiểm tra xem license key có hợp lệ không mà KHÔNG kích hoạt.

**Endpoint:** `POST /api/license/validate`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "optional-hardware-id"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | ✅ | License key format XXXX-XXXX-XXXX-XXXX |
| hwid | string | ❌ | Hardware ID (optional, để check xem HWID đã active chưa) |

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "keyId": "clxxxxx",
    "status": "ACTIVE",
    "plan": {
      "id": "clxxxxx",
      "name": "Pro Monthly",
      "durationType": "MONTH",
      "durationValue": 1
    },
    "activatedAt": "2024-01-15T10:30:00.000Z",
    "expiresAt": "2024-02-15T10:30:00.000Z",
    "daysRemaining": 25,
    "currentDevices": 1,
    "maxDevices": 2,
    "isHwidActivated": true
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "error": "KEY_EXPIRED",
  "message": "Key đã hết hạn"
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| INVALID_KEY | Key không tồn tại |
| KEY_EXPIRED | Key đã hết hạn |
| KEY_REVOKED | Key đã bị thu hồi |
| KEY_BANNED | Key đã bị cấm |
| KEY_SUSPENDED | Key đang bị tạm khóa |
| HWID_NOT_ACTIVATED | HWID chưa được kích hoạt (khi key đã full device) |

---

### 2. Activate Key (Kích hoạt key với HWID)

Kích hoạt license key trên một thiết bị mới.

**Endpoint:** `POST /api/license/activate`

**Request Body:**
```json
{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "unique-hardware-id",
  "deviceName": "John's PC",
  "deviceInfo": {
    "os": "Windows 11",
    "cpu": "Intel i7-12700K",
    "ram": "32GB",
    "appVersion": "1.0.0"
  }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | ✅ | License key |
| hwid | string | ✅ | Hardware ID duy nhất của thiết bị |
| deviceName | string | ❌ | Tên thiết bị (hiển thị cho user) |
| deviceInfo | object | ❌ | Thông tin thiết bị (JSON) |

**Response Success (200):**
```json
{
  "success": true,
  "message": "Kích hoạt thành công",
  "data": {
    "keyId": "clxxxxx",
    "plan": "Pro Monthly",
    "expiresAt": "2024-02-15T10:30:00.000Z",
    "daysRemaining": 30,
    "currentDevices": 1,
    "maxDevices": 2
  }
}
```

**Response Error - Đạt giới hạn thiết bị:**
```json
{
  "success": false,
  "error": "MAX_DEVICES_REACHED",
  "message": "Key này chỉ cho phép 2 thiết bị. Vui lòng hủy kích hoạt thiết bị khác trước.",
  "currentDevices": 2,
  "maxDevices": 2
}
```

**Error Codes:**
| Code | Description |
|------|-------------|
| MISSING_KEY | Thiếu license key |
| MISSING_HWID | Thiếu Hardware ID |
| INVALID_FORMAT | Format key không đúng |
| INVALID_KEY | Key không tồn tại |
| KEY_EXPIRED | Key đã hết hạn |
| KEY_REVOKED | Key đã bị thu hồi |
| KEY_BANNED | Key đã bị cấm |
| KEY_SUSPENDED | Key đang bị tạm khóa |
| MAX_DEVICES_REACHED | Đã đạt giới hạn số thiết bị |

---

### 3. Deactivate Device (Hủy kích hoạt thiết bị)

Hủy kích hoạt thiết bị hiện tại để chuyển sang thiết bị khác.

**Endpoint:** `POST /api/license/deactivate`

**Request Body:**
```json
{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "current-hardware-id"
}
```

**Response Success:**
```json
{
  "success": true,
  "message": "Đã hủy kích hoạt thiết bị"
}
```

---

### 4. Heartbeat (Ping định kỳ)

App gọi định kỳ để xác nhận vẫn đang sử dụng và cập nhật trạng thái.

**Endpoint:** `POST /api/license/heartbeat`

**Request Body:**
```json
{
  "key": "XXXX-XXXX-XXXX-XXXX",
  "hwid": "hardware-id"
}
```

**Response Success:**
```json
{
  "valid": true,
  "data": {
    "expiresAt": "2024-02-15T10:30:00.000Z",
    "daysRemaining": 25,
    "plan": "Pro Monthly"
  }
}
```

**Response Error:**
```json
{
  "valid": false,
  "error": "KEY_EXPIRED"
}
```

**Khuyến nghị:** Gọi heartbeat **mỗi 5 phút** khi app đang chạy. Đây là **BẮT BUỘC**.

### Heartbeat Flow Chi Tiết:

```
[App khởi động thành công]
    ↓
[Bắt đầu timer 5 phút]
    ↓
[Gọi /api/license/heartbeat]
    ├─ Success (valid: true)
    │   └─ Reset timer, tiếp tục 5 phút sau
    │
    ├─ Network Error (timeout, no connection)
    │   ├─ Retry lần 1 (sau 30s)
    │   ├─ Retry lần 2 (sau 30s)
    │   ├─ Retry lần 3 (sau 30s)
    │   └─ Nếu vẫn fail → Hiện cảnh báo mất mạng
    │
    └─ Error (valid: false)
        ├─ KEY_EXPIRED → Khóa app, hiện "Key hết hạn"
        ├─ KEY_REVOKED → Khóa app, hiện "Key đã bị thu hồi"
        ├─ KEY_BANNED → Khóa app, hiện "Key đã bị cấm"
        ├─ KEY_SUSPENDED → Khóa app, hiện "Key tạm khóa"
        └─ DEVICE_DEACTIVATED → Khóa app, hiện "Thiết bị đã bị gỡ"
```

### Pseudocode Heartbeat:

```javascript
// Constants
const HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 phút
const RETRY_DELAY = 30 * 1000; // 30 giây
const MAX_RETRIES = 3;
const MAX_OFFLINE_TIME = 10 * 60 * 1000; // 10 phút

let lastSuccessfulHeartbeat = Date.now();
let retryCount = 0;

async function heartbeat() {
  try {
    const response = await fetch('/api/license/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: savedKey, hwid: deviceHwid }),
      timeout: 10000 // 10 giây timeout
    });
    
    const data = await response.json();
    
    if (data.valid) {
      // Success - reset counters
      lastSuccessfulHeartbeat = Date.now();
      retryCount = 0;
      scheduleNextHeartbeat(HEARTBEAT_INTERVAL);
    } else {
      // Key không còn hợp lệ
      handleInvalidKey(data.error);
    }
  } catch (error) {
    // Network error
    handleNetworkError();
  }
}

function handleNetworkError() {
  retryCount++;
  
  if (retryCount <= MAX_RETRIES) {
    // Retry sau 30 giây
    showWarning(`Mất kết nối. Đang thử lại (${retryCount}/${MAX_RETRIES})...`);
    scheduleNextHeartbeat(RETRY_DELAY);
  } else {
    // Đã retry hết
    const offlineTime = Date.now() - lastSuccessfulHeartbeat;
    
    if (offlineTime > MAX_OFFLINE_TIME) {
      // Quá 10 phút offline → force logout
      forceLogout("Mất kết nối quá lâu. Vui lòng đăng nhập lại.");
    } else {
      // Hiện cảnh báo, cho retry thủ công
      showError("Không thể kết nối server. Kiểm tra mạng và thử lại.");
      lockPremiumFeatures();
    }
  }
}

function handleInvalidKey(errorCode) {
  const messages = {
    'KEY_EXPIRED': 'License key đã hết hạn. Vui lòng gia hạn.',
    'KEY_REVOKED': 'License key đã bị thu hồi.',
    'KEY_BANNED': 'License key đã bị cấm do vi phạm.',
    'KEY_SUSPENDED': 'License key đang bị tạm khóa.',
    'DEVICE_DEACTIVATED': 'Thiết bị này đã bị gỡ khỏi license.'
  };
  
  forceLogout(messages[errorCode] || 'License không hợp lệ.');
}
```

---

## 🔧 Cách tạo Hardware ID (HWID)

HWID cần phải **duy nhất** và **ổn định** trên mỗi thiết bị. Dưới đây là các cách phổ biến:

### Windows (C#)
```csharp
using System.Management;

public static string GetHardwareId()
{
    string cpuId = "";
    string diskId = "";
    string motherboardId = "";
    
    // CPU ID
    using (var searcher = new ManagementObjectSearcher("SELECT ProcessorId FROM Win32_Processor"))
    {
        foreach (var item in searcher.Get())
        {
            cpuId = item["ProcessorId"]?.ToString() ?? "";
            break;
        }
    }
    
    // Disk Serial
    using (var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_DiskDrive"))
    {
        foreach (var item in searcher.Get())
        {
            diskId = item["SerialNumber"]?.ToString() ?? "";
            break;
        }
    }
    
    // Motherboard Serial
    using (var searcher = new ManagementObjectSearcher("SELECT SerialNumber FROM Win32_BaseBoard"))
    {
        foreach (var item in searcher.Get())
        {
            motherboardId = item["SerialNumber"]?.ToString() ?? "";
            break;
        }
    }
    
    // Combine and hash
    string combined = $"{cpuId}-{diskId}-{motherboardId}";
    using (var sha256 = System.Security.Cryptography.SHA256.Create())
    {
        byte[] hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(combined));
        return BitConverter.ToString(hashBytes).Replace("-", "").Substring(0, 32);
    }
}
```

### Windows (C++)
```cpp
#include <windows.h>
#include <intrin.h>
#include <string>
#include <sstream>

std::string GetHardwareId() {
    // CPU ID
    int cpuInfo[4] = {0};
    __cpuid(cpuInfo, 0);
    
    std::stringstream ss;
    ss << std::hex << cpuInfo[0] << cpuInfo[1] << cpuInfo[2] << cpuInfo[3];
    
    // Volume Serial Number
    DWORD volumeSerial = 0;
    GetVolumeInformationA("C:\\", NULL, 0, &volumeSerial, NULL, NULL, NULL, 0);
    ss << volumeSerial;
    
    // Computer Name
    char computerName[256];
    DWORD size = sizeof(computerName);
    GetComputerNameA(computerName, &size);
    ss << computerName;
    
    return ss.str();
}
```

### Python
```python
import hashlib
import platform
import uuid
import subprocess

def get_hardware_id():
    # MAC Address
    mac = hex(uuid.getnode())
    
    # Platform info
    system_info = platform.uname()
    
    # Combine
    combined = f"{mac}-{system_info.node}-{system_info.machine}"
    
    # Hash
    return hashlib.sha256(combined.encode()).hexdigest()[:32]
```

### Android (Java/Kotlin)
```kotlin
import android.provider.Settings
import java.security.MessageDigest

fun getHardwareId(context: Context): String {
    val androidId = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ANDROID_ID
    )
    
    val digest = MessageDigest.getInstance("SHA-256")
    val hash = digest.digest(androidId.toByteArray())
    return hash.joinToString("") { "%02x".format(it) }.substring(0, 32)
}
```

---

## 📋 Flow tích hợp khuyến nghị

### 0. Kiểm tra kết nối mạng (QUAN TRỌNG)

```
[App khởi động]
    ↓
1. Kiểm tra có kết nối Internet không
   ├─ Có mạng → Tiếp tục bước 1
   └─ Không có mạng → Hiện thông báo:
      "⚠️ Yêu cầu kết nối Internet
       App cần kết nối mạng để xác thực license.
       Vui lòng kiểm tra kết nối và thử lại."
      [Nút: Thử lại]
```

### 1. Khi app khởi động

```
1. Kiểm tra có saved license key không
   └─ Nếu không → Hiện form nhập key
   
2. Nếu có key → Gọi /api/license/activate với key + HWID
   ├─ Success → Cho phép sử dụng app
   ├─ KEY_EXPIRED → Hiện thông báo hết hạn + link gia hạn
   ├─ MAX_DEVICES_REACHED → Hướng dẫn deactivate thiết bị khác
   └─ Lỗi khác → Hiện message lỗi
```

### 2. Trong quá trình sử dụng

```
1. Gọi heartbeat mỗi 5 phút (BẮT BUỘC)
   ├─ valid: true → Tiếp tục bình thường
   ├─ valid: false → Khóa app ngay lập tức
   └─ Network error → Retry 3 lần, rồi khóa nếu fail

2. Lưu key vào storage an toàn (encrypted)

3. KHÔNG cache license data để dùng offline
   → Luôn yêu cầu verify online

4. Monitor network status:
   → Khi mất mạng: Hiện warning, chờ reconnect
   → Khi có mạng lại: Tự động heartbeat ngay
```

### 3. Khi user đăng xuất / uninstall

```
1. Gọi /api/license/deactivate để giải phóng slot
2. Xóa saved key khỏi storage
```

---

## 🔒 Bảo mật

### Khuyến nghị cho App

1. **Không hardcode API URL** - Lưu trong config có thể update
2. **Mã hóa key khi lưu** - Không lưu plaintext
3. **Validate response** - Kiểm tra signature/checksum nếu cần
4. **Rate limiting** - Không spam API (tối đa 1 request/giây)
5. **Obfuscate code** - Khó reverse engineer hơn
6. **KHÔNG cho phép offline** - Luôn require network
7. **Kiểm tra SSL certificate** - Tránh MITM attack

### Request Timeout Settings

| API | Timeout khuyến nghị |
|-----|---------------------|
| validate | 10 giây |
| activate | 15 giây |
| deactivate | 10 giây |
| heartbeat | 10 giây |

### Retry Policy

```
Khi request thất bại (network error, timeout):

1. Retry tối đa: 3 lần
2. Delay giữa các lần: 30 giây
3. Backoff: Không cần (fixed delay)
4. Sau 3 lần fail:
   - Heartbeat: Khóa app, yêu cầu kiểm tra mạng
   - Activate: Hiện lỗi, cho user thử lại thủ công
   - Validate: Hiện lỗi, cho user thử lại thủ công
```

### HWID Security

1. **Hash HWID** - Server sẽ hash HWID trước khi lưu (SHA-256)
2. **Không gửi sensitive data** - Chỉ gửi hash của hardware info
3. **Consistent HWID** - Đảm bảo HWID không đổi khi user cài lại app

---

## � Xử lý lỗi & Edge Cases

### Network Error Handling

| Tình huống | Hành động App |
|------------|---------------|
| Không có Internet khi khởi động | Chặn, yêu cầu kết nối mạng |
| Mất mạng giữa chừng | Retry 3 lần → Khóa tính năng |
| Request timeout | Retry với timeout dài hơn |
| Server 500 error | Retry 3 lần → Hiện lỗi server |
| Server maintenance (503) | Hiện "Server đang bảo trì" |

### Error Messages cho User

```javascript
const ERROR_MESSAGES = {
  // Network errors
  'NETWORK_ERROR': 'Không thể kết nối server. Vui lòng kiểm tra kết nối mạng.',
  'TIMEOUT': 'Kết nối quá chậm. Vui lòng thử lại.',
  'SERVER_ERROR': 'Lỗi server. Vui lòng thử lại sau.',
  'MAINTENANCE': 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
  
  // License errors
  'INVALID_KEY': 'License key không hợp lệ.',
  'KEY_EXPIRED': 'License key đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
  'KEY_REVOKED': 'License key đã bị thu hồi. Liên hệ hỗ trợ nếu cần.',
  'KEY_BANNED': 'License key đã bị khóa vĩnh viễn do vi phạm điều khoản.',
  'KEY_SUSPENDED': 'License key đang bị tạm khóa. Liên hệ hỗ trợ.',
  'MAX_DEVICES_REACHED': 'Đã đạt giới hạn thiết bị. Gỡ thiết bị khác để tiếp tục.',
  'DEVICE_DEACTIVATED': 'Thiết bị này đã bị gỡ khỏi license.',
  
  // Other
  'INVALID_HWID': 'Không thể xác định thiết bị. Vui lòng khởi động lại app.',
  'MISSING_KEY': 'Chưa nhập license key.',
};
```

### Checklist trước khi Release App

- [ ] Kiểm tra network trước mọi API call
- [ ] Hiển thị loading khi đang verify license
- [ ] Xử lý tất cả error codes
- [ ] Retry logic với exponential backoff
- [ ] Heartbeat chạy đúng 5 phút/lần
- [ ] Khóa app khi heartbeat fail liên tục
- [ ] Encrypt license key khi lưu local
- [ ] Không cache license để dùng offline
- [ ] Test với mạng chậm/không ổn định
- [ ] Test khi server trả về lỗi

---

## �📊 Status Codes Reference

### Key Status
| Status | Description | Có thể sử dụng |
|--------|-------------|----------------|
| INACTIVE | Chưa kích hoạt lần nào | ✅ (sẽ active khi activate) |
| ACTIVE | Đang hoạt động | ✅ |
| EXPIRED | Đã hết hạn | ❌ |
| SUSPENDED | Tạm khóa (admin) | ❌ |
| REVOKED | Thu hồi vĩnh viễn | ❌ |
| BANNED | Bị cấm (vi phạm) | ❌ |

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized |
| 404 | Not Found (key không tồn tại) |
| 500 | Server Error |

---

## 🔔 Webhook - Payment Notification

Endpoint nhận thông báo thanh toán từ payment gateway để tự động kích hoạt license.

**Endpoint:** `POST /api/webhooks/payment`

**Request Body:**
```json
{
  "orderCode": "ORD1ABC2DEF",
  "amount": 150000,
  "transactionId": "TXN123456789",
  "bankCode": "MBB",
  "paidAt": "2024-01-15T10:30:00Z",
  "signature": "sha256_hmac_signature"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orderCode | string | ✅ | Mã đơn hàng (nội dung chuyển khoản) |
| amount | number | ✅ | Số tiền (VND) |
| transactionId | string | ❌ | Mã giao dịch từ bank |
| bankCode | string | ❌ | Mã ngân hàng |
| paidAt | string | ❌ | Thời gian thanh toán (ISO 8601) |
| signature | string | ❌ | HMAC-SHA256 signature |

**Signature Generation:**
```javascript
const crypto = require('crypto');
const data = JSON.stringify({
  orderCode: "ORD1ABC2DEF",
  amount: 150000,
  transactionId: "TXN123456789"
});
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(data)
  .digest('hex');
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Payment confirmed and license activated",
  "orderId": "clxxxxx",
  "licenseKey": "ABCD-EFGH-IJKL-MNOP"
}
```

---

## 🧪 Test Keys

Trong môi trường development, bạn có thể tạo test key qua Dashboard:

1. Đăng nhập Admin Dashboard
2. Vào **Licenses** → **Tạo Key**
3. Chọn plan và tạo key
4. Copy key để test

---

## 📞 Hỗ trợ

Nếu cần hỗ trợ kỹ thuật về tích hợp API, vui lòng liên hệ:

- Email: support@your-domain.com
- Discord: [Your Discord Server]

---

## 📝 Changelog

### v1.2.0 (2026-01-17)
- Bổ sung yêu cầu kết nối mạng bắt buộc
- **Thêm hướng dẫn chuyển từ App Offline sang Online**
- Thêm UI mockups cho các màn hình cần tạo
- Thêm code mẫu C# WinForms đầy đủ
- Thêm checklist việc cần làm trên App
- Thêm Heartbeat flow chi tiết với retry logic
- Thêm Error handling & Edge cases
- Thêm Checklist release app
- Cập nhật interval heartbeat: 5 phút (bắt buộc)
- Bỏ hỗ trợ offline mode
- **Thêm tài liệu về deviceInfo - dữ liệu lưu từ app**
- **Thêm API và hướng dẫn gán license cho user**

### v1.1.0 (2024-01-17)
- Added payment webhook endpoint
- Auto license activation on payment

### v1.0.0 (2024-01-15)
- Initial release
- Basic license validation, activation, deactivation
- Heartbeat endpoint
- Multi-device support

