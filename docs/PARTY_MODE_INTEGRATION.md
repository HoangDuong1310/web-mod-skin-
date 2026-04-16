# Party Mode Integration - Documentation

## Tổng quan

Tích hợp hệ thống **Party Mode** vào admin dashboard Next.js, cho phép admin monitoring và quản lý các phòng Party Mode realtime từ ứng dụng Ainz (mod skin League of Legends).

## Kiến trúc hệ thống

```
┌─────────────────┐     WebSocket (8765)     ┌──────────────────┐
│  Ainz Desktop    │ ◄──────────────────────► │  Relay Server    │
│  (Python App)    │                          │  (Python/VPS)    │
└─────────────────┘                          └──────┬───────────┘
                                                     │ HTTP (8766)
                                                     │
┌─────────────────┐     API Proxy            ┌──────┴───────────┐
│  Admin Browser   │ ◄──────────────────────► │  Next.js App     │
│  (Dashboard)     │     /api/party/*         │  (PM2)           │
└─────────────────┘                          └──────────────────┘
```

## Files đã tạo/sửa

### Relay Server (Python - chạy trên VPS)

| File | Mô tả |
|------|--------|
| `server/relay_server.py` | WebSocket relay server + HTTP admin API |

**Tính năng:**
- WebSocket server (port 8765): xử lý kết nối Party Mode từ Ainz desktop
- HTTP admin API (port 8766): cung cấp endpoints cho admin dashboard
- Authentication qua header `X-Admin-Key`
- Max 10 members/room (configurable)
- Room tự xóa khi không còn ai

### Next.js API Proxy Routes

| File | Route | Mô tả |
|------|-------|--------|
| `app/api/party/stats/route.ts` | `GET /api/party/stats` | Proxy tới `/admin/stats` |
| `app/api/party/rooms/route.ts` | `GET /api/party/rooms` | Proxy tới `/admin/rooms` |
| `app/api/party/rooms/[key]/route.ts` | `GET /api/party/rooms/:key` | Proxy tới `/admin/rooms/:key` |

Tất cả routes đều yêu cầu authentication (NextAuth session + dashboard access).

### React Components

| File | Component | Mô tả |
|------|-----------|--------|
| `components/dashboard/party-widget.tsx` | `PartyWidget` | Widget nhỏ trên dashboard chính, hiển thị status/rooms/connections |
| `components/dashboard/party-monitor-client.tsx` | `PartyMonitorClient` | Trang monitoring đầy đủ với bảng rooms, dialog chi tiết |
| `components/dashboard/party-settings-tab.tsx` | `PartySettingsTab` | Tab settings hiển thị config và status relay server |

### Pages

| File | URL | Mô tả |
|------|-----|--------|
| `app/(app)/dashboard/party/page.tsx` | `/dashboard/party` | Trang Party Mode Monitor |
| `app/(app)/dashboard/settings/party/page.tsx` | `/dashboard/settings/party` | Trang Party Mode Settings riêng |

### Files đã cập nhật

| File | Thay đổi |
|------|----------|
| `components/dashboard/dashboard-client.tsx` | Thêm `PartyWidget` vào dashboard chính |
| `components/shared/app-sidebar.tsx` | Thêm nav item "Party Mode" với icon Radio |
| `app/(app)/dashboard/settings/page.tsx` | Thêm tab "Party" vào trang Settings |
| `.env.example` | Thêm 3 env vars cho Party Mode |

### File đã xóa

| File | Lý do |
|------|-------|
| `relay_server.py` (root) | Di chuyển vào `server/relay_server.py` |

## Relay Server Admin API

### Endpoints

| Method | Path | Response |
|--------|------|----------|
| `GET` | `/health` | `{"status": "ok"}` |
| `GET` | `/admin/stats` | `{"rooms": int, "connections": int, "max_members_per_room": int}` |
| `GET` | `/admin/rooms` | `[{"key": str, "members": int, "created_at": str}]` |
| `GET` | `/admin/rooms/{key}` | `{"key": str, "members": [...], "created_at": str}` |

### Authentication

Tất cả `/admin/*` endpoints yêu cầu header:
```
X-Admin-Key: <RELAY_ADMIN_KEY>
```

## Environment Variables

### Next.js App (`.env`)

```env
# URL HTTP admin API của relay server
AINZ_RELAY_ADMIN_URL="http://14.225.206.162:8766"

# Admin key (phải giống với RELAY_ADMIN_KEY trên VPS)
AINZ_RELAY_ADMIN_KEY="bd027cd2a32b8e36b8e11b79b797931110ce5531f2a1a7eee05f93dbbef8992f"

# WebSocket URL cho client (public)
NEXT_PUBLIC_AINZ_RELAY_WS_URL="ws://14.225.206.162:8765"
```

### Relay Server (VPS)

```env
RELAY_PORT=8765          # WebSocket port (default: 8765)
RELAY_HTTP_PORT=8766     # HTTP admin port (default: 8766)
RELAY_ADMIN_KEY=...      # Admin API key
RELAY_MAX_MEMBERS=10     # Max members per room (default: 10)
```

## Deployment

### Relay Server (trên VPS)

```bash
# Install dependencies
pip3 install websockets aiohttp

# Chạy với PM2
RELAY_ADMIN_KEY="your-key" pm2 start server/relay_server.py \
  --name "ainz-relay" \
  --interpreter python3 \
  -- --port 8765 --http-port 8766

# Mở firewall
ufw allow 8765
ufw allow 8766

# Lưu PM2 config
pm2 save
```

### Next.js App

```bash
# Thêm env vars vào .env
# Build lại
pnpm build

# Restart
pm2 restart web-mod-skin
```

## Thông tin VPS hiện tại

- **IP**: `14.225.206.162`
- **WebSocket**: `ws://14.225.206.162:8765`
- **HTTP Admin**: `http://14.225.206.162:8766`
- **PM2 Process**: `ainz-relay` (pid: 1819939)
- **Admin Key**: `bd027cd2a32b8e36b8e11b79b797931110ce5531f2a1a7eee05f93dbbef8992f`

## Test Results (2026-04-15)

```
✅ GET /health              → {"status": "ok"}
✅ GET /admin/stats          → {"rooms": 0, "connections": 0, "max_members_per_room": 10}
✅ GET /admin/rooms          → []
```

## WebSocket Protocol (cho Ainz Desktop)

**Kết nối**: `ws://14.225.206.162:8765/room?key=<room_key>`

**Client → Server:**
```json
{"type": "join", "summoner_id": 12345, "summoner_name": "Player1"}
{"type": "skin", "skin": {"champion_id": 84, "skin_id": 84002, "chroma_id": null}}
{"type": "leave"}
"ping"
```

**Server → Client:**
```json
{"type": "members", "members": [{"summoner_id": 12345, "summoner_name": "Player1", "skin": {...}}]}
"pong"
```

**Giới hạn:**
- Max 10 người/room
- Room key: 8-64 ký tự
- Room tự xóa khi trống
- Keepalive: ping mỗi 25 giây
