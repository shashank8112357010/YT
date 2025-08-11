#!/bin/bash

echo "🌐 Fixing Nginx configuration..."

cd /root/techassistant/YT

# Copy the fixed nginx config
sudo cp nginx-yt.techassistant.co.in.conf /etc/nginx/sites-available/yt.techassistant.co.in

# Enable the site
sudo ln -sf /etc/nginx/sites-available/yt.techassistant.co.in /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid, reloading..."
    sudo systemctl reload nginx
    echo "🎉 Nginx reloaded successfully!"
    echo ""
    echo "🌍 Your YouTube VOB Opener is now live at:"
    echo "   http://yt.techassistant.co.in"
    echo ""
    echo "📊 Check PM2 status: pm2 status"
    echo "📝 View logs: pm2 logs youtube-vob-opener"
else
    echo "❌ Nginx config still has errors"
    echo "📋 Manual commands to try:"
    echo "sudo nginx -t"
    echo "sudo systemctl status nginx"
fi
