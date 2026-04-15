# Prompt: Tích hợp Party Mode vào Admin Dashboard Next.js

## Context

Tôi có ứng dụng desktop **Ainz** (Python) dùng để mod skin League of Legends. Ứng dụng có tính năng **Party Mode** cho phép người chơi chia sẻ skin với bạn bè qua WebSocket relay server.

Tôi cần tích hợp trang quản lý/monitoring Party Mode vào **admin dashboard Next.js** hiện có.

## Relay Server

Party Mode dùng WebSocket relay server chạy trên VPS:
- **URL**: `ws://YOUR_VPS_IP:8765`
- **Protocol**: WebSocket JSON
- Server code: `relay_server.py` (Python, dùng thư viện `websockets`)

### Relay Protocol

**Kết nối**: `ws://VPS_IP:8765/room?key=<room_key>`

**Client → Server messages:**
```json
// Join room
{"type": "join", "summoner_id": 12345, "summoner_name": "Player1"}

// Update skin selection
{"type": "skin", "skin": {"champion_id": 84, "skin_id": 84002, "chroma_id": null}}

// Leave room
{"type": "leave"}

// Keepalive (plain text, not JSON)
"ping"
```

**Server → Client messages:**
```json
// Members list (broadcast khi có thay đổi)
{
  "type": "members",
  "members": [
    {
      "summoner_id": 12345,
      "summoner_name": "Player1",
      "skin": {"champion_id": 84, "skin_id": 84002, "chroma_id": null}
    }
  ]
}

// Keepalive response (plain text)
"pong"
```

### Giới hạn
- Max 10 người/room
- Room tự xóa khi không còn ai
- Keepalive ping mỗi 25 giây

## Token Format

Người dùng chia sẻ token dạng: `AINZ:eNoBLQDS_wJp32Nr...`

Cấu trúc (base64url → zlib decompress → binary):
- Byte 0: Version (1 byte, hiện tại = 2)
- Bytes 1-4: Timestamp (uint32 big-endian, Unix timestamp)
- Bytes 5-12: Summoner ID (uint64 big-endian)
- Bytes 13-44: Encryption Key (32 bytes random)

Token hết hạn sau 3600 giây (1 giờ).

Room key = SHA256(str(summoner_id) + encryption_key).substring(0, 32)

## Yêu cầu tích hợp vào Admin Dashboard

### 1. Trang Party Mode Monitor (`/admin/party`)

Hiển thị:
- Tổng số rooms đang active
- Tổng số connections đang active
- Danh sách rooms với số members mỗi room
- Có thể click vào room để xem chi tiết members

**Cần thêm API endpoint vào relay server** để admin có thể query:
- `GET /admin/stats` → `{"rooms": 5, "connections": 12}`
- `GET /admin/rooms` → `[{"key": "abc123...", "members": 3, "created_at": "..."}]`
- `GET /admin/rooms/:key` → `{"key": "abc123...", "members": [{"summoner_id": 12345, "summoner_name": "Player1", "skin": {...}}]}`

### 2. Trang Party Mode Settings (`/admin/settings/party`)

- Bật/tắt Party Mode globally
- Cấu hình max members per room
- Cấu hình relay server URL
- Hiển thị relay server status (online/offline)

### 3. Dashboard Widget

Widget nhỏ trên trang dashboard chính hiển thị:
- Party Mode status (online/offline)
- Số rooms active
- Số connections active

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Relay Server**: Python WebSocket server (`relay_server.py`)
- **Database**: (nếu cần lưu stats) — dùng database hiện có của admin dashboard

## Cần làm

1. **Mở rộng `relay_server.py`**: Thêm HTTP endpoints cho admin API (`/admin/stats`, `/admin/rooms`, `/admin/rooms/:key`). Dùng thêm `aiohttp` hoặc tích hợp HTTP handler vào websockets server.

2. **Next.js API Routes**: Tạo proxy routes để frontend gọi relay server admin API (tránh CORS):
   - `GET /api/party/stats` → proxy tới relay server `/admin/stats`
   - `GET /api/party/rooms` → proxy tới relay server `/admin/rooms`

3. **React Components**:
   - `PartyMonitor` — trang monitoring realtime
   - `PartySettings` — trang cấu hình
   - `PartyWidget` — widget cho dashboard

4. **WebSocket hook** (optional): `usePartyRelay()` hook để kết nối realtime tới relay server từ admin dashboard, hiển thị live updates.

## Lưu ý

- Admin API endpoints cần authentication (API key hoặc JWT)
- Relay server URL được cấu hình trong environment variable `AINZ_RELAY_URL`
- Không cần tích hợp logic injection/skin — chỉ monitoring và management
- Giữ UI consistent với design hiện tại của admin dashboard
