#!/bin/bash

# Fix and restart YouTube VOB Opener
echo "🔧 Fixing path issue and restarting app..."

cd /root/techassistant/YT

echo "🔨 Rebuilding server with path fix..."
npm run build:server

echo "🔄 Restarting PM2 process..."
pm2 restart youtube-vob-opener

echo "⏱️  Waiting for app to start..."
sleep 3

echo "📊 Checking status..."
pm2 status

echo "📝 Recent logs:"
pm2 logs youtube-vob-opener --lines 10

echo ""
echo "✅ Update complete!"
echo "🌍 Check your app at: http://yt.techassistant.co.in"
echo "📋 Monitor with: pm2 monit"
