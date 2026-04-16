# Real-Time User Tracking Integration - Documentation

## Tổng quan

Tích hợp hệ thống **Real-Time User Tracking** vào admin dashboard Next.js hiện tại, cho phép admin theo dõi realtime ai đang sử dụng Ainz, đang ở phase nào, dùng skin gì.

**Nguyên tắc**: Không tạo hệ thống mới — mở rộng heartbeat API đã có (`/api/license/heartbeat`) để gửi thêm status data. Dashboard query database để hiển thị.

## Kiến trúc

```
┌─────────────────┐     POST /api/license/heartbeat    ┌──────────────────┐
│  Ainz Desktop    │ ──────────────────────────────────► │  Next.js API     │
│  (Python App)    │     (mỗi 150s, thêm status field)  │  (đã có)         │
└─────────────────┘                                     └──────┬───────────┘
                                                               │ UPSERT
                                                        ┌──────┴───────────┐
                                                        │  Database        │
                                                        │  (đã có)         │
                                                        └──────┬───────────┘
                                                               │ Query
┌─────────────────┐     GET /api/admin/live-users       ┌──────┴───────────┐
│  Admin Browser   │ ◄──────────────────────────────────│  Next.js App     │
│  (Dashboard)     │     (polling mỗi 10s)              │  (đã có)         │
└─────────────────┘                                     └──────────────────┘
```

## Thay đổi phía Ainz Desktop (đã implement)

Heartbeat payload được mở rộng thêm field `status`:

### Payload hiện tại (không thay đổi)
```json
{
  "key": "WZWA-KXKX-...",
  "hwid": "82ce1f7a..."
}
```

### Payload mới (thêm field `status`)
```json
{
  "key": "WZWA-KXKX-...",
  "hwid": "82ce1f7a...",
  "status": {
    "app_version": "1.0.2",
    "phase": "ChampSelect",
    "game_mode": "CLASSIC",
    "champion": "Ahri",
    "champion_id": 103,
    "skin": "Ahri Vệ Binh Tinh Tú",
    "skin_id": 103015,
    "summoner_name": "Player123",
    "region": "VN2",
    "party_mode": false,
    "uptime_minutes": 45,
    "injection_count": 3,
    "last_injection_skin": "Ahri Vệ Binh Tinh Tú"
  }
}
```

**Backward compatible**: Nếu `status` field không có (client cũ), server xử lý bình thường như trước.

### Mô tả các trường `status`

| Trường | Kiểu | Nullable | Mô tả |
|--------|------|----------|--------|
| `app_version` | string | No | Phiên bản Ainz (e.g. "1.0.2") |
| `phase` | string | Yes | Phase hiện tại: `null`, `"Lobby"`, `"ChampSelect"`, `"InProgress"`, `"EndOfGame"` |
| `game_mode` | string | Yes | `"CLASSIC"`, `"ARAM"`, `"PRACTICETOOL"`, `"SWIFTPLAY"`, `"CHERRY"` |
| `champion` | string | Yes | Tên champion đang chơi (e.g. "Ahri") |
| `champion_id` | int | Yes | ID champion (e.g. 103) |
| `skin` | string | Yes | Tên skin đang dùng (localized) |
| `skin_id` | int | Yes | ID skin (e.g. 103015) |
| `summoner_name` | string | Yes | Tên summoner từ League client |
| `region` | string | Yes | Server region (e.g. "VN2", "NA1") |
| `party_mode` | bool | No | Party mode đang bật hay không |
| `uptime_minutes` | int | No | Thời gian app đã chạy (phút) |
| `injection_count` | int | No | Số lần inject skin trong session hiện tại |
| `last_injection_skin` | string | Yes | Tên skin inject gần nhất |

### Giá trị `phase` có thể có

| Phase | Ý nghĩa | User đang làm gì |
|-------|---------|-------------------|
| `null` | Idle | App chạy nhưng không trong game |
| `"Lobby"` | Trong sảnh | Đang ở lobby, chưa tìm trận |
| `"Matchmaking"` | Tìm trận | Đang queue |
| `"ReadyCheck"` | Tìm thấy trận | Đang accept/decline |
| `"ChampSelect"` | Chọn tướng | Đang pick champion và skin |
| `"FINALIZATION"` | Khóa tướng | Countdown trước khi vào game |
| `"GameStart"` | Game bắt đầu | Loading screen |
| `"InProgress"` | Trong game | Đang chơi |
| `"WaitingForStats"` | Kết thúc | Đợi stats |
| `"EndOfGame"` | Kết thúc | Màn hình kết quả |

## Thay đổi phía Server (Next.js API)

### 1. Mở rộng heartbeat handler

**File cần sửa**: Handler của `POST /api/license/heartbeat`

Khi nhận heartbeat, nếu có field `status`, UPSERT vào bảng `active_sessions`:

```typescript
// Trong heartbeat handler hiện tại, thêm sau khi validate key/hwid thành công:

if (body.status) {
  await db.activeSession.upsert({
    where: { licenseKey_hwid: { licenseKey: body.key, hwid: body.hwid } },
    create: {
      licenseKey: body.key,
      hwid: body.hwid,
      ...body.status,
      sessionStart: new Date(),
      lastHeartbeat: new Date(),
    },
    update: {
      ...body.status,
      lastHeartbeat: new Date(),
    },
  });
}
```

### 2. Tạo bảng `active_sessions`

**Prisma schema** (thêm vào `schema.prisma`):

```prisma
model ActiveSession {
  id              Int       @id @default(autoincrement())
  licenseKey      String    @map("license_key")
  hwid            String
  
  // Status data from client
  appVersion      String?   @map("app_version")
  phase           String?
  gameMode        String?   @map("game_mode")
  champion        String?
  championId      Int?      @map("champion_id")
  skin            String?
  skinId          Int?      @map("skin_id")
  summonerName    String?   @map("summoner_name")
  region          String?
  partyMode       Boolean   @default(false) @map("party_mode")
  uptimeMinutes   Int       @default(0) @map("uptime_minutes")
  injectionCount  Int       @default(0) @map("injection_count")
  lastInjectionSkin String? @map("last_injection_skin")
  
  // Timestamps
  sessionStart    DateTime  @default(now()) @map("session_start")
  lastHeartbeat   DateTime  @default(now()) @map("last_heartbeat")
  
  @@unique([licenseKey, hwid])
  @@index([lastHeartbeat])
  @@map("active_sessions")
}
```

Chạy migration:
```bash
npx prisma migrate dev --name add-active-sessions
```

### 3. Tạo API endpoints cho dashboard

#### GET /api/admin/live-users

**File mới**: `app/api/admin/live-users/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

export async function GET() {
  // Auth check (reuse existing admin auth)
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Users with heartbeat in last 5 minutes are "online"
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const users = await db.activeSession.findMany({
    where: { lastHeartbeat: { gte: fiveMinutesAgo } },
    orderBy: { lastHeartbeat: "desc" },
  });

  // Mask sensitive data
  const masked = users.map((u) => ({
    ...u,
    licenseKey: u.licenseKey.substring(0, 9) + "****",
    hwid: u.hwid.substring(0, 8) + "****",
  }));

  return NextResponse.json({
    total: masked.length,
    users: masked,
  });
}
```

#### GET /api/admin/live-stats

**File mới**: `app/api/admin/live-stats/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const users = await db.activeSession.findMany({
    where: { lastHeartbeat: { gte: fiveMinutesAgo } },
  });

  // Aggregate stats
  const byPhase: Record<string, number> = {};
  const byGameMode: Record<string, number> = {};
  const byRegion: Record<string, number> = {};
  const byVersion: Record<string, number> = {};
  const championCounts: Record<string, number> = {};
  const skinCounts: Record<string, number> = {};
  let inGameCount = 0;
  let inLobbyCount = 0;

  for (const u of users) {
    // By phase
    const phase = u.phase || "Idle";
    byPhase[phase] = (byPhase[phase] || 0) + 1;

    if (phase === "InProgress") inGameCount++;
    if (phase === "Lobby") inLobbyCount++;

    // By game mode
    if (u.gameMode) {
      byGameMode[u.gameMode] = (byGameMode[u.gameMode] || 0) + 1;
    }

    // By region
    if (u.region) {
      byRegion[u.region] = (byRegion[u.region] || 0) + 1;
    }

    // By version
    if (u.appVersion) {
      byVersion[u.appVersion] = (byVersion[u.appVersion] || 0) + 1;
    }

    // Champions
    if (u.champion) {
      championCounts[u.champion] = (championCounts[u.champion] || 0) + 1;
    }

    // Skins
    if (u.skin) {
      skinCounts[u.skin] = (skinCounts[u.skin] || 0) + 1;
    }
  }

  // Sort top champions/skins
  const topChampions = Object.entries(championCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const topSkins = Object.entries(skinCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  return NextResponse.json({
    onlineCount: users.length,
    inGameCount,
    inLobbyCount,
    idleCount: users.length - inGameCount - inLobbyCount,
    byPhase,
    byGameMode,
    byRegion,
    byVersion,
    topChampions,
    topSkins,
    totalInjections: users.reduce((sum, u) => sum + u.injectionCount, 0),
  });
}
```

### 4. Cleanup cron job

Sessions không có heartbeat > 5 phút cần được xóa hoặc move sang history.

**Option A**: Cron job (nếu dùng Vercel Cron hoặc PM2 cron)

```typescript
// app/api/cron/cleanup-sessions/route.ts
export async function GET() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  // Get expired sessions before deleting (for history)
  const expired = await db.activeSession.findMany({
    where: { lastHeartbeat: { lt: fiveMinutesAgo } },
  });
  
  // Move to session_history (optional)
  if (expired.length > 0) {
    await db.sessionHistory.createMany({
      data: expired.map((s) => ({
        licenseKey: s.licenseKey,
        hwid: s.hwid,
        summonerName: s.summonerName,
        region: s.region,
        sessionStart: s.sessionStart,
        sessionEnd: s.lastHeartbeat,
        durationMinutes: s.uptimeMinutes,
        injectionCount: s.injectionCount,
        appVersion: s.appVersion,
      })),
    });
  }
  
  // Delete expired
  const deleted = await db.activeSession.deleteMany({
    where: { lastHeartbeat: { lt: fiveMinutesAgo } },
  });
  
  return NextResponse.json({ cleaned: deleted.count });
}
```

**Option B**: Không cần cron — chỉ filter bằng `WHERE last_heartbeat > NOW() - 5min` khi query. Sessions cũ tự "biến mất" khỏi kết quả.

## React Components cho Dashboard

### LiveUsersWidget (widget nhỏ trên dashboard chính)

**File mới**: `components/dashboard/live-users-widget.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Clock } from "lucide-react";

interface LiveStats {
  onlineCount: number;
  inGameCount: number;
  inLobbyCount: number;
  idleCount: number;
}

export function LiveUsersWidget() {
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/live-stats");
        if (res.ok) setStats(await res.json());
      } catch {}
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Poll mỗi 10s
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Online</CardTitle>
          <Users className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.onlineCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">In Game</CardTitle>
          <Gamepad2 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.inGameCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Idle</CardTitle>
          <Clock className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.idleCount}</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### LiveUsersTable (bảng chi tiết)

**File mới**: `components/dashboard/live-users-table.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface LiveUser {
  licenseKey: string;
  summonerName: string | null;
  region: string | null;
  phase: string | null;
  gameMode: string | null;
  champion: string | null;
  skin: string | null;
  appVersion: string | null;
  uptimeMinutes: number;
  injectionCount: number;
  lastHeartbeat: string;
}

const phaseBadgeColor: Record<string, string> = {
  InProgress: "bg-green-500",
  ChampSelect: "bg-blue-500",
  Lobby: "bg-yellow-500",
  Idle: "bg-gray-400",
};

export function LiveUsersTable() {
  const [users, setUsers] = useState<LiveUser[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/live-users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        }
      } catch {}
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = users.filter(
    (u) =>
      !search ||
      (u.summonerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.licenseKey || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.champion || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.skin || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name, key, champion, skin..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Summoner</TableHead>
            <TableHead>Region</TableHead>
            <TableHead>Phase</TableHead>
            <TableHead>Champion</TableHead>
            <TableHead>Skin</TableHead>
            <TableHead>Version</TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Injections</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u, i) => (
            <TableRow key={i}>
              <TableCell className="font-medium">
                {u.summonerName || u.licenseKey}
              </TableCell>
              <TableCell>{u.region || "-"}</TableCell>
              <TableCell>
                <Badge
                  className={
                    phaseBadgeColor[u.phase || "Idle"] || "bg-gray-400"
                  }
                >
                  {u.phase || "Idle"}
                </Badge>
              </TableCell>
              <TableCell>{u.champion || "-"}</TableCell>
              <TableCell className="max-w-[200px] truncate">
                {u.skin || "-"}
              </TableCell>
              <TableCell>{u.appVersion || "-"}</TableCell>
              <TableCell>{u.uptimeMinutes}m</TableCell>
              <TableCell>{u.injectionCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## Tích hợp vào Dashboard hiện tại

### 1. Thêm widget vào dashboard chính

**File sửa**: `components/dashboard/dashboard-client.tsx`

```tsx
// Import thêm
import { LiveUsersWidget } from "./live-users-widget";

// Thêm vào JSX (sau các widget hiện tại)
<LiveUsersWidget />
```

### 2. Tạo trang Live Users

**File mới**: `app/(app)/dashboard/live-users/page.tsx`

```tsx
import { LiveUsersWidget } from "@/components/dashboard/live-users-widget";
import { LiveUsersTable } from "@/components/dashboard/live-users-table";

export default function LiveUsersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Live Users</h1>
      <LiveUsersWidget />
      <LiveUsersTable />
    </div>
  );
}
```

### 3. Thêm nav item vào sidebar

**File sửa**: `components/shared/app-sidebar.tsx`

```tsx
// Thêm import
import { Activity } from "lucide-react";

// Thêm vào nav items array
{ title: "Live Users", url: "/dashboard/live-users", icon: Activity }
```

## Environment Variables

Không cần thêm env vars mới — tất cả dùng database và auth hiện tại.

## Checklist tích hợp

### Server (Next.js)
- [ ] Thêm model `ActiveSession` vào Prisma schema
- [ ] Chạy `npx prisma migrate dev`
- [ ] Sửa heartbeat handler: UPSERT `active_sessions` khi có `status` field
- [ ] Tạo `GET /api/admin/live-users`
- [ ] Tạo `GET /api/admin/live-stats`
- [ ] (Optional) Tạo cleanup cron hoặc dùng WHERE filter

### Frontend (Next.js)
- [ ] Tạo `LiveUsersWidget` component
- [ ] Tạo `LiveUsersTable` component
- [ ] Tạo trang `/dashboard/live-users`
- [ ] Thêm widget vào dashboard chính
- [ ] Thêm nav item vào sidebar

### Client (Ainz App) — sẽ implement riêng
- [ ] Mở rộng heartbeat payload với `status` field
- [ ] Thêm `injection_count` vào SharedState
- [ ] Thêm `summoner_name` tracking
