# Streetly SMP - Complete Deployment Guide

This guide covers deploying both the Next.js website and Minecraft plugin with all new features.

---

## 📋 Prerequisites

- MySQL 8.0+ database
- Node.js 18+ and npm
- Java 17+ (for building the plugin)
- Maven (for building the plugin)
- Minecraft Paper server 1.20.4+

---

## 🗄️ Part 1: Database Setup

### Step 1: Run the Migration Script

Execute the SQL migration to add new fields and tables:

```bash
mysql -u authuser -p -h ddns.tsvweb.com minecraft_auth < database/migrations/001_add_new_fields.sql
```

Or manually connect to MySQL and run the SQL file.

**This migration adds:**
- `real_name`, `year_group`, `rank_color`, `is_admin`, `last_login_at` columns to `users`
- `reports` table for player reports
- `bans` table for ban management
- Admin user setup (kristiyan's account)

### Step 2: Verify Migration

```sql
DESCRIBE users;
DESCRIBE reports;
DESCRIBE bans;

-- Check admin user
SELECT email, is_admin FROM users WHERE email = '20-tsvetanov-k@thestreetlyacademy.co.uk';
```

---

## 🌐 Part 2: Website Deployment

### Step 1: Update Environment Variables

Copy `.env.example` to `.env` and update:

```bash
cd website
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://authuser:StrongPasswordHere@ddns.tsvweb.com:3306/minecraft_auth"
NEXT_PUBLIC_SITE_URL=https://mc-verify.tsvweb.co.uk
NEXT_PUBLIC_MINECRAFT_SERVER=Play.tsvweb.co.uk

# Plugin API Configuration (for admin kick/ban actions)
PLUGIN_API_URL=http://YOUR_SERVER_IP:8080
PLUGIN_API_KEY=generate-secure-random-key-here
```

**⚠️ Important:**
- `PLUGIN_API_URL` should point to your Minecraft server's IP address (where the plugin runs)
- `PLUGIN_API_KEY` must match the key in your plugin's `config.yml` (see Part 3)
- Use a secure random string for the API key (e.g., generate with `openssl rand -base64 32`)

### Step 2: Regenerate Prisma Client

**CRITICAL:** After updating the schema, regenerate the Prisma client:

```bash
cd website
npx prisma generate
```

This fixes all TypeScript errors related to the new fields.

### Step 3: Push Schema to Database (Alternative)

If you prefer using Prisma to manage migrations:

```bash
npx prisma db push
```

### Step 4: Install Dependencies & Build

```bash
npm install
npm run build
```

### Step 5: Start Production Server

```bash
npm start
```

Or deploy to Vercel/Netlify as usual.

---

## 🎮 Part 3: Minecraft Plugin Setup

### Step 1: Configure the Plugin

Edit `plugin/src/main/resources/config.yml`:

```yaml
database:
  host: ddns.tsvweb.com
  port: 3306
  database: minecraft_auth
  username: authuser
  password: StrongPasswordHere
  pool-size: 10

registration:
  website-url: https://mc-verify.tsvweb.co.uk
  token-expiry-minutes: 30

# HTTP API Server Configuration
api:
  port: 8080
  secret-key: generate-secure-random-key-here  # MUST MATCH .env PLUGIN_API_KEY

# Discord Webhook for Reports
discord:
  webhook-url: https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
```

**⚠️ Security Notes:**
- `api.secret-key` MUST match `PLUGIN_API_KEY` in your website `.env`
- Port `8080` must be open on your server firewall
- Discord webhook is optional but recommended for report notifications

### Step 2: Build the Plugin

```bash
cd plugin
mvn clean package
```

The compiled JAR will be in `plugin/target/MinecraftAuth-1.0.0.jar`

### Step 3: Install the Plugin

1. Copy `MinecraftAuth-1.0.0.jar` to your server's `plugins/` folder
2. Restart the server
3. Verify the plugin loaded:

```
[INFO]: [MinecraftAuth] MinecraftAuth has been enabled!
[INFO]: HTTP API server started on port 8080
[INFO]: Database connection established successfully!
```

### Step 4: Configure Firewall

Open port 8080 for the HTTP API (internal only, not public):

```bash
# If using UFW (Ubuntu/Debian)
sudo ufw allow from YOUR_WEBSITE_SERVER_IP to any port 8080

# Or allow from localhost only if website is on same server
sudo ufw allow 8080
```

---

## 🔧 Part 4: How Plugin API Works

### The Flow

1. Admin clicks "Kick" or "Ban" on the website admin panel
2. Website sends HTTP POST to `http://YOUR_SERVER_IP:8080/api/kick` or `/api/ban`
3. Request includes `X-API-Key` header with the secret key
4. Plugin validates the API key
5. Plugin executes the kick/ban command on the main thread
6. Plugin kicks the player or stores the ban in the database

### Testing the API

Test manually with curl:

```bash
# Test kick
curl -X POST http://YOUR_SERVER_IP:8080/api/kick \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{"username": "TestPlayer"}'

# Test ban
curl -X POST http://YOUR_SERVER_IP:8080/api/ban \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key" \
  -d '{"username": "TestPlayer", "reason": "Test ban"}'
```

Expected response:
```json
{"success": true, "message": "Player kicked"}
```

---

## 🎨 Part 5: Features Summary

### New Features Implemented

1. **Homepage**
   - Updated to "Streetly SMP — Hosted & Sponsored by TSVWEB.CO.UK"
   - Mobile-responsive design
   - Better color contrast

2. **Dashboard** (`/dashboard`)
   - Player profile with IGN, real name, email, year group, rank color
   - Password change functionality
   - Logout button
   - Admin panel access (if admin)

3. **Admin Panel** (`/admin`)
   - Two tabs: Players & Reports
   - **Players Tab:**
     - View all registered players
     - Search by username, name, or email
     - Kick players
     - Temporary or permanent bans
   - **Reports Tab:**
     - View all player reports
     - See reporter, reported player, description, and date
     - Mark reports as resolved or dismissed
     - Search reports

4. **Automatic Year Group Calculation**
   - Email format: `20-tsvetanov-k@thestreetlyacademy.co.uk`
   - `20` = started in 2020
   - Formula: Current Year - Start Year = Years Passed
   - Year 7 + Years Passed = Current Year Group
   - Adjusts for September school year rollover

5. **Rank Colors**
   - Year 7 = Yellow (`§e`)
   - Year 8 = Green (`§a`)
   - Year 9 = Red (`§c`)
   - Year 10 = Blue (`§9`)
   - Year 11 = Purple (`§5`)
   - Year 12 = Orange (`§6`)
   - Year 13 = Orange (`§6`)

6. **In-Game Features**
   - Display names: `§6K. Tsvetanov (krisi12_)`
   - Tab list shows colored names
   - Ban system with database persistence
   - `/report <player> <description>` command
   - Discord webhook notifications for reports

---

## 🚀 Part 6: Post-Deployment Checklist

- [ ] Database migration completed
- [ ] Prisma client regenerated (`npx prisma generate`)
- [ ] Website `.env` configured with correct API URL and key
- [ ] Plugin `config.yml` configured with matching API key
- [ ] Plugin compiled and installed
- [ ] HTTP API port (8080) accessible from website server
- [ ] Discord webhook URL added (optional)
- [ ] Admin user verified: `20-tsvetanov-k@thestreetlyacademy.co.uk`
- [ ] Test kick/ban functionality from admin panel
- [ ] Test `/report` command in-game
- [ ] Verify rank colors appear correctly in-game

---

## 🛠️ Troubleshooting

### "Property 'isAdmin' does not exist"
**Solution:** Run `npx prisma generate` in the website directory

### "Connection refused to port 8080"
**Solution:** Check firewall rules, ensure plugin is running, verify API server started

### "Unauthorized" when testing kick/ban
**Solution:** Verify `PLUGIN_API_KEY` in `.env` matches `api.secret-key` in `config.yml`

### Year group calculation wrong
**Solution:** Check current date/month. Remember the September rollover logic.

### Reports not showing in admin panel
**Solution:** Verify database tables were created. Run the migration script.

---

## 📞 Support

For issues:
1. Check server logs: `logs/latest.log`
2. Check plugin logs in console
3. Verify database connectivity
4. Test API endpoints manually with curl

---

**Deployment Complete! 🎉**

Your Streetly SMP server now has:
- Full authentication system
- Admin dashboard with kick/ban controls
- Player report system
- Automatic year group detection
- Colored rank names in-game
