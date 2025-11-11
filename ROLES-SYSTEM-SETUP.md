# Minecraft Roles System - Setup Guide

This guide will help you set up the complete Minecraft authentication + roles + admin + live status system.

## Overview

This system provides:
- **Live Server Status** (10-second refresh via WebSocket + REST fallback)
- **Roles System** (free and paid roles with custom symbols and colors)
- **Admin Dashboard** (role management, player management, audit logs)
- **Minecraft Plugin** (chat/tab formatting, mute system, reports)

## Prerequisites

- **Node.js** 18+ and npm
- **MySQL or PostgreSQL** database
- **Redis** (optional but recommended for caching)
- **Minecraft Paper/Spigot** 1.20+ server
- **RCON** enabled on your Minecraft server

## Part 1: Web Application Setup

### Step 1: Install Dependencies

```bash
cd website
npm install
```

### Step 2: Configure Environment Variables

The `.env` file has been updated. Make sure to set these values:

```env
# Database
DATABASE_URL="mysql://username:password@host:3306/database_name"

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://streetlymc.com
NEXT_PUBLIC_MINECRAFT_SERVER=play.streetlymc.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_minimum_32_chars

# API Shared Secret (for plugin → app communication)
API_SHARED_SECRET=your_shared_secret_for_plugin_to_app_communication_change_this

# RCON Configuration
RCON_HOST=play.streetlymc.com
RCON_PORT=25575
RCON_PASSWORD=your_rcon_password
RCON_TIMEOUT_MS=1500

# Redis (optional but recommended)
REDIS_URL=redis://localhost:6379
```

**Important**: Generate secure secrets for `JWT_SECRET` and `API_SHARED_SECRET`. You can use:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 3: Run Database Migration

The Prisma schema has been updated with all required models. Run the migration:

```bash
npx prisma generate
npx prisma db push
```

Or create a proper migration:
```bash
npx prisma migrate dev --name add_roles_system
```

### Step 4: Seed Initial Data (Optional)

Create a file `website/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create Admin role
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Server administrator',
      symbol: '◆',
      colorHex: '#93C572', // Pistachio green
      isFree: false,
      priceMinor: 0,
      isActive: true,
    },
  })

  // Create free Member role
  const memberRole = await prisma.role.upsert({
    where: { name: 'Member' },
    update: {},
    create: {
      name: 'Member',
      description: 'Free member role for all players',
      symbol: '★',
      colorHex: '#9CA3AF', // Gray
      isFree: true,
      priceMinor: 0,
      isActive: true,
    },
  })

  // Create paid VIP role
  const vipRole = await prisma.role.upsert({
    where: { name: 'VIP' },
    update: {},
    create: {
      name: 'VIP',
      description: 'VIP players with exclusive perks',
      symbol: '♛',
      colorHex: '#F59E0B', // Amber
      isFree: false,
      priceMinor: 299, // £2.99
      isActive: true,
    },
  })

  // Create your admin user (tsvetanov)
  const adminUser = await prisma.user.upsert({
    where: { minecraftUsername: 'tsvetanov' },
    update: {},
    create: {
      email: 'admin@tsvweb.co.uk',
      minecraftUsername: 'tsvetanov',
      fullName: 'K. Tsvetanov',
      passwordHash: await bcrypt.hash('changeme123', 10),
      isAdmin: true,
      verified: true,
    },
  })

  // Assign admin role to admin user
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
      isPrimary: true,
      grantedBy: adminUser.id,
    },
  })

  console.log('✅ Seed data created successfully')
  console.log('Admin user:', adminUser.minecraftUsername)
  console.log('Roles:', [adminRole.name, memberRole.name, vipRole.name])
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

Add to `package.json`:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Install ts-node: `npm install -D ts-node`

Run seed:
```bash
npx prisma db seed
```

### Step 5: Enable RCON on Your Minecraft Server

Edit `server.properties`:
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_rcon_password
```

Restart your Minecraft server.

### Step 6: Start the Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Step 7: Build for Production

```bash
npm run build
npm start
```

## Part 2: Minecraft Plugin Setup

### Step 1: Create Plugin Structure

Navigate to the `plugin` directory and create the following structure:

```
plugin/
├── src/
│   └── main/
│       ├── java/
│       │   └── uk/
│       │       └── co/
│       │           └── tsvweb/
│       │               └── minecraftroles/
│       │                   ├── MinecraftRoles.java (main plugin class)
│       │                   ├── config/
│       │                   │   └── PluginConfig.java
│       │                   ├── listeners/
│       │                   │   ├── ChatListener.java
│       │                   │   └── JoinListener.java
│       │                   ├── commands/
│       │                   │   ├── ReportCommand.java
│       │                   │   └── MuteCommand.java
│       │                   ├── api/
│       │                   │   └── WebAPIClient.java
│       │                   └── utils/
│       │                       ├── ColorUtil.java
│       │                       └── NameObfuscator.java
│       └── resources/
│           ├── plugin.yml
│           └── config.yml
├── pom.xml (or build.gradle)
└── README.md
```

### Step 2: Configure the Plugin

Create `config.yml` in the plugin:

```yaml
apiBaseUrl: "https://streetlymc.com"
apiKey: "your_shared_secret_for_plugin_to_app_communication_change_this"
cacheSeconds: 30

roleTag:
  admin:
    symbol: "◆"
    color: "#93C572"  # pistachio

privacy:
  chatObfuscate: true
  obfuscatePattern: "first3_ellipsis_last2"

report:
  enabled: true

mute:
  enabled: true
```

**Important**: The `apiKey` must match the `API_SHARED_SECRET` in your web app's `.env`.

### Step 3: Build the Plugin

I'll create the complete plugin code in the next step. For now, ensure you have:
- Java 17+
- Maven or Gradle
- Paper/Spigot API dependency

### Step 4: Install the Plugin

1. Build the plugin: `mvn clean package`
2. Copy `target/MinecraftRoles-1.0.0.jar` to your server's `plugins/` folder
3. Start/restart your server
4. Configure `plugins/MinecraftRoles/config.yml`
5. Reload: `/reload confirm`

## Part 3: Testing

### Test Server Status API

```bash
curl http://localhost:3000/api/status
```

Should return:
```json
{
  "online": true,
  "tps": 20.0,
  "playersCount": 1,
  "maxPlayers": 20,
  "players": [
    {
      "username": "tsvetanov",
      "role": {
        "symbol": "◆",
        "colorHex": "#93C572"
      },
      "online": true
    }
  ]
}
```

### Test Role Claiming

1. Login to the web app
2. Go to Dashboard
3. Click "Claim Free Role"
4. Select "Member" role
5. Verify it appears in "Your Roles"

### Test In-Game

1. Join the Minecraft server
2. Type a chat message
3. Your role tag should appear: `[◆] tsv…ov: hello`
4. Press TAB to see full names with role tags

### Test Admin Panel

1. Login as admin (tsvetanov)
2. Navigate to `/admin`
3. Go to "Roles" tab
4. Create a new role
5. Assign it to a player

## Part 4: Production Deployment

### Deploy Web App

Follow the existing `DEPLOYMENT-GUIDE.md` for deploying to your server.

Additional considerations:
- Set up Redis in production
- Use strong secrets in `.env`
- Enable HTTPS
- Configure rate limiting
- Set up WebSocket proxy (nginx/caddy)

### Redis Setup (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Update `.env`:
```env
REDIS_URL=redis://localhost:6379
```

### WebSocket Configuration (nginx)

Add to your nginx config:

```nginx
location /ws {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

## Troubleshooting

### Issue: Lint Errors in IDE

**Solution**: Run `npm install` and `npx prisma generate`. The TypeScript types need to be regenerated.

### Issue: RCON Connection Failed

**Solution**:
- Verify RCON is enabled in `server.properties`
- Check firewall rules for port 25575
- Test RCON password
- Ensure server is running

### Issue: Plugin Can't Connect to Web API

**Solution**:
- Verify `apiKey` in plugin `config.yml` matches `API_SHARED_SECRET` in `.env`
- Check web app URL is accessible from server
- Look at plugin console logs

### Issue: Roles Not Showing in Chat

**Solution**:
- Verify user has claimed a role in web dashboard
- Check plugin cache (wait 30 seconds or reload)
- Ensure plugin is properly loaded

## Features Checklist

- [ ] Server status updates every 10 seconds
- [ ] Users can claim exactly one free role
- [ ] Paid roles create PENDING purchase
- [ ] Admin can mark purchases as PAID
- [ ] Admin can create/edit/delete roles
- [ ] Admin can promote/demote admins
- [ ] Players page shows IP and online status
- [ ] Chat shows role tag + truncated name
- [ ] Tab shows full name + role tag
- [ ] Admins are pistachio green with ◆
- [ ] Mute system works
- [ ] Report command works

## Next Steps

1. Install dependencies: `npm install`
2. Configure `.env`
3. Run migration: `npx prisma db push`
4. Seed data: `npx prisma db seed`
5. Start dev server: `npm run dev`
6. Build and install Minecraft plugin
7. Test all features
8. Deploy to production

## Support

For issues or questions:
- Check the troubleshooting section
- Review logs: `npm run dev` output, Minecraft console
- Verify all configuration files

---

**Created**: November 2025  
**System**: Minecraft Auth + Roles + Admin + Live Status
