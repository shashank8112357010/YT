# 🚀 VPS Deployment Guide for YouTube VOB Opener

## Domain: yt.techassistant.co.in | Port: 3008

### Prerequisites on VPS:
1. Node.js (v18+)
2. PM2 (`npm install -g pm2`)
3. Nginx
4. Git

### Quick Deployment Steps:

#### 1. Upload files to VPS
```bash
# On your VPS, create directory
sudo mkdir -p /root/techassistant/YT
cd /root/techassistant/YT

# Upload your project files here (via git, scp, or FTP)
```

#### 2. Install dependencies and build
```bash
cd /root/techassistant/YT
npm ci --production
npm run build
```

#### 3. Start with PM2
```bash
# Using ecosystem file (recommended)
pm2 start ecosystem.config.js --env production

# Or manual start
pm2 start dist/server/node-build.mjs --name "youtube-vob-opener" --env PORT=3008

# Save PM2 configuration
pm2 save
pm2 startup
```

#### 4. Configure Nginx
```bash
# Copy nginx config
sudo cp nginx-yt.techassistant.co.in.conf /etc/nginx/sites-available/yt.techassistant.co.in

# Enable site
sudo ln -s /etc/nginx/sites-available/yt.techassistant.co.in /etc/nginx/sites-enabled/

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. Optional: Setup SSL
```bash
# Install certbot if not already installed
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yt.techassistant.co.in
```

### PM2 Management Commands:

```bash
pm2 status                    # Check all processes
pm2 logs youtube-vob-opener   # View logs
pm2 restart youtube-vob-opener # Restart app
pm2 stop youtube-vob-opener   # Stop app
pm2 monit                     # Monitor dashboard
pm2 reload youtube-vob-opener # Zero-downtime reload
```

### Nginx Management:
```bash
sudo nginx -t                 # Test config
sudo systemctl reload nginx   # Reload nginx
sudo systemctl status nginx   # Check nginx status
sudo systemctl restart nginx  # Restart nginx
```

### Monitoring & Logs:
```bash
# Application logs
pm2 logs youtube-vob-opener

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System monitoring
htop
df -h
free -m
```

### Troubleshooting:

1. **Port 3008 already in use:**
   ```bash
   sudo netstat -tulpn | grep :3008
   sudo kill -9 <PID>
   ```

2. **App not accessible:**
   - Check PM2 status: `pm2 status`
   - Check nginx config: `sudo nginx -t`
   - Check firewall: `sudo ufw status`

3. **SSL issues:**
   - Renew certificate: `sudo certbot renew`
   - Check certificate: `sudo certbot certificates`

### Security Notes:
- Change default secrets in `.env.production`
- Keep dependencies updated: `npm audit fix`
- Monitor logs regularly
- Setup fail2ban for additional security

### Performance Tuning:
- Enable Nginx gzip compression ✅ (already configured)
- Setup PM2 clustering if needed
- Monitor memory usage: `pm2 monit`
- Consider Redis for session storage if scaling

🎉 Your YouTube VOB Opener should now be live at: http://yt.techassistant.co.in
