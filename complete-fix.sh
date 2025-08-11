#!/bin/bash

echo "🔧 Complete fix for YouTube VOB Opener"

cd /root/techassistant/YT

echo "🛑 Stopping current PM2 process..."
pm2 stop youtube-vob-opener || true
pm2 delete youtube-vob-opener || true

echo "🔨 Rebuilding server..."
npm run build:server

echo "🚀 Starting PM2 with correct port..."
pm2 start dist/server/node-build.mjs \
  --name "youtube-vob-opener" \
  --cwd "/root/techassistant/YT" \
  --env NODE_ENV=production \
  --env PORT=3008 \
  --max-memory-restart 1G \
  --time

echo "💾 Saving PM2 configuration..."
pm2 save

echo "🌐 Fixing Nginx configuration..."
sudo cp nginx-yt.techassistant.co.in.conf /etc/nginx/sites-available/yt.techassistant.co.in
sudo ln -sf /etc/nginx/sites-available/yt.techassistant.co.in /etc/nginx/sites-enabled/

echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid, reloading..."
    sudo systemctl reload nginx
else
    echo "❌ Nginx config has errors, please check"
    exit 1
fi

echo "⏱️ Waiting for app to fully start..."
sleep 5

echo "📊 Checking PM2 status..."
pm2 status

echo "📝 Checking recent logs..."
pm2 logs youtube-vob-opener --lines 15

echo ""
echo "🌍 Your app should be available at:"
echo "   http://yt.techassistant.co.in"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs youtube-vob-opener  # View logs"
echo "   pm2 monit                   # Monitor dashboard"
echo "   pm2 restart youtube-vob-opener # Restart if needed"
