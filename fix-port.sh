#!/bin/bash

echo "🔧 Fixing port issue - ensuring app runs on port 3008"

cd /root/techassistant/YT

echo "🛑 Stopping current process..."
pm2 stop youtube-vob-opener
pm2 delete youtube-vob-opener

echo "🚀 Starting with explicit port 3008..."
PORT=3008 pm2 start dist/server/node-build.mjs \
  --name "youtube-vob-opener" \
  --cwd "/root/techassistant/YT" \
  --env NODE_ENV=production \
  --env PORT=3008 \
  --max-memory-restart 1G \
  --time

echo "💾 Saving PM2 configuration..."
pm2 save

echo "⏱️ Waiting for app to start..."
sleep 3

echo "📊 Checking PM2 status..."
pm2 status

echo "📝 Checking logs for port confirmation..."
pm2 logs youtube-vob-opener --lines 10

echo ""
echo "🔍 Testing port 3008..."
curl -s http://localhost:3008 | head -5 || echo "Port 3008 not responding yet"

echo ""
echo "🔍 Testing port 3000..."
curl -s http://localhost:3000 | head -5 || echo "Port 3000 not responding (good!)"

echo ""
echo "✅ If you see 'port 3008' in the logs above, it's working correctly!"
echo "🌍 Your app should be at: http://yt.techassistant.co.in"
