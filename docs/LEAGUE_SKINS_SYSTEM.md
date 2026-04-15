# League Skins System — Developer Documentation

Tài liệu dành cho developer app desktop (client) tích hợp với hệ thống League Skins.

## Tổng quan kiến trúc

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Desktop Client  │────▶│   Web API    │────▶│  Cloudflare R2  │
│  (App C#/.NET)   │     │  (Next.js)   │     │  (File Storage) │
└─────────────────┘     └──────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   MySQL DB   │
                        │  (Prisma)    │
                        └──────────────┘
```

- **R2**: Lưu trữ file skin (.zip), resources (skin_ids.json), manifest.json, full-package.zip
- **DB**: Metadata skin (tên, championId, skinId, fileUrl, isActive, isChroma...)
- **API**: Public endpoints cho client, Admin endpoints cho dashboard

---

## Cấu trúc R2

```
league-skins/
├── manifest.json                              # Manifest chính — client đọc đầu tiên
├── full-package.zip                           # Full package cho lần cài đầu
├── resources/
│   ├── vi/skin_ids.json                       # Tên skin tiếng Việt
│   ├── en/skin_ids.json                       # Tên skin tiếng Anh
│   └── .../                                   # 21 ngôn ngữ
└── skins/
    ├── {championId}/
    │   ├── {skinId}/
    │   │   └── {skinId}.zip                   # File skin chính
    │   └── {parentSkinId}/
    │       └── {chromaId}/
    │           └── {chromaId}.zip             # File chroma (đa sắc)
    └── .../
```

### Ví dụ cụ thể
```
league-skins/skins/1/1001/1001.zip            # Annie - Goth Annie
league-skins/skins/1/1001/1010/1010.zip        # Annie - Goth Annie Chroma 1
league-skins/skins/222/222001/222001.zip        # Zeri - Skin 1
league-skins/resources/vi/skin_ids.json         # {"1001": "Annie Ma Cà Rồng", ...}
```

---

## Public API Endpoints (cho Desktop Client)

### 1. GET `/api/league-skins/manifest`

Trả về manifest.json — **client nên gọi đầu tiên** để biết danh sách skin có sẵn.

**Response:**
```json
{
  "version": 1713060000000,
  "resources": ["vi", "en", "ko", "ja", ...],
  "skins": {
    "1001": { "hash": "abc12345", "size": 27340 },
    "1002": { "hash": "def67890", "size": 15200 },
    ...
  },
  "package": {
    "url": "league-skins/full-package.zip",
    "hash": "8bb1f887",
    "size": "236.2 MB",
    "buildTime": "2026-04-14T08:58:00.000Z"
  }
}
```

| Field | Mô tả |
|-------|--------|
| `version` | Timestamp (ms) — so sánh với version cũ để biết có cập nhật |
| `resources` | Danh sách ngôn ngữ có sẵn |
| `skins` | Map skinId → { hash (8 ký tự MD5), size (bytes) } |
| `skins[id].hash` | Dùng để check file đã thay đổi chưa (so với hash local) |
| `package` | Thông tin full package zip (null nếu chưa build) |
| `package.url` | R2 key — dùng với endpoint `/api/league-skins/package` |

**Cache:** `max-age=60, s-maxage=300` — client nên cache 1 phút.

---

### 2. GET `/api/league-skins/{skinId}/download`

Tải file skin cụ thể. Redirect đến presigned URL trên R2 (1 giờ).

**Params:** `skinId` (number) — ví dụ: `1001`

**Response:** `302 Redirect` → presigned R2 URL

**Lỗi:**
- `404` — Skin không tồn tại hoặc chưa có file hoặc bị disable

---

### 3. GET `/api/league-skins/package`

Tải full package zip cho lần cài đầu. Redirect đến presigned URL.

**Response:** `302 Redirect` → presigned R2 URL

**Lỗi:**
- `404` — Package chưa được build

---

### 4. GET `/api/league-skins/resources/{lang}`

Tải file skin_ids.json cho ngôn ngữ cụ thể.

**Params:** `lang` — mã ngôn ngữ: `vi`, `en`, `ko`, `ja`, `zh`, `fr`, `de`, `es`, `pt`, `ru`, `th`, `tr`, `ar`, `cs`, `el`, `hu`, `id`, `it`, `pl`, `ro`, `default`

**Response:** File JSON download

**Lỗi:**
- `400` — Ngôn ngữ không hợp lệ
- `404` — File không tồn tại

---

## Flow cho Desktop Client

### Lần cài đầu tiên

```
1. GET /api/league-skins/manifest
   → Lấy manifest, check package.url có tồn tại không

2. GET /api/league-skins/package
   → Tải full-package.zip (~236MB)
   → Giải nén vào thư mục local

3. GET /api/league-skins/resources/{lang}
   → Tải skin_ids.json cho ngôn ngữ user
   → (Đã có trong package, nhưng có thể tải riêng nếu cần ngôn ngữ khác)

4. Lưu manifest.version vào local config
```

### Cập nhật (lần sau)

```
1. GET /api/league-skins/manifest
   → So sánh manifest.version với version đã lưu

2. Nếu version mới hơn:
   → So sánh manifest.skins với danh sách local
   → Tìm skin mới (skinId không có trong local)
   → Tìm skin thay đổi (hash khác)
   → Tìm skin bị xóa (skinId có trong local nhưng không có trong manifest)

3. Với mỗi skin mới/thay đổi:
   GET /api/league-skins/{skinId}/download
   → Tải và thay thế file local

4. Xóa skin không còn trong manifest

5. Cập nhật manifest.version local
```

### Cấu trúc thư mục local (gợi ý)

```
AppData/
└── ModSkinLoL/
    ├── config.json          # { "manifestVersion": 1713060000000, "lang": "vi" }
    ├── manifest.json        # Cache manifest mới nhất
    ├── resources/
    │   └── vi/
    │       └── skin_ids.json
    └── skins/
        ├── 1/
        │   ├── 1001/1001.zip
        │   └── 1001/1010/1010.zip
        └── .../
```

---

## Cấu trúc file skin_ids.json

```json
{
  "1000": "Annie",
  "1001": "Annie Ma Cà Rồng",
  "1002": "Annie Cô Bé Quàng Khăn Đỏ",
  "1010": "Annie Ma Cà Rồng Đa Sắc 1",
  ...
}
```

Key là `skinId` (string), value là tên skin theo ngôn ngữ.

---

## Database Schema (LeagueSkin)

```prisma
model LeagueSkin {
  id           String   @id @default(cuid())
  skinId       Int      @unique          // ID skin từ Riot (ví dụ: 1001)
  championId   Int                       // ID tướng (ví dụ: 1 = Annie)
  championName String                    // Tên tướng
  nameEn       String                    // Tên skin tiếng Anh
  nameVi       String?                   // Tên skin tiếng Việt
  isActive     Boolean  @default(true)   // Có hiển thị cho client không
  isChroma     Boolean  @default(false)  // Có phải đa sắc không
  parentSkinId Int?                      // SkinId của skin gốc (nếu là chroma)
  fileUrl      String?                   // R2 key (ví dụ: league-skins/skins/1/1001/1001.zip)
  fileSize     Int?                      // Kích thước file (bytes)
  fileHash     String?                   // MD5 hash
  version      Int      @default(1)      // Tăng mỗi lần upload file mới
}
```

### Quan hệ Skin - Chroma

- Skin chính: `isChroma = false`, `parentSkinId = null`
- Chroma: `isChroma = true`, `parentSkinId = skinId của skin gốc`
- Ví dụ: Skin 1001 (Annie Goth) có chroma 1010, 1011, 1012
  - 1001: `isChroma=false, parentSkinId=null`
  - 1010: `isChroma=true, parentSkinId=1001`

---

## Admin API Endpoints (cho Dashboard)

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/admin/league-skins` | Danh sách skin (phân trang, filter) |
| DELETE | `/api/admin/league-skins` | Xóa champion và tất cả skin |
| PUT | `/api/admin/league-skins/{skinId}` | Upload file hoặc cập nhật metadata |
| DELETE | `/api/admin/league-skins/{skinId}` | Xóa file skin (giữ metadata) |
| POST | `/api/admin/league-skins/upload` | Upload nhiều file cùng lúc |
| GET | `/api/admin/league-skins/sync-cdragon` | Check skin mới từ CommunityDragon |
| POST | `/api/admin/league-skins/sync-cdragon` | Import skin mới vào DB |
| POST | `/api/admin/league-skins/sync-r2` | Đồng bộ R2 → DB (scan R2, cập nhật DB) |
| POST | `/api/admin/league-skins/manifest` | Tạo lại manifest.json |
| GET | `/api/admin/league-skins/build-package` | Check trạng thái build package |
| POST | `/api/admin/league-skins/build-package` | Bắt đầu build full package |
| DELETE | `/api/admin/league-skins/build-package` | Reset trạng thái build (khi bị treo) |

---

## Manifest tự động cập nhật

Manifest.json được tự động regenerate sau:
- Upload file skin (single hoặc bulk)
- Thay thế file skin
- Xóa file skin
- Sync R2 → DB

Không cần bấm tay — manifest luôn phản ánh trạng thái mới nhất.

---

## Full Package Build

### Cách hoạt động
1. List tất cả file trên R2 (skins + resources + manifest)
2. Download file mới/thay đổi vào local cache (`.cache/league-skins-package/`)
3. Build zip từ cache bằng `yazl` (STORE mode, không nén)
4. Upload zip lên R2 tại `league-skins/full-package.zip`

### Cache
- Thư mục: `.cache/league-skins-package/`
- Index: `_index.json` — mapping R2 key → file size
- Lần đầu: tải tất cả (~18 phút)
- Lần sau: chỉ tải file thay đổi (~1-2 phút)

### CLI
```bash
# Build trực tiếp (có progress output)
npx tsx scripts/build-league-skins-package.ts

# Reset trạng thái build bị treo
npx tsx scripts/reset-package-status.ts

# Test build với verbose logging
npx tsx scripts/test-package-build.ts
```

### Cấu trúc bên trong full-package.zip
```
skins/
├── 1/1001/1001.zip
├── 1/1001/1010/1010.zip
└── .../
resources/
├── vi/skin_ids.json
├── en/skin_ids.json
└── .../
manifest.json
```

---

## Splash Art URL

Ảnh splash art lấy từ CommunityDragon CDN:

```
https://cdn.communitydragon.org/latest/champion/{championId}/splash-art/skin/{skinNum}
```

Trong đó `skinNum = skinId % 1000`. Ví dụ:
- Skin 1001 → skinNum = 1 → `https://cdn.communitydragon.org/latest/champion/1/splash-art/skin/1`
- Skin 222003 → skinNum = 3 → `https://cdn.communitydragon.org/latest/champion/222/splash-art/skin/3`

---

## Scripts

| Script | Mô tả |
|--------|--------|
| `scripts/build-league-skins-package.ts` | Build full package zip (có cache + progress) |
| `scripts/test-package-build.ts` | Test build với verbose logging |
| `scripts/reset-package-status.ts` | Reset trạng thái build bị treo |
| `scripts/check-r2-full.ts` | Kiểm tra cấu trúc R2 (old/new/leaked) |
| `scripts/check-r2-structure.ts` | Kiểm tra cấu trúc R2 đơn giản |
| `scripts/migrate-r2-league-skins.ts` | Migration R2: fix leaked + nest chromas |
| `scripts/migrate-db-league-skins.ts` | Migration DB: update fileUrl + set chroma |

---

## Key Files

| File | Mô tả |
|------|--------|
| `lib/league-skins-package.ts` | Core logic build full package (yazl + cache) |
| `lib/league-skins-manifest.ts` | Generate + upload manifest.json |
| `lib/r2.ts` | R2 helpers (upload, download, presigned URL, list) |
| `lib/r2.ts → getLeagueSkinR2Key()` | Generate R2 key cho skin file |
| `components/dashboard/league-skins/` | Dashboard UI components |
| `app/api/league-skins/` | Public API routes |
| `app/api/admin/league-skins/` | Admin API routes |
