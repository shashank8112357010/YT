#!/bin/bash

# Direct PM2 start without ecosystem file
echo "🚀 Starting YouTube VOB Opener with direct PM2 command..."

cd /root/techassistant/YT

# Stop any existing process
pm2 stop youtube-vob-opener || true
pm2 delete youtube-vob-opener || true

# Start directly with all parameters
pm2 start dist/server/node-build.mjs \
  --name "youtube-vob-opener" \
  --cwd "/root/techassistant/YT" \
  --env NODE_ENV=production \
  --env PORT=3008 \
  --max-memory-restart 1G \
  --time

# Save PM2 configuration
pm2 save

echo "✅ YouTube VOB Opener started successfully!"
echo "📊 Status: pm2 status"
echo "📝 Logs: pm2 logs youtube-vob-opener"
echo "🔄 Restart: pm2 restart youtube-vob-opener"
echo "🌍 URL: http://yt.techassistant.co.in"
