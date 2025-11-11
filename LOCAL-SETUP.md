# 🚀 Local Development Setup with Live Chat

## Quick Start (Windows)

### Step 1: Install Dependencies

```powershell
cd C:\Users\tsvet\Documents\minecraft\MinecraftALL\website
npm install
```

This will install:
- `ws` - WebSocket library for real-time chat
- `concurrently` - Run multiple commands simultaneously
- All other dependencies

### Step 2: Start Everything

**Option A: Run both Next.js and WebSocket server together**

```powershell
npm run dev:all
```

This runs:
- Next.js dev server on http://localhost:3000
- WebSocket server on ws://localhost:8081

**Option B: Run separately in two terminals**

Terminal 1:
```powershell
npm run dev
```

Terminal 2:
```powershell
npm run dev:ws
```

### Step 3: Test Live Chat

1. Open http://localhost:3000/admin
2. Click **"Live Chat"** button in the navigation bar
3. Chat panel slides in from the right
4. Type a message and hit Send (requires RCON connection to Minecraft server)

### Step 4: Test WebSocket Connection

Open browser console (F12) and run:

```javascript
const ws = new WebSocket('ws://localhost:8081');
ws.onopen = () => console.log('✅ WebSocket connected!');
ws.onmessage = (e) => console.log('📨 Message:', e.data);
ws.onerror = (e) => console.error('❌ Error:', e);
```

You should see `✅ WebSocket connected!` and receive chat history.

---

## Testing RCON Commands

### 1. Make sure your Minecraft server RCON is configured

Check `server.properties`:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_password_here
```

### 2. Test RCON from the website

1. Go to http://localhost:3000/admin
2. Click "Live Chat" in navigation
3. Type a test message
4. Click Send

If RCON is working, you'll see `[ADMIN] Your message` in Minecraft server console.

### 3. Verify RCON connection

```powershell
# Windows PowerShell
Test-NetConnection ddns.tsvweb.com -Port 25575
```

Should show `TcpTestSucceeded : True`

---

## Environment Variables

Make sure your `.env` file has:

```env
# RCON Configuration
RCON_HOST=ddns.tsvweb.com
RCON_PORT=25575
RCON_PASSWORD=534901671199c9c1def2283fd9195be932ae9cbe10590b8fbd6e81d4ea8df25b
RCON_TIMEOUT_MS=1500

# WebSocket Configuration (Local Development)
WS_SERVER_URL=http://127.0.0.1:8081
NEXT_PUBLIC_WS_URL=ws://localhost:8081
WS_PORT=8081
WS_HOST=127.0.0.1
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (Client)                        │
│  ┌──────────────┐              ┌─────────────────────────┐  │
│  │  Next.js App │◄─────HTTP────┤  Live Chat Component    │  │
│  │  :3000       │              │  (WebSocket Client)     │  │
│  └──────┬───────┘              └──────────┬──────────────┘  │
│         │                                 │                  │
└─────────┼─────────────────────────────────┼──────────────────┘
          │                                 │
          │ HTTP/REST                       │ WebSocket
          │                                 │
┌─────────▼─────────────────────────────────▼──────────────────┐
│                    Backend (Server)                           │
│  ┌──────────────┐              ┌─────────────────────────┐   │
│  │  Next.js API │              │  WebSocket Server       │   │
│  │  Routes      │◄─────────────┤  :8081                  │   │
│  └──────┬───────┘              └──────────┬──────────────┘   │
│         │                                 │                   │
│         │                                 │                   │
│  ┌──────▼───────┐              ┌──────────▼──────────────┐   │
│  │  RCON Client │              │  In-Memory Chat Store   │   │
│  │  (Minecraft) │              │  (Last 100 messages)    │   │
│  └──────────────┘              └─────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
          │
          │ RCON Protocol
          │
┌─────────▼─────────────────────────────────────────────────────┐
│              Minecraft Server (ddns.tsvweb.com)               │
│  ┌──────────────┐              ┌─────────────────────────┐   │
│  │  Paper/Spigot│              │  Your Plugin            │   │
│  │  Server      │◄─────────────┤  (Sends chat to API)    │   │
│  └──────────────┘              └─────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

---

## How It Works

### 1. **WebSocket Server** (`websocket-server.js`)
- Runs on port 8081
- Stores last 100 chat messages in memory
- Broadcasts new messages to all connected clients
- Provides HTTP endpoint `/chat` for Minecraft plugin

### 2. **Live Chat Component** (`LiveChatPanel.tsx`)
- Connects to WebSocket server
- Receives real-time chat updates
- Sends admin messages via RCON

### 3. **Admin Layout** (`AdminLayout.tsx`)
- Provides navigation bar with "Live Chat" button
- Slides chat panel in/out from right side
- Responsive layout

### 4. **Message Flow**

**Player sends chat in Minecraft:**
```
Minecraft Player → Plugin → POST /api/plugin/chat-stream → WebSocket Server → Broadcast to all clients
```

**Admin sends message from website:**
```
Admin (Browser) → POST /api/admin/send-server-message → RCON → Minecraft Server
```

---

## File Structure

```
MinecraftALL/
├── website/
│   ├── websocket-server.js           # WebSocket server (NEW)
│   ├── src/
│   │   ├── components/
│   │   │   ├── LiveChatPanel.tsx     # Live chat component (NEW)
│   │   │   └── AdminLayout.tsx       # Admin navigation layout (NEW)
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   └── page.tsx          # Admin panel (UPDATED)
│   │   │   └── api/
│   │   │       ├── plugin/
│   │   │       │   └── chat-stream/
│   │   │       │       └── route.ts  # Chat endpoint (UPDATED)
│   │   │       └── admin/
│   │   │           └── send-server-message/
│   │   │               └── route.ts  # RCON message (EXISTS)
│   │   └── lib/
│   │       └── rcon.ts                # RCON client (EXISTS)
│   ├── package.json                   # Added ws & concurrently (UPDATED)
│   └── .env                           # WebSocket config (UPDATED)
└── SSH-SETUP-GUIDE.md                # Production setup (NEW)
```

---

## Troubleshooting

### WebSocket won't connect

```powershell
# Check if WebSocket server is running
# You should see: "WebSocket server listening on 127.0.0.1:8081"
```

Fix: Run `npm run dev:ws` in a separate terminal

### RCON commands not working

```powershell
# Test RCON connection
Test-NetConnection ddns.tsvweb.com -Port 25575
```

Fix: 
1. Check `RCON_HOST` in `.env`
2. Verify Minecraft server `server.properties` has RCON enabled
3. Check firewall allows port 25575

### Chat messages not appearing

1. Open browser console (F12)
2. Check for WebSocket errors
3. Verify WebSocket server is running
4. Check Network tab for failed requests

### Can't send messages

Fix:
1. Make sure you're logged in as admin
2. Check RCON connection to Minecraft server
3. Verify `RCON_PASSWORD` matches server

---

## Next Steps

### Local Development
1. ✅ Run `npm install`
2. ✅ Run `npm run dev:all`
3. ✅ Test live chat at http://localhost:3000/admin

### Deploy to Production
1. Follow `SSH-SETUP-GUIDE.md`
2. Setup WebSocket server on server
3. Configure Nginx reverse proxy
4. Update `.env` with production URLs

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start Next.js only |
| `npm run dev:ws` | Start WebSocket server only |
| `npm run dev:all` | Start both Next.js and WebSocket |
| `npm run build` | Build for production |
| `npm start` | Start production Next.js |
| `npm run start:ws` | Start production WebSocket |

---

## Testing Checklist

- [ ] WebSocket server starts on port 8081
- [ ] Next.js app starts on port 3000
- [ ] Live Chat button appears in admin navigation
- [ ] Chat panel slides in from right
- [ ] WebSocket connects (green "Connected" badge)
- [ ] Can send admin messages (with RCON working)
- [ ] Chat messages appear in real-time
- [ ] No console errors in browser

🎉 **Everything ready for local development!**
