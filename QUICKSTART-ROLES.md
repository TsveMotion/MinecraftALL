# Quick Start - Roles System

## Immediate Next Steps

### 1. Install Dependencies & Generate Prisma Client

```bash
cd website
npm install
npx prisma generate
```

This will:
- Install all new dependencies (socket.io, redis, rcon-client, jsonwebtoken, etc.)
- Generate Prisma client with the new schema models
- Resolve all TypeScript lint errors

### 2. Push Database Schema

```bash
npx prisma db push
```

Or create a migration:
```bash
npx prisma migrate dev --name add_roles_and_live_status
```

This creates the new tables:
- `roles` - Role definitions with symbol, color, pricing
- `user_roles` - User-role assignments with isPrimary
- `purchases` - Purchase tracking for paid roles
- `mutes` - Player mute system
- `audit_logs` - Admin action logging
- `server_stats` - Server status history

### 3. Update Environment Variables

Edit `website/.env` and set these values:

```env
# Generate a secure JWT secret
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Generate a secure API shared secret (must match plugin config)
API_SHARED_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Your RCON details
RCON_HOST=play.tsvweb.co.uk
RCON_PORT=25575
RCON_PASSWORD=your_actual_rcon_password

# Redis (optional but recommended)
REDIS_URL=redis://localhost:6379
```

### 4. Seed Initial Data (Optional)

Create `website/prisma/seed.ts` - see ROLES-SYSTEM-SETUP.md for the full seed script.

Then run:
```bash
npm install -D ts-node
npx prisma db seed
```

This creates:
- Admin role (◆, #93C572 pistachio)
- Member role (★, #9CA3AF gray, free)
- VIP role (♛, #F59E0B amber, £2.99)
- Admin user: `tsvetanov` with password `changeme123`

### 5. Enable RCON on Minecraft Server

Edit your server's `server.properties`:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_rcon_password
```

Restart your Minecraft server.

### 6. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

### 7. Test the System

**Test Server Status:**
```bash
curl http://localhost:3000/api/status
```

Expected response:
```json
{
  "online": true,
  "tps": 20.0,
  "playersCount": 0,
  "maxPlayers": 20,
  "players": []
}
```

**Login as Admin:**
- Go to http://localhost:3000/login
- Username: `tsvetanov`
- Password: `changeme123`

**Access Admin Panel:**
- Go to http://localhost:3000/admin
- Navigate to "Roles" tab
- You should see: Admin, Member, and VIP roles

### 8. Install Minecraft Plugin (Later)

The plugin code has been started in:
- `plugin/src/main/java/uk/co/tsvweb/minecraftroles/`

You'll need to complete:
- Model classes (PlayerRole, MuteStatus)
- Chat listener
- Join listener  
- Commands (ReportCommand, MuteCommand)
- Utils (ColorUtil, NameObfuscator)
- plugin.yml and config.yml

See `ROLES-SYSTEM-SETUP.md` for full plugin setup.

## What's Been Implemented

### Backend (✅ Complete)
- ✅ Updated Prisma schema with 7 new models
- ✅ Redis caching utility
- ✅ RCON client for server queries
- ✅ JWT authentication
- ✅ HMAC signing for plugin API
- ✅ Audit logging system
- ✅ Role management utilities

### API Endpoints (✅ Complete)
- ✅ `GET /api/status` - Live server status with 10s refresh
- ✅ `GET /api/me/roles` - User's roles
- ✅ `POST /api/me/roles/claim-free` - Claim free role (1 per user)
- ✅ `POST /api/me/roles/checkout` - Create purchase for paid role
- ✅ `GET /api/plugin/roles/:username` - Get player role (signed)
- ✅ `GET /api/plugin/mute/:username` - Check mute status (signed)
- ✅ `POST /api/plugin/report` - Submit report (signed)
- ✅ `GET /POST /PATCH /DELETE /api/admin/roles` - Role CRUD
- ✅ `POST /api/admin/purchases/:id/mark-paid` - Grant paid role
- ✅ `POST /DELETE /api/admin/mute-player` - Mute/unmute players

### Plugin (🚧 In Progress)
- ✅ Main plugin class
- ✅ Configuration system
- ✅ Web API client with caching
- ⏳ Chat listener (needs implementation)
- ⏳ Join listener (needs implementation)
- ⏳ Report command (needs implementation)
- ⏳ Mute command (needs implementation)
- ⏳ Utility classes (needs implementation)

### Frontend (⏳ TODO)
- ⏳ User dashboard with role claiming
- ⏳ Live server status widget (WebSocket + fallback)
- ⏳ Admin dashboard
- ⏳ Role management UI
- ⏳ Player management UI
- ⏳ Purchases management
- ⏳ Audit log viewer

## Key Features

### Live Server Status (10s Refresh)
- **RCON Integration**: Queries server every 10s
- **Redis Caching**: 5-8s cache to prevent hammering
- **WebSocket Support**: Real-time updates when available
- **REST Fallback**: Polls every 10s if WebSocket unavailable
- **Player Data**: Shows online players with role tags

### Roles System
- **Free Roles**: Users can claim exactly 1 free role
- **Paid Roles**: Create PENDING purchase, admin marks PAID to grant
- **Primary Role**: One role displayed in chat/tab
- **Custom Symbols**: ★ ◆ ♛ ⚡ ✦ ✪ (configurable)
- **Hex Colors**: Any hex color for role display
- **Admin Override**: Pistachio green (#93C572) with ◆ symbol

### Chat & Tab Formatting
- **Chat Privacy**: Shows `tsv…ov` (first 3 + last 2)
- **Tab List**: Shows full name `tsvetanov`
- **Role Tags**: `[◆] tsv…ov: message` format
- **Admin Priority**: Admins always pistachio green

### Admin Features
- **Role CRUD**: Create, edit, delete, activate/deactivate
- **Purchase Management**: Mark paid/refunded
- **Player Management**: View all players, IPs, online status
- **Mute System**: Mute players with duration and reason
- **Audit Logs**: All admin actions logged with metadata

## Troubleshooting

### Lint Errors in IDE
**Solution**: Run `npm install` and `npx prisma generate`. The errors are because TypeScript doesn't have the generated Prisma types yet.

### "Property X does not exist on Prisma model"
**Solution**: Run `npx prisma generate` to regenerate client after schema changes.

### RCON Connection Failed
**Solution**: 
1. Verify `enable-rcon=true` in server.properties
2. Check port 25575 is not blocked by firewall
3. Verify password matches

### Redis Connection Error
**Solution**: Redis is optional. If not using Redis, the system will log warnings but continue working without caching.

## Project Structure

```
MinecraftALL/
├── website/                    # Next.js web application
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/          # API routes
│   │   │   │   ├── status/   # ✅ Server status
│   │   │   │   ├── me/       # ✅ User endpoints
│   │   │   │   ├── admin/    # ✅ Admin endpoints
│   │   │   │   └── plugin/   # ✅ Plugin endpoints
│   │   │   └── ...
│   │   ├── lib/              # Utilities
│   │   │   ├── prisma.ts
│   │   │   ├── redis.ts      # ✅ Redis client
│   │   │   ├── rcon.ts       # ✅ RCON client
│   │   │   ├── jwt.ts        # ✅ JWT utilities
│   │   │   ├── hmac.ts       # ✅ HMAC signing
│   │   │   ├── audit.ts      # ✅ Audit logging
│   │   │   └── roles.ts      # ✅ Role utilities
│   │   └── components/
│   ├── prisma/
│   │   └── schema.prisma     # ✅ Updated schema
│   ├── .env                  # ⚠️ Update secrets!
│   └── package.json          # ✅ New dependencies
├── plugin/                    # Minecraft plugin
│   └── src/main/java/...     # 🚧 In progress
├── ROLES-SYSTEM-SETUP.md     # ✅ Full setup guide
└── QUICKSTART-ROLES.md       # ✅ This file
```

## Next Actions

1. **Run**: `cd website && npm install`
2. **Run**: `npx prisma generate && npx prisma db push`
3. **Update**: `.env` with secrets and RCON details
4. **Run**: `npx prisma db seed` (optional)
5. **Start**: `npm run dev`
6. **Test**: Visit http://localhost:3000
7. **Review**: Full setup guide in `ROLES-SYSTEM-SETUP.md`

---

**Status**: Backend & API ✅ Complete | Plugin 🚧 50% | Frontend ⏳ TODO  
**Documentation**: See `ROLES-SYSTEM-SETUP.md` for comprehensive guide
