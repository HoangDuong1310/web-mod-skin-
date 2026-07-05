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

echo "==> [4/6] Đồng bộ schema vào database..."
# Dự án này quản lý DB bằng `db push` (lịch sử migration đã lệch — bảng
# league_skins được tạo ngoài migration), nên KHÔNG dùng `migrate deploy`.
# `db push` đồng bộ thẳng schema.prisma vào DB, không cần file migration.
# --accept-data-loss: cần vì Prisma cảnh báo khi thêm unique index (bankTxId).
#   Cột bankTxId là cột MỚI, mọi dòng cũ đều NULL, MySQL cho phép nhiều NULL
#   trong unique index nên KHÔNG mất dữ liệu. LƯU Ý: mỗi lần deploy về sau,
#   nếu bạn đổi schema theo kiểu xoá/đổi cột thì hãy đọc kỹ cảnh báo trước.
npx prisma db push --accept-data-loss

echo "==> [5/6] Build ứng dụng..."
npm run build

echo "==> [6/6] Restart PM2..."
pm2 restart ecosystem.config.js --update-env

echo ""
pm2 status
echo "✅ Deploy xong. Xem log: pm2 logs web-mod-skin"
