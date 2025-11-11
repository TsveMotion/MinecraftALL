# 🚀 SSH Setup Guide for play.tsvweb.co.uk

## Step-by-Step WebSocket + Live Chat Setup

### Prerequisites
- SSH access to your server at `ddns.tsvweb.com` or `play.tsvweb.co.uk`
- Root or sudo access
- Ubuntu/Debian server

---

## Part 1: Connect to Your Server

### 1. Open SSH Connection

```bash
# Connect to your server (from PowerShell or Git Bash on Windows)
ssh root@ddns.tsvweb.com
# OR
ssh root@play.tsvweb.co.uk

# If using a specific user:
ssh youruser@ddns.tsvweb.com
```

---

## Part 2: Install Prerequisites

### 2. Update System & Install Node.js

```bash
# Update package list
sudo apt update

# Install Nginx, Certbot, and basic tools
sudo apt install -y nginx certbot python3-certbot-nginx ufw curl

# Install Node.js 18+ (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Part 3: Setup WebSocket Server

### 3. Create WebSocket Service Directory

```bash
# Create directory for WebSocket server
sudo mkdir -p /srv/webmc-proxy
cd /srv/webmc-proxy

# Initialize npm project
sudo npm init -y

# Install WebSocket library
sudo npm install ws
```

### 4. Upload WebSocket Server Code

```bash
# Create the server file
sudo nano /srv/webmc-proxy/server.js
```

**Paste this code:**

```javascript
const http = require('http');
const WebSocket = require('ws');

let chatHistory = [];

const server = http.createServer();
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws, req) => {
  console.log('New WebSocket client connected from:', req.socket.remoteAddress);
  ws.send(JSON.stringify({ type: 'history', messages: chatHistory }));
  
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Received:', data);
      ws.send(JSON.stringify({ type: 'ack', received: true }));
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => console.log('Client disconnected'));
  ws.on('error', (error) => console.error('WebSocket error:', error));
});

server.on('request', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const chatMessage = JSON.parse(body);
        const message = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          username: chatMessage.username,
          displayName: chatMessage.displayName || chatMessage.username,
          roleSymbol: chatMessage.roleSymbol || null,
          roleColor: chatMessage.roleColor || null,
          message: chatMessage.message
        };
        
        chatHistory.push(message);
        if (chatHistory.length > 100) chatHistory = chatHistory.slice(-100);
        
        broadcast({ type: 'message', data: message });
        console.log('Chat message broadcasted:', message);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Error processing chat message:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      clients: wss.clients.size,
      messages: chatHistory.length 
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.WS_PORT || 8081;
const HOST = process.env.WS_HOST || '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`WebSocket server listening on ${HOST}:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### 5. Test the WebSocket Server

```bash
# Test run the server
cd /srv/webmc-proxy
node server.js

# You should see: "WebSocket server listening on 127.0.0.1:8081"
# Press Ctrl+C to stop it
```

---

## Part 4: Create Systemd Service

### 6. Setup Auto-Start Service

```bash
# Create systemd service file
sudo nano /etc/systemd/system/webmc-proxy.service
```

**Paste this:**

```ini
[Unit]
Description=WebMC Proxy (WebSocket for Live Chat)
After=network.target

[Service]
WorkingDirectory=/srv/webmc-proxy
ExecStart=/usr/bin/node /srv/webmc-proxy/server.js
Restart=always
RestartSec=3
User=www-data
Environment=NODE_ENV=production
Environment=WS_PORT=8081
Environment=WS_HOST=127.0.0.1

[Install]
WantedBy=multi-user.target
```

**Save and exit**

### 7. Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable webmc-proxy

# Start the service now
sudo systemctl start webmc-proxy

# Check status
sudo systemctl status webmc-proxy

# View logs
sudo journalctl -u webmc-proxy -f
# Press Ctrl+C to exit logs
```

---

## Part 5: Configure Nginx Reverse Proxy

### 8. Get SSL Certificate (if not already done)

```bash
# Allow HTTP/HTTPS through firewall
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Get SSL certificate for play.tsvweb.co.uk
sudo certbot --nginx -d play.tsvweb.co.uk

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)
```

### 9. Configure Nginx Site

```bash
# Create/edit Nginx config
sudo nano /etc/nginx/sites-available/play.tsvweb.co.uk
```

**Paste this complete configuration:**

```nginx
server {
  listen 80;
  server_name play.tsvweb.co.uk;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name play.tsvweb.co.uk;

  ssl_certificate /etc/letsencrypt/live/play.tsvweb.co.uk/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/play.tsvweb.co.uk/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;

  # Next.js application (port 3000)
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  # WebSocket endpoint for live chat
  location /ws/ {
    proxy_pass http://127.0.0.1:8081/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
  }
}
```

**Save and exit**

### 10. Enable Site and Reload Nginx

```bash
# Create symlink to enable site
sudo ln -sf /etc/nginx/sites-available/play.tsvweb.co.uk /etc/nginx/sites-enabled/play.tsvweb.co.uk

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## Part 6: Deploy Next.js Application

### 11. Setup Next.js Application Directory

```bash
# Create directory for the app
sudo mkdir -p /var/www/minecraft-dashboard
cd /var/www/minecraft-dashboard

# Clone or upload your application
# Option 1: Clone from Git
git clone https://github.com/yourusername/MinecraftALL.git .
cd website

# Option 2: Upload via SCP (from your Windows machine)
# scp -r C:\Users\tsvet\Documents\minecraft\MinecraftALL\website root@ddns.tsvweb.com:/var/www/minecraft-dashboard/
```

### 12. Install Dependencies and Build

```bash
cd /var/www/minecraft-dashboard/website

# Copy your .env file
sudo nano .env
```

**Paste your production .env:**

```env
DATABASE_URL="mysql://authuser:StrongPasswordHere@localhost:3306/minecraft_auth"

NEXT_PUBLIC_SITE_URL=https://play.tsvweb.co.uk
NEXT_PUBLIC_MINECRAFT_SERVER=Play.tsvweb.co.uk

JWT_SECRET=f7c7c88b91167e2f2574ebdbc2f5bef2247b9753c6912783be7c463d3bd9b584

API_SHARED_SECRET=f0d8438bf14eb25723aec7f31cde1666d5b3b3b2daebdf084c95fbd3d3ffa82d

RCON_HOST=127.0.0.1
RCON_PORT=25575
RCON_PASSWORD=534901671199c9c1def2283fd9195be932ae9cbe10590b8fbd6e81d4ea8df25b
RCON_TIMEOUT_MS=1500

REDIS_URL="redis://default:FFh4Uwwcq53rWRCXdU5ETRGeoUlBlHaX@redis-10727.crce218.eu-central-1-1.ec2.redns.redis-cloud.com:10727"

PLUGIN_API_URL=http://localhost:8080
PLUGIN_API_KEY=UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/

# WebSocket Configuration (PRODUCTION)
WS_SERVER_URL=http://127.0.0.1:8081
NEXT_PUBLIC_WS_URL=wss://play.tsvweb.co.uk/ws
WS_PORT=8081
WS_HOST=127.0.0.1
```

**Save and exit**

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build Next.js
npm run build
```

### 13. Create Next.js Systemd Service

```bash
sudo nano /etc/systemd/system/minecraft-dashboard.service
```

**Paste:**

```ini
[Unit]
Description=Minecraft Dashboard (Next.js)
After=network.target

[Service]
WorkingDirectory=/var/www/minecraft-dashboard/website
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=3
User=www-data
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Save and exit**

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable minecraft-dashboard
sudo systemctl start minecraft-dashboard

# Check status
sudo systemctl status minecraft-dashboard

# View logs
sudo journalctl -u minecraft-dashboard -f
```

---

## Part 7: Setup Firewall

### 14. Configure UFW Firewall

```bash
# Allow SSH (IMPORTANT - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Minecraft Java Edition
sudo ufw allow 25565/tcp

# Allow Minecraft Bedrock Edition
sudo ufw allow 19132/udp

# Allow RCON (only if needed from outside)
# sudo ufw allow 25575/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

---

## Part 8: Test Everything

### 15. Test WebSocket Connection

```bash
# Check if WebSocket server is running
curl http://127.0.0.1:8081/health

# Should return: {"status":"ok","clients":0,"messages":0}
```

### 16. Test from Browser

Open your browser and go to:
- **Website**: https://play.tsvweb.co.uk
- **Admin Panel**: https://play.tsvweb.co.uk/admin
- **Live Chat**: Click "Live Chat" button in navigation

### 17. Test WebSocket from Browser Console

```javascript
// Open browser console (F12) on https://play.tsvweb.co.uk
const ws = new WebSocket('wss://play.tsvweb.co.uk/ws/');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
ws.onerror = (e) => console.error('Error:', e);

// You should see: Connected! and receive history
```

---

## Part 9: Monitor and Troubleshoot

### 18. Useful Commands

```bash
# Check service status
sudo systemctl status webmc-proxy
sudo systemctl status minecraft-dashboard
sudo systemctl status nginx

# View logs
sudo journalctl -u webmc-proxy -f
sudo journalctl -u minecraft-dashboard -f
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Restart services
sudo systemctl restart webmc-proxy
sudo systemctl restart minecraft-dashboard
sudo systemctl restart nginx

# Check open ports
sudo netstat -tulpn | grep LISTEN

# Test SSL certificate
sudo certbot certificates
```

### 19. Common Issues

**WebSocket not connecting:**
```bash
# Check if service is running
sudo systemctl status webmc-proxy

# Check if port 8081 is listening
sudo netstat -tulpn | grep 8081

# Check Nginx config
sudo nginx -t

# Check firewall
sudo ufw status
```

**Next.js not starting:**
```bash
# Check if port 3000 is free
sudo netstat -tulpn | grep 3000

# Check logs
sudo journalctl -u minecraft-dashboard -n 100

# Rebuild
cd /var/www/minecraft-dashboard/website
npm run build
sudo systemctl restart minecraft-dashboard
```

**RCON not working:**
```bash
# Test RCON connection
telnet 127.0.0.1 25575

# Check Minecraft server config (server.properties)
grep rcon /path/to/minecraft/server.properties

# Should have:
# enable-rcon=true
# rcon.port=25575
# rcon.password=your_password
```

---

## Part 10: Update .env for Production

On your **local development machine**, update `.env`:

```env
# Development WebSocket URL (localhost)
NEXT_PUBLIC_WS_URL=ws://localhost:8081

# Production WebSocket URL (uncomment when deploying)
# NEXT_PUBLIC_WS_URL=wss://play.tsvweb.co.uk/ws
```

---

## Summary

You now have:
✅ WebSocket server running on port 8081
✅ Nginx proxying WebSocket at wss://play.tsvweb.co.uk/ws
✅ Next.js app running on port 3000
✅ Live chat integrated in navigation bar
✅ RCON commands working
✅ SSL/TLS enabled
✅ Firewall configured
✅ Auto-start on boot

### Quick Reference

| Service | Command |
|---------|---------|
| WebSocket Server | `sudo systemctl status webmc-proxy` |
| Next.js App | `sudo systemctl status minecraft-dashboard` |
| Nginx | `sudo systemctl status nginx` |
| View WS Logs | `sudo journalctl -u webmc-proxy -f` |
| View App Logs | `sudo journalctl -u minecraft-dashboard -f` |
| Restart All | `sudo systemctl restart webmc-proxy minecraft-dashboard nginx` |

### URLs

- Website: https://play.tsvweb.co.uk
- Admin Panel: https://play.tsvweb.co.uk/admin
- WebSocket: wss://play.tsvweb.co.uk/ws
- Health Check: https://play.tsvweb.co.uk (proxied to Next.js)

🎉 **Everything is ready!** Your live chat with WebSocket is now fully operational.
