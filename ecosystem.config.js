// pm2 process definition for the self-hosted 3lines site.
//   start:   pm2 start ecosystem.config.js
//   save:    pm2 save           (so pm2 resurrect can bring it back after a reboot)
// Secrets (CMS_PASSWORD / SESSION_SECRET) live in .env.local, NOT here, and are
// loaded by server.js at startup. PORT is also read from .env.local.
module.exports = {
  apps: [
    {
      name: '3lines-site',
      script: 'server.js',
      cwd: 'C:\\Users\\Administrator\\Desktop\\3linesWeb\\3lines-website-clone',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      // Dedicated Cloudflare Tunnel for the 3lines site (separate from IT's
      // "Cloudflared" Windows service). Publishes 3lines.com.sa -> localhost:8080.
      name: '3lines-tunnel',
      script: 'C:\\Program Files\\cloudflared\\cloudflared.exe',
      args: 'tunnel --config C:\\Users\\Administrator\\.cloudflared\\config.yml run 3lines-main',
      interpreter: 'none',
      autorestart: true,
      max_restarts: 20,
      min_uptime: '10s',
    },
  ],
};
