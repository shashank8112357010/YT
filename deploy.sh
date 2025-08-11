#!/bin/bash

# YouTube VOB Opener - Deployment Script
# Domain: yt.techassistant.co.in
# Port: 3008

set -e

echo "🚀 Starting deployment for YouTube VOB Opener..."

# Configuration
APP_NAME="youtube-vob-opener"
DOMAIN="yt.techassistant.co.in"
PORT=3008
VPS_PATH="/root/techassistant/YT"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📂 Setting up directory structure...${NC}"
sudo mkdir -p $VPS_PATH
sudo mkdir -p /var/log/pm2

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd $VPS_PATH
npm ci --production

echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

echo -e "${YELLOW}⚙️  Setting up PM2...${NC}"
# Stop existing process if running
pm2 stop $APP_NAME || true
pm2 delete $APP_NAME || true

# Start with ecosystem file
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

echo -e "${YELLOW}🌐 Setting up Nginx...${NC}"
# Copy nginx configuration
sudo cp nginx-$DOMAIN.conf $NGINX_CONF

# Enable the site
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

echo -e "${YELLOW}🔧 Setting up SSL (optional)...${NC}"
echo "To set up SSL certificate, run:"
echo "sudo certbot --nginx -d $DOMAIN"

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌍 Your app is now available at: http://$DOMAIN${NC}"
echo -e "${GREEN}🔧 PM2 process: $APP_NAME${NC}"
echo -e "${GREEN}📊 Monitor with: pm2 monit${NC}"
echo -e "${GREEN}📝 Logs: pm2 logs $APP_NAME${NC}"

echo -e "${YELLOW}📋 Useful PM2 Commands:${NC}"
echo "pm2 restart $APP_NAME    # Restart the app"
echo "pm2 stop $APP_NAME       # Stop the app"
echo "pm2 logs $APP_NAME       # View logs"
echo "pm2 monit               # Monitor all processes"
echo "pm2 status              # Check status"
