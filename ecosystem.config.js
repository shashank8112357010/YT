module.exports = {
  apps: [{
    name: 'youtube-vob-opener',
    script: 'dist/server/node-build.mjs',
    cwd: '/var/www/yt.techassistant.co.in', // Update this to your actual VPS path
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3008
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3008
    },
    error_file: '/var/log/pm2/youtube-vob-opener-error.log',
    out_file: '/var/log/pm2/youtube-vob-opener-out.log',
    log_file: '/var/log/pm2/youtube-vob-opener.log',
    time: true
  }]
};
