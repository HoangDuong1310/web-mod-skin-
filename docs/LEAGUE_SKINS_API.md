# League Skins API — Tài liệu cho Developer App Desktop

> Base URL production: `https://modskinslol.com`
> Base URL local: `http://localhost:3000`

---

## 1. Lấy Manifest

Manifest chứa danh sách tất cả skin có file, ngôn ngữ có sẵn, và thông tin full package.
**Client nên gọi endpoint này đầu tiên** mỗi khi mở app hoặc check update.

```
GET /api/league-skins/manifest
```

**Response:** `200 OK` — JSON trực tiếp (không redirect)

```json
{
  "version": 1713060000000,
  "resources": ["ar", "cs", "de", "default", "el", "en", "es", "fr", "hu", "id", "it", "ja", "ko", "pl", "pt", "ro", "ru", "th", "tr", "vi", "zh"],
  "skins": {
    "1001": { "hash": "abc12345", "size": 27340 },
    "1002": { "hash": "def67890", "size": 15200 },
    "1010": { "hash": "11223344", "size": 8200 },
    "222001": { "hash": "aabb1122", "size": 45000 }
  },
  "package": {
    "url": "league-skins/full-package.zip",
    "hash": "8bb1f887",
    "size": "236.2 MB",
    "buildTime": "2026-04-14T08:58:00.000Z"
  }
}
```

**Chi tiết fields:**

| Field | Type | Mô tả |
|-------|------|--------|
| `version` | `number` | Unix timestamp (milliseconds). So sánh với version cũ để biết có thay đổi. |
| `resources` | `string[]` | Mã ngôn ngữ có file `skin_ids.json` trên server. |
| `skins` | `object` | Map `skinId` (string) → `{ hash, size }`. Chỉ chứa skin **active** và **có file**. |
| `skins[id].hash` | `string \| null` | 8 ký tự đầu MD5 hash. `null` nếu file chưa có hash (upload cũ). Dùng để check file thay đổi — nếu hash khác → tải lại. |
| `skins[id].size` | `number \| null` | Kích thước file (bytes). `null` nếu chưa biết. |
| `package` | `object \| undefined` | Thông tin full package. **Không có field này** nếu chưa build package. |
| `package.url` | `string` | R2 key — không phải URL trực tiếp. Dùng endpoint `/api/league-skins/package` để tải. |
| `package.hash` | `string` | 8 ký tự MD5 hash của file zip. |
| `package.size` | `string` | Kích thước dạng text: `"236.2 MB"`. **Đây là string, không phải number.** |
| `package.buildTime` | `string` | ISO 8601 timestamp khi package được build. |

**Lỗi:**
- `404` — Manifest chưa được tạo. Admin cần vào dashboard bấm tạo.

**Cache header:** `max-age=60` — client nên cache tối đa 1 phút.

**Curl test:**
```bash
curl -s https://modskinslol.com/api/league-skins/manifest | head -c 500
```

---

## 2. Tải Full Package (lần cài đầu)

Tải file zip chứa toàn bộ skins + resources + manifest. Dùng cho lần cài đặt đầu tiên.

```
GET /api/league-skins/package
```

**Response:** `307 Temporary Redirect` → Presigned R2 URL (hết hạn sau 1 giờ)

**⚠️ Quan trọng cho C#/.NET:**
- Response là redirect 307, **không phải file trực tiếp**
- `HttpClient` mặc định tự follow redirect (cả 302 và 307) → sẽ tải file tự động
- Nếu dùng `HttpWebRequest`, cần set `AllowAutoRedirect = true`
- URL redirect có dạng: `https://{account}.r2.cloudflarestorage.com/modskinslol/league-skins/full-package.zip?X-Amz-...`

**Cấu trúc bên trong file zip:**
```
skins/
├── 1/                          # championId = 1 (Annie)
│   ├── 1001/
│   │   └── 1001.zip           # Skin chính
│   └── 1001/
│       └── 1010/
│           └── 1010.zip       # Chroma
├── 222/                        # championId = 222 (Zeri)
│   └── 222001/
│       └── 222001.zip
└── .../
resources/
├── vi/
│   └── skin_ids.json
├── en/
│   └── skin_ids.json
└── .../
manifest.json
```

**Lưu ý:** File zip dùng STORE mode (không nén) vì các file bên trong đã là .zip.

**Lỗi:**
- `404` `{"error": "Package not available. Admin needs to build it first."}` — Package chưa build.

**Curl test:**
```bash
# Xem redirect URL (không follow)
curl -s -o /dev/null -w "%{redirect_url}" https://modskinslol.com/api/league-skins/package

# Tải file (follow redirect)
curl -L -o full-package.zip https://modskinslol.com/api/league-skins/package
```

---

## 3. Tải Skin Riêng Lẻ

Tải file .zip của 1 skin cụ thể. Dùng khi cập nhật incremental.

```
GET /api/league-skins/{skinId}/download
```

**Params:** `skinId` — số nguyên, ví dụ: `1001`, `222003`, `1010`

**Response:** `307 Temporary Redirect` → Presigned R2 URL (1 giờ)

**Lỗi:**
- `400` `{"error": "Invalid skin ID"}` — skinId không phải số
- `404` `{"error": "Skin not found"}` — Skin không tồn tại, chưa có file, hoặc bị disable (`isActive = false`)

**Lưu ý:**
- Skin bị admin disable (`isActive = false`) sẽ trả 404 — client nên xóa file local
- Chroma cũng tải qua endpoint này (chroma có skinId riêng)

**Curl test:**
```bash
# Xem redirect URL
curl -s -o /dev/null -w "%{redirect_url}" https://modskinslol.com/api/league-skins/1001/download

# Tải file
curl -L -o 1001.zip https://modskinslol.com/api/league-skins/1001/download
```

---

## 4. Tải Resource Ngôn Ngữ

Tải file `skin_ids.json` chứa tên skin theo ngôn ngữ.

```
GET /api/league-skins/resources/{lang}
```

**Params:** `lang` — mã ngôn ngữ. Giá trị hợp lệ:
`ar`, `cs`, `de`, `default`, `el`, `en`, `es`, `fr`, `hu`, `id`, `it`, `ja`, `ko`, `pl`, `pt`, `ro`, `ru`, `th`, `tr`, `vi`, `zh`

**Response:** `200 OK` — File binary download (không phải JSON response)

```
Content-Type: application/json
Content-Disposition: attachment; filename="skin_ids_vi.json"
Cache-Control: public, max-age=3600, s-maxage=86400
```

**Nội dung file skin_ids.json:**
```json
{
  "1000": "Annie",
  "1001": "Annie Ma Cà Rồng",
  "1002": "Annie Cô Bé Quàng Khăn Đỏ",
  "1010": "Annie Ma Cà Rồng Đa Sắc Hồng",
  "1011": "Annie Ma Cà Rồng Đa Sắc Xanh",
  "222000": "Zeri",
  "222001": "Zeri Withered Rose"
}
```

Key là `skinId` (string), value là tên skin. Bao gồm cả skin gốc (skinId kết thúc bằng `000`) và chroma.

**Lỗi:**
- `400` `{"error": "Invalid language"}` — Mã ngôn ngữ không hợp lệ
- `404` `{"error": "Resource not found"}` — File chưa upload cho ngôn ngữ này

**Curl test:**
```bash
curl -L -o skin_ids_vi.json https://modskinslol.com/api/league-skins/resources/vi
```

---

## Flow Tích Hợp Cho Desktop Client

### A. Lần cài đặt đầu tiên

```
1. GET /api/league-skins/manifest
   ├── Kiểm tra field "package" có tồn tại không
   └── Lưu manifest.version vào config local

2. Nếu có package:
   GET /api/league-skins/package
   ├── Tải full-package.zip (~236MB)
   ├── Giải nén vào thư mục data
   └── Xong — đã có đầy đủ skins + resources

3. Nếu KHÔNG có package (hiếm):
   ├── GET /api/league-skins/resources/{lang} — tải skin_ids.json
   └── Với mỗi skinId trong manifest.skins:
       GET /api/league-skins/{skinId}/download — tải từng file
```

### B. Kiểm tra cập nhật

```
1. GET /api/league-skins/manifest
   ├── So sánh manifest.version với version đã lưu
   └── Nếu bằng nhau → không có gì mới, dừng

2. Nếu version mới hơn:
   ├── THÊM MỚI: skinId có trong manifest.skins nhưng không có local
   │   → GET /api/league-skins/{skinId}/download
   │
   ├── CẬP NHẬT: skinId có cả 2 bên nhưng hash khác
   │   → GET /api/league-skins/{skinId}/download (tải lại)
   │
   ├── XÓA: skinId có local nhưng KHÔNG có trong manifest.skins
   │   → Xóa file local (skin bị disable hoặc xóa)
   │
   └── Cập nhật manifest.version local

3. (Tùy chọn) Kiểm tra package mới:
   ├── So sánh manifest.package.hash với hash đã lưu
   └── Nếu khác → có thể tải lại full package thay vì update từng file
```

### C. Cấu trúc thư mục local gợi ý

```
%APPDATA%/ModSkinLoL/
├── config.json
│   {
│     "manifestVersion": 1713060000000,
│     "packageHash": "8bb1f887",
│     "language": "vi"
│   }
│
├── skins/
│   ├── 1/
│   │   ├── 1001/1001.zip
│   │   └── 1001/1010/1010.zip
│   ├── 222/
│   │   └── 222001/222001.zip
│   └── .../
│
└── resources/
    └── vi/
        └── skin_ids.json
```

**Lưu ý về đường dẫn file local:**
- Cấu trúc thư mục local nên giống cấu trúc trong zip/R2
- skinId chứa championId: `championId = Math.floor(skinId / 1000)`
- Chroma nằm trong thư mục skin gốc: `skins/{champId}/{parentSkinId}/{chromaId}/`

---

## Quy tắc SkinId

| Loại | Format | Ví dụ |
|------|--------|-------|
| Skin gốc (default) | `{champId}000` | `1000` (Annie default), `222000` (Zeri default) |
| Skin chính | `{champId}0XX` | `1001` (Annie skin 1), `222003` (Zeri skin 3) |
| Chroma | `{champId}0XX` (>= base+10) | `1010` (chroma của 1001), `1011`, `1012`... |

**Cách tính:**
- `championId = Math.floor(skinId / 1000)`
- `skinNum = skinId % 1000` (dùng cho splash art URL)
- Chroma có `parentSkinId` trong DB, nhưng client không cần biết — chỉ cần tải theo skinId

---

## Splash Art URL (hiển thị ảnh)

Ảnh splash art lấy từ CommunityDragon CDN (không cần API key):

```
https://cdn.communitydragon.org/latest/champion/{championId}/splash-art/skin/{skinNum}
```

Ví dụ:
- Skin `1001` → champId=1, skinNum=1 → `https://cdn.communitydragon.org/latest/champion/1/splash-art/skin/1`
- Skin `222003` → champId=222, skinNum=3 → `https://cdn.communitydragon.org/latest/champion/222/splash-art/skin/3`
- Default skin `1000` → skinNum=0 → `https://cdn.communitydragon.org/latest/champion/1/splash-art/skin/0`

---

## Error Handling

Tất cả error response đều có format:
```json
{ "error": "Mô tả lỗi" }
```

| HTTP Code | Ý nghĩa |
|-----------|---------|
| `200` | Thành công (manifest, resources) |
| `302` | Redirect đến presigned URL (download, package) |
| `400` | Request không hợp lệ (skinId sai, lang sai) |
| `404` | Không tìm thấy (skin chưa có file, package chưa build, manifest chưa tạo) |
| `500` | Lỗi server |

**Presigned URL hết hạn sau 1 giờ.** Nếu tải chậm, cần gọi lại endpoint để lấy URL mới.

---

## Rate Limiting

Hiện tại **không có rate limit** trên các public API. Tuy nhiên:
- Nên cache manifest local (check mỗi 5-10 phút, không phải mỗi giây)
- Tải skin song song tối đa 5-10 connections
- Không spam download endpoint

---

## Ví dụ Code C#

### Lấy manifest
```csharp
using var client = new HttpClient();
var json = await client.GetStringAsync("https://modskinslol.com/api/league-skins/manifest");
var manifest = JsonSerializer.Deserialize<Manifest>(json);
```

### Tải skin file
```csharp
// HttpClient tự follow redirect
using var client = new HttpClient();
var bytes = await client.GetByteArrayAsync(
    $"https://modskinslol.com/api/league-skins/{skinId}/download"
);
File.WriteAllBytes($"skins/{champId}/{skinId}/{skinId}.zip", bytes);
```

### Tải full package
```csharp
using var client = new HttpClient();
using var stream = await client.GetStreamAsync(
    "https://modskinslol.com/api/league-skins/package"
);
using var file = File.Create("full-package.zip");
await stream.CopyToAsync(file);
// Giải nén
ZipFile.ExtractToDirectory("full-package.zip", "data/");
```

### Check update
```csharp
var manifest = await GetManifest();
if (manifest.Version <= savedVersion) return; // Không có gì mới

foreach (var (skinId, info) in manifest.Skins)
{
    var localHash = GetLocalHash(skinId);
    if (localHash == null)
    {
        // Skin mới — tải về
        await DownloadSkin(skinId);
    }
    else if (localHash != info.Hash)
    {
        // Skin thay đổi — tải lại
        await DownloadSkin(skinId);
    }
}

// Xóa skin không còn trong manifest
foreach (var localSkinId in GetLocalSkinIds())
{
    if (!manifest.Skins.ContainsKey(localSkinId))
    {
        DeleteLocalSkin(localSkinId);
    }
}

SaveVersion(manifest.Version);
```
