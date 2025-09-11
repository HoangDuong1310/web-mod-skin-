#!/bin/bash

echo "🔄 Restarting application with optimized settings..."

# Build the application
echo "📦 Building application..."
npm run build

# Restart PM2 with increased memory and timeout
echo "🚀 Restarting PM2..."
pm2 restart ecosystem.config.js --update-env

# Show status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Application restarted successfully!"
echo "🔍 Monitor logs with: pm2 logs"
