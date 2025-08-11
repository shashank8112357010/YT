#!/bin/bash

# YouTube VOB Opener - Simple VPS Deployment
# Path: /root/techassistant/YT
# Domain: yt.techassistant.co.in
# Port: 3008

set -e

echo "🚀 Deploying YouTube VOB Opener to /root/techassistant/YT"

# Navigate to project directory
cd /root/techassistant/YT

echo "📦 Installing dependencies..."
npm ci --production

echo "🔨 Building application..."
npm run build

echo "⚙️ Setting up PM2..."
# Stop existing process if running
pm2 stop youtube-vob-opener || true
pm2 delete youtube-vob-opener || true

# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

echo "🌐 Setting up Nginx..."
# Copy nginx configuration
sudo cp nginx-yt.techassistant.co.in.conf /etc/nginx/sites-available/yt.techassistant.co.in

# Enable the site
sudo ln -sf /etc/nginx/sites-available/yt.techassistant.co.in /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo "✅ Deployment completed!"
echo "🌍 Your app is live at: http://yt.techassistant.co.in"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs: pm2 logs youtube-vob-opener"

echo ""
echo "🔧 Useful commands:"
echo "pm2 restart youtube-vob-opener  # Restart app"
echo "pm2 logs youtube-vob-opener     # View logs"
echo "pm2 status                      # Check status"
echo ""
echo "📋 To setup SSL certificate:"
echo "sudo certbot --nginx -d yt.techassistant.co.in"
