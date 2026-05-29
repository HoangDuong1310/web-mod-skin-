#!/bin/bash
#
# deploy.sh — Kéo code mới nhất và áp dụng mọi cập nhật trên server, rồi restart.
#
# Dùng trên SERVER (Linux + PM2):
#   chmod +x deploy.sh        # chỉ cần chạy 1 lần để cấp quyền thực thi
#   ./deploy.sh
#
# Script sẽ tự dừng ngay khi có bước nào lỗi (set -e), tránh deploy nửa vời.

set -euo pipefail

# Chạy đúng tại thư mục chứa script này (phòng khi bạn gọi từ nơi khác).
cd "$(dirname "$0")"

echo "==> [1/6] Kéo code mới nhất từ git..."
# --ff-only: chỉ fast-forward, không tự tạo merge commit lạ trên server.
git pull --ff-only

echo "==> [2/6] Cài/cập nhật dependencies..."
npm install

echo "==> [3/6] Sinh lại Prisma Client (theo schema mới)..."
npx prisma generate

echo "==> [4/6] Áp dụng migration database..."
# migrate deploy = an toàn cho production: chỉ chạy các migration ĐÃ commit
# trong prisma/migrations, không hỏi tương tác, không bao giờ reset/xoá dữ liệu.
npx prisma migrate deploy

echo "==> [5/6] Build ứng dụng..."
npm run build

echo "==> [6/6] Restart PM2..."
pm2 restart ecosystem.config.js --update-env

echo ""
pm2 status
echo "✅ Deploy xong. Xem log: pm2 logs web-mod-skin"
