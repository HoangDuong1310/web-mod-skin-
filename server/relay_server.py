#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Ainz Party Relay Server
WebSocket relay server for Party Mode - runs on your VPS.

Protocol:
  Client connects to: ws://your-vps:PORT/room?key=<room_key>
  Messages (JSON):
    join:  { "type": "join", "summoner_id": int, "summoner_name": str }
    skin:  { "type": "skin", "skin": { "champion_id": int, "skin_id": int, ... } }
    leave: { "type": "leave" }
    ping:  "ping"  -> server replies "pong"
  Server broadcasts:
    { "type": "members", "members": [ { "summoner_id", "summoner_name", "skin" }, ... ] }

Admin HTTP API (requires X-Admin-Key header):
  GET /admin/stats          -> { "rooms": int, "connections": int }
  GET /admin/rooms          -> [ { "key": str, "members": int, "created_at": str } ]
  GET /admin/rooms/<key>    -> { "key": str, "members": [ ... ] }

Usage:
  pip install websockets aiohttp
  python relay_server.py --port 8765 --http-port 8766 --admin-key YOUR_SECRET_KEY

Environment variables (override CLI args):
  RELAY_PORT        WebSocket port (default: 8765)
  RELAY_HTTP_PORT   HTTP admin API port (default: 8766)
  RELAY_ADMIN_KEY   Admin API key (required for admin endpoints)
  RELAY_MAX_MEMBERS Max members per room (default: 10)
"""

import asyncio
import json
import logging
import argparse
import os
import time
from datetime import datetime, timezone
from typing import Dict, Optional
import websockets
from websockets.server import WebSocketServerProtocol
from aiohttp import web

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config (env overrides CLI)
# ---------------------------------------------------------------------------
MAX_MEMBERS_PER_ROOM: int = int(os.environ.get("RELAY_MAX_MEMBERS", 10))
ADMIN_KEY: str = os.environ.get("RELAY_ADMIN_KEY", "")

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------
# rooms[room_key] = { ws: member_info }
rooms: Dict[str, Dict[WebSocketServerProtocol, dict]] = {}
# room_created_at[room_key] = unix timestamp
room_created_at: Dict[str, float] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_members(room_key: str) -> list:
    """Return serialisable member list for a room."""
    room = rooms.get(room_key, {})
    return [
        {
            "summoner_id": info["summoner_id"],
            "summoner_name": info.get("summoner_name", "Unknown"),
            "skin": info.get("skin"),
        }
        for ws, info in room.items()
        if info and info.get("summoner_id")
    ]


def active_connections(room_key: str) -> int:
    return len([ws for ws in rooms.get(room_key, {}) if ws.open])


async def broadcast_members(room_key: str):
    """Broadcast current member list to all clients in room."""
    room = rooms.get(room_key, {})
    if not room:
        return

    message = json.dumps({"type": "members", "members": get_members(room_key)})
    dead = set()
    for ws in list(room.keys()):
        try:
            await ws.send(message)
        except Exception:
            dead.add(ws)

    for ws in dead:
        room.pop(ws, None)


# ---------------------------------------------------------------------------
# WebSocket handlers
# ---------------------------------------------------------------------------

async def handle_client(ws: WebSocketServerProtocol, path: str):
    """Handle a single WebSocket client connection."""
    room_key: Optional[str] = None
    if "?" in path:
        query = path.split("?", 1)[1]
        for param in query.split("&"):
            if param.startswith("key="):
                room_key = param[4:]
                break

    if not room_key or len(room_key) < 8 or len(room_key) > 64:
        await ws.close(1008, "Invalid room key")
        return

    room = rooms.setdefault(room_key, {})
    if room_key not in room_created_at:
        room_created_at[room_key] = time.time()

    active = [w for w in room if w.open]
    if len(active) >= MAX_MEMBERS_PER_ROOM:
        await ws.close(1013, "Room is full")
        return

    room[ws] = {}
    log.info(f"[RELAY] Client joined room {room_key[:8]}... (total: {len(room)})")

    # Send current member list to new joiner immediately
    await ws.send(json.dumps({"type": "members", "members": get_members(room_key)}))

    try:
        async for message in ws:
            if message == "ping":
                await ws.send("pong")
                continue

            try:
                msg = json.loads(message)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")

            if msg_type == "join":
                summoner_id = msg.get("summoner_id")
                summoner_name = msg.get("summoner_name", "Unknown")
                if summoner_id:
                    room[ws] = {
                        "summoner_id": summoner_id,
                        "summoner_name": summoner_name,
                        "skin": None,
                    }
                    log.info(f"[RELAY] {summoner_name} ({summoner_id}) joined room {room_key[:8]}...")
                    await broadcast_members(room_key)

            elif msg_type == "skin":
                if room.get(ws):
                    room[ws]["skin"] = msg.get("skin")
                    await broadcast_members(room_key)

            elif msg_type == "leave":
                break

    except websockets.exceptions.ConnectionClosed:
        pass
    except Exception as e:
        log.debug(f"[RELAY] Client error: {e}")
    finally:
        room.pop(ws, None)
        if not room:
            rooms.pop(room_key, None)
            room_created_at.pop(room_key, None)
            log.info(f"[RELAY] Room {room_key[:8]}... closed (empty)")
        else:
            log.info(f"[RELAY] Client left room {room_key[:8]}... (remaining: {len(room)})")
            await broadcast_members(room_key)


async def health_check(ws: WebSocketServerProtocol, path: str):
    await ws.send(json.dumps({"status": "ok", "service": "ainz-party-relay"}))
    await ws.close()


async def ws_router(ws: WebSocketServerProtocol, path: str):
    if path in ("/", ""):
        await health_check(ws, path)
    elif path.startswith("/room"):
        await handle_client(ws, path)
    else:
        await ws.close(1008, "Unknown path")


# ---------------------------------------------------------------------------
# Admin HTTP API (aiohttp)
# ---------------------------------------------------------------------------

def require_admin_key(handler):
    """Middleware-style decorator that checks X-Admin-Key header."""
    async def wrapper(request: web.Request):
        if ADMIN_KEY:
            provided = request.headers.get("X-Admin-Key", "")
            if provided != ADMIN_KEY:
                return web.json_response({"error": "Unauthorized"}, status=401)
        return await handler(request)
    return wrapper


@require_admin_key
async def admin_stats(request: web.Request) -> web.Response:
    """GET /admin/stats — total rooms and connections."""
    total_connections = sum(len(r) for r in rooms.values())
    return web.json_response({
        "rooms": len(rooms),
        "connections": total_connections,
        "max_members_per_room": MAX_MEMBERS_PER_ROOM,
    })


@require_admin_key
async def admin_rooms(request: web.Request) -> web.Response:
    """GET /admin/rooms — list all active rooms."""
    result = []
    for key, room in rooms.items():
        created = room_created_at.get(key, 0)
        result.append({
            "key": key,
            "members": len([ws for ws in room if ws.open]),
            "created_at": datetime.fromtimestamp(created, tz=timezone.utc).isoformat(),
        })
    return web.json_response(result)


@require_admin_key
async def admin_room_detail(request: web.Request) -> web.Response:
    """GET /admin/rooms/{key} — detail of a specific room."""
    key = request.match_info["key"]
    if key not in rooms:
        return web.json_response({"error": "Room not found"}, status=404)

    created = room_created_at.get(key, 0)
    return web.json_response({
        "key": key,
        "members": get_members(key),
        "created_at": datetime.fromtimestamp(created, tz=timezone.utc).isoformat(),
    })


def build_http_app() -> web.Application:
    app = web.Application()
    app.router.add_get("/admin/stats", admin_stats)
    app.router.add_get("/admin/rooms", admin_rooms)
    app.router.add_get("/admin/rooms/{key}", admin_room_detail)
    app.router.add_get("/health", lambda r: web.json_response({"status": "ok"}))
    return app


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main(ws_host: str, ws_port: int, http_host: str, http_port: int):
    log.info(f"[RELAY] Ainz Party Relay Server starting")
    log.info(f"[RELAY] WebSocket : ws://{ws_host}:{ws_port}")
    log.info(f"[RELAY] Admin HTTP: http://{http_host}:{http_port}/admin/stats")
    if not ADMIN_KEY:
        log.warning("[RELAY] RELAY_ADMIN_KEY not set — admin endpoints are unprotected!")

    # Start HTTP admin server
    http_app = build_http_app()
    runner = web.AppRunner(http_app)
    await runner.setup()
    site = web.TCPSite(runner, http_host, http_port)
    await site.start()

    # Start WebSocket server
    async with websockets.serve(ws_router, ws_host, ws_port, ping_interval=None):
        log.info("[RELAY] Server ready!")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ainz Party Relay Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=int(os.environ.get("RELAY_PORT", 8765)),
                        help="WebSocket port (default: 8765)")
    parser.add_argument("--http-host", default="0.0.0.0", help="HTTP admin host (default: 0.0.0.0)")
    parser.add_argument("--http-port", type=int, default=int(os.environ.get("RELAY_HTTP_PORT", 8766)),
                        help="HTTP admin port (default: 8766)")
    parser.add_argument("--admin-key", default=ADMIN_KEY,
                        help="Admin API key (overrides RELAY_ADMIN_KEY env var)")
    args = parser.parse_args()

    # Allow CLI to override env
    if args.admin_key:
        ADMIN_KEY = args.admin_key

    asyncio.run(main(args.host, args.port, args.http_host, args.http_port))
