# 🎮 EaglercraftX Setup - Play Minecraft in Browser!

## What This Is

This sets up a **WebSocket proxy** so players can connect to your Minecraft server directly from their browser using **EaglercraftX** (no download needed!).

**Players will connect to**: `wss://play.tsvweb.co.uk/eagler`

---

## 🚀 SSH Setup (Step-by-Step)

You're already SSH'd in, so let's continue!

### 1. Create EaglercraftX Proxy Directory

```bash
sudo mkdir -p /srv/eaglercraft-proxy
cd /srv/eaglercraft-proxy
```

### 2. Initialize and Install Dependencies

```bash
sudo npm init -y
sudo npm install ws
```

### 3. Create the Proxy Server

```bash
sudo nano /srv/eaglercraft-proxy/server.js
```

**Paste this code:**

```javascript
const net = require('net');
const http = require('http');
const WebSocket = require('ws');

const MINECRAFT_HOST = '127.0.0.1';
const MINECRAFT_PORT = 25565;
const WS_PORT = 8082;
const WS_HOST = '0.0.0.0';

const server = http.createServer();
const wss = new WebSocket.Server({ server });

console.log('EaglercraftX WebSocket Proxy');
console.log(`Minecraft Server: ${MINECRAFT_HOST}:${MINECRAFT_PORT}`);
console.log(`WebSocket Port: ${WS_PORT}`);

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`WebSocket client connected from ${clientIp}`);

  const mcSocket = net.createConnection({
    host: MINECRAFT_HOST,
    port: MINECRAFT_PORT
  });

  let isConnected = false;

  mcSocket.on('connect', () => {
    console.log('Connected to Minecraft server');
    isConnected = true;
  });

  ws.on('message', (data) => {
    if (isConnected && mcSocket.writable) {
      try {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        mcSocket.write(buffer);
      } catch (err) {
        console.error('Error forwarding to Minecraft:', err.message);
      }
    }
  });

  mcSocket.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(data, { binary: true });
      } catch (err) {
        console.error('Error forwarding to WebSocket:', err.message);
      }
    }
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    if (mcSocket && !mcSocket.destroyed) {
      mcSocket.destroy();
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    if (mcSocket && !mcSocket.destroyed) {
      mcSocket.destroy();
    }
  });

  mcSocket.on('close', () => {
    console.log('Minecraft connection closed');
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  mcSocket.on('error', (err) => {
    console.error('Minecraft connection error:', err.message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
});

server.listen(WS_PORT, WS_HOST, () => {
  console.log(`Server listening on ${WS_HOST}:${WS_PORT}`);
  console.log(`Clients connect to: wss://play.tsvweb.co.uk/eagler`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
```

**Save**: `Ctrl+X`, `Y`, `Enter`

### 4. Test the Proxy

```bash
cd /srv/eaglercraft-proxy
node server.js
```

You should see:
```
EaglercraftX WebSocket Proxy
Minecraft Server: 127.0.0.1:25565
WebSocket Port: 8082
✅ Server listening on 0.0.0.0:8082
```

Press `Ctrl+C` to stop

### 5. Create Systemd Service

```bash
sudo nano /etc/systemd/system/eaglercraft-proxy.service
```

**Paste:**

```ini
[Unit]
Description=EaglercraftX WebSocket Proxy
After=network.target

[Service]
WorkingDirectory=/srv/eaglercraft-proxy
ExecStart=/usr/bin/node /srv/eaglercraft-proxy/server.js
Restart=always
RestartSec=3
User=www-data
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

**Save and exit**

### 6. Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable eaglercraft-proxy
sudo systemctl start eaglercraft-proxy
sudo systemctl status eaglercraft-proxy
```

Should show: `active (running)`

### 7. Update Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/play.tsvweb.co.uk
```

**Add this location block** (inside the `server` block for port 443):

```nginx
    # EaglercraftX WebSocket Proxy
    location /eagler/ {
        proxy_pass http://127.0.0.1:8082/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60s;
    }
```

**Full example** (your config should look like this):

```nginx
server {
    listen 443 ssl http2;
    server_name play.tsvweb.co.uk;

    ssl_certificate /etc/letsencrypt/live/play.tsvweb.co.uk/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/play.tsvweb.co.uk/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Next.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Live Chat WebSocket
    location /ws/ {
        proxy_pass http://127.0.0.1:8081/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # EaglercraftX WebSocket Proxy (NEW!)
    location /eagler/ {
        proxy_pass http://127.0.0.1:8082/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 60s;
    }
}
```

**Save and exit**

### 8. Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Check Everything is Running

```bash
# Check EaglercraftX proxy
sudo systemctl status eaglercraft-proxy

# Check if port 8082 is listening
curl http://127.0.0.1:8082
# (Will show "Upgrade Required" - that's normal for WebSocket)

# View logs
sudo journalctl -u eaglercraft-proxy -f
```

---

## 🎮 How Players Connect

### Option 1: Host Your Own EaglercraftX Client

1. Download EaglercraftX client from: https://github.com/lax1dude/eaglercraft
2. Edit the client's `index.html` to set server:
   ```javascript
   const serverAddress = "wss://play.tsvweb.co.uk/eagler";
   ```
3. Host on your website

### Option 2: Use Public EaglercraftX Client

Players can use any EaglercraftX client and manually add your server:

**Server Address**: `play.tsvweb.co.uk/eagler`  
**Protocol**: WebSocket Secure (WSS)

---

## 🧪 Test It

### From Browser Console

Open browser console (F12) on any page and run:

```javascript
const ws = new WebSocket('wss://play.tsvweb.co.uk/eagler');
ws.onopen = () => console.log('✅ Connected to Minecraft!');
ws.onmessage = (e) => console.log('📨 Received:', e.data);
ws.onerror = (e) => console.error('❌ Error:', e);
```

If it connects, you're good! (It will disconnect quickly because it's not a valid Minecraft client)

---

## 📊 Port Summary

| Service | Port | URL |
|---------|------|-----|
| Minecraft Java | 25565 | Direct connection |
| Minecraft Bedrock | 19132 | Direct connection |
| Live Chat WS | 8081 | ws://127.0.0.1:8081 |
| EaglercraftX Proxy | 8082 | ws://127.0.0.1:8082 |
| Next.js Dashboard | 3000 | http://127.0.0.1:3000 |
| Nginx (HTTP) | 80 | Redirects to HTTPS |
| Nginx (HTTPS) | 443 | https://play.tsvweb.co.uk |

### Public URLs

| Service | Public URL |
|---------|-----------|
| Website | https://play.tsvweb.co.uk |
| Admin Panel | https://play.tsvweb.co.uk/admin |
| Live Chat WS | wss://play.tsvweb.co.uk/ws |
| **EaglercraftX** | **wss://play.tsvweb.co.uk/eagler** |

---

## 🔒 Firewall Rules

```bash
# Make sure these are allowed
sudo ufw status

# Should see:
# 80/tcp       ALLOW       Anywhere
# 443/tcp      ALLOW       Anywhere
# 22/tcp       ALLOW       Anywhere
```

Port 8082 does NOT need to be opened - Nginx proxies it internally.

---

## 🐛 Troubleshooting

### "Connection refused"

```bash
# Check if EaglercraftX proxy is running
sudo systemctl status eaglercraft-proxy

# Restart if needed
sudo systemctl restart eaglercraft-proxy
```

### "Upgrade Required" error

```bash
# Check Nginx config
sudo nginx -t

# Make sure /eagler/ location is in the HTTPS (443) server block
sudo nano /etc/nginx/sites-available/play.tsvweb.co.uk

# Reload after changes
sudo systemctl reload nginx
```

### Players can't connect from EaglercraftX client

```bash
# View real-time logs
sudo journalctl -u eaglercraft-proxy -f

# When player connects, you should see:
# "WebSocket client connected from XXX.XXX.XXX.XXX"
# "Connected to Minecraft server"
```

### Check Minecraft server is accepting connections

```bash
# Test local connection
telnet 127.0.0.1 25565

# Should connect (Ctrl+C to exit)
```

---

## 📝 Commands Reference

```bash
# Service Management
sudo systemctl start eaglercraft-proxy
sudo systemctl stop eaglercraft-proxy
sudo systemctl restart eaglercraft-proxy
sudo systemctl status eaglercraft-proxy

# View Logs
sudo journalctl -u eaglercraft-proxy -f
sudo journalctl -u eaglercraft-proxy -n 100

# Test Endpoints
curl http://127.0.0.1:8082
curl https://play.tsvweb.co.uk

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl status nginx
```

---

## 🎯 Summary

✅ **EaglercraftX proxy running** on port 8082  
✅ **Nginx proxying** wss://play.tsvweb.co.uk/eagler  
✅ **SSL/TLS enabled** via Let's Encrypt  
✅ **Auto-start on boot** via systemd  
✅ **Players can connect** from any EaglercraftX client  

---

## 🌐 Player Instructions

To play on your server in browser:

1. Go to any **EaglercraftX** client website
2. Click "Multiplayer"
3. Click "Add Server"
4. **Server Address**: `play.tsvweb.co.uk/eagler`
5. Click "Done"
6. Join the server!

Or use the direct connection:
```
wss://play.tsvweb.co.uk/eagler
```

---

## 🎉 You're Done!

Players can now:
- ✅ Play from browser (no download)
- ✅ Connect via secure WebSocket (WSS)
- ✅ Join from any device with a web browser

Your Minecraft server is now accessible at:
- **Java Edition**: `play.tsvweb.co.uk:25565`
- **Bedrock Edition**: `play.tsvweb.co.uk:19132`
- **Browser (EaglercraftX)**: `wss://play.tsvweb.co.uk/eagler`

🚀 **Everything is set up and ready to go!**
