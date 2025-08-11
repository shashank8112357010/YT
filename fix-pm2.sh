#!/bin/bash

# Quick fix for PM2 ES module issue
echo "🔧 Fixing PM2 ES module compatibility..."

cd /root/techassistant/YT

echo "⚙️ Starting PM2 with correct config..."

# Stop any existing process
pm2 stop youtube-vob-opener || true
pm2 delete youtube-vob-opener || true

# Start with the .cjs config file
pm2 start ecosystem.config.cjs --env production

# Save PM2 configuration
pm2 save

echo "✅ PM2 started successfully!"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs youtube-vob-opener"
echo "🌍 App should be accessible at: http://yt.techassistant.co.in"
