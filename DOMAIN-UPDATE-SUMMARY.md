# ✅ Domain Update Complete - streetlymc.com

## 🎯 Summary

All references to the old domain have been updated to **streetlymc.com** and **play.streetlymc.com**.

---

## 📝 Changes Made

### 1. Plugin Configuration Files
- ✅ `plugin/src/main/resources/config.yml`
  - Updated `registration.website-url` to `https://streetlymc.com`
  
- ✅ `plugin/src/main/java/uk/co/tsvweb/minecraftroles/config/PluginConfig.java`
  - Updated default API base URL to `https://streetlymc.com`
  
- ✅ `plugin/src/main/java/com/minecraftauth/commands/LinksCommand.java`
  - Updated website link to `https://streetlymc.com`
  - Updated server address to `play.streetlymc.com`
  - Changed "Hosted By" section to show Minecraft server info

### 2. Website Files
- ✅ `website/src/app/page.tsx`
  - Updated SERVER_IP constant to `play.streetlymc.com`

### 3. Documentation
- ✅ `DEPLOYMENT-GUIDE.md`
  - Updated environment variable examples with new domains
  
- ✅ `ROLES-SYSTEM-SETUP.md`
  - Updated all domain references in configuration examples

### 4. New Documentation
- ✅ Created `VELOCITY-DEPLOYMENT-GUIDE.md`
  - Complete guide for Velocity proxy deployment
  - LuckPerms integration instructions
  - Step-by-step setup for multi-server environment

---

## 🏗️ How to Build and Upload the Plugin

### Step 1: Build the Plugin

```bash
# Navigate to plugin directory
cd plugin

# Build with Maven
mvn clean package

# The compiled JAR will be in:
# plugin/target/MinecraftAuth-1.0.0.jar
```

### Step 2: Upload to Servers

Since you're using **Velocity with 2 backend servers (Lobby + Survival)**, you need to install the plugin on **BOTH backend servers**:

```bash
# Copy to Lobby server
cp plugin/target/MinecraftAuth-1.0.0.jar /path/to/lobby-server/plugins/

# Copy to Survival server
cp plugin/target/MinecraftAuth-1.0.0.jar /path/to/survival-server/plugins/
```

**⚠️ IMPORTANT**: Do **NOT** install the plugin on the Velocity proxy itself. It must go on the Paper/Spigot backend servers.

### Step 3: Configure Each Server

**On BOTH servers**, edit `plugins/MinecraftAuth/config.yml`:

```yaml
database:
  host: ddns.tsvweb.com
  port: 3306
  database: minecraft_auth
  username: authuser
  password: StrongPasswordHere
  pool-size: 10

registration:
  website-url: https://streetlymc.com
  token-expiry-minutes: 30
  pin-expiry-minutes: 30

# HTTP API Server - ONLY ENABLE ON ONE SERVER (Survival recommended)
api:
  port: 8080
  secret-key: UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/

# LuckPerms Integration
luckperms:
  enabled: true
  verified-group: "verified"
  auto-assign: true

discord:
  webhook-url: DISCORD_WEBHOOK_URL_HERE
```

**For the Lobby server**: Comment out or remove the `api:` section to disable the HTTP API server. Only ONE server should run the API.

### Step 4: Restart Servers

```bash
# Restart both backend servers
# Lobby
# Survival
```

---

## 🔑 LuckPerms Integration

### Setting Up the "verified" Group

Your plugin will automatically assign the **"verified"** group to players after they successfully authenticate.

**On any server, run these commands**:

```bash
# Create the verified group
lp creategroup verified

# Set display name (shows in chat/tab)
lp group verified setdisplayname "&a[Verified] "

# Give basic permissions
lp group verified permission set minecraft.command.msg true
lp group verified permission set minecraft.command.tell true

# Set priority (higher = more important)
lp group verified setweight 10
```

### LuckPerms Shared Database Configuration

**CRITICAL**: All servers (Velocity + Lobby + Survival) must use the **SAME** LuckPerms database.

**Edit `config.yml` in LuckPerms folder on ALL servers**:

```yaml
storage-method: mysql

data:
  address: ddns.tsvweb.com:3306
  database: luckperms
  username: authuser
  password: StrongPasswordHere

messaging-service: sql
sync-minutes: 3
```

This ensures permissions sync across all servers in real-time.

---

## 🌐 Website Configuration

### Update Your .env File

In your website directory (`website/.env`), ensure these are set:

```env
# Database
DATABASE_URL="mysql://authuser:StrongPasswordHere@ddns.tsvweb.com:3306/minecraft_auth"

# Site URLs
NEXT_PUBLIC_SITE_URL=https://streetlymc.com
NEXT_PUBLIC_MINECRAFT_SERVER=play.streetlymc.com

# JWT and API Secrets
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_minimum_32_chars
API_SHARED_SECRET=your_shared_secret_for_plugin_to_app_communication_change_this

# RCON Configuration (for live server status)
RCON_HOST=play.streetlymc.com
RCON_PORT=25575
RCON_PASSWORD=your_rcon_password
RCON_TIMEOUT_MS=1500

# Plugin API
PLUGIN_API_URL=http://YOUR_SERVER_IP:8080
PLUGIN_API_KEY=UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/
```

### Rebuild Website

```bash
cd website
npm install
npx prisma generate
npm run build
npm start
```

---

## 🎮 Server Architecture

```
Player connects to: play.streetlymc.com
                    ↓
            Velocity Proxy (Port 25577)
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
  Lobby Server            Survival Server
  (Port 25566)            (Port 25567)
  - MinecraftAuth         - MinecraftAuth
  - LuckPerms             - LuckPerms
  - NO API                - HTTP API (8080)
```

### Port Configuration

- **25577**: Velocity (public - players connect here)
- **25566**: Lobby backend (internal - not exposed)
- **25567**: Survival backend (internal - not exposed)
- **8080**: HTTP API (internal - for website communication)

---

## 🧪 Testing the Setup

### 1. Test Player Registration

```
1. Connect to play.streetlymc.com
2. Type: /register
3. Click link (Java) or enter PIN (Bedrock)
4. Complete registration at https://streetlymc.com
5. Return to game and type: /login <password>
```

### 2. Verify "verified" Group Assignment

```bash
# In-game command
/lp user <your-username> info

# Should show: Group: verified
```

### 3. Test Server Switching

```
1. Login on Lobby server
2. Switch to Survival server
3. Your authentication and permissions should persist
```

### 4. Test Website API

```bash
# Test kick API (from your website server)
curl -X POST http://YOUR_SERVER_IP:8080/api/kick \
  -H "Content-Type: application/json" \
  -H "X-API-Key: UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/" \
  -d '{"username": "TestPlayer"}'
```

---

## 📊 Verification Checklist

- [ ] Plugin built successfully (`MinecraftAuth-1.0.0.jar`)
- [ ] Plugin installed on BOTH Lobby and Survival servers
- [ ] HTTP API enabled on ONE server only (Survival)
- [ ] LuckPerms installed on Velocity, Lobby, and Survival
- [ ] LuckPerms configured with shared MySQL database
- [ ] "verified" group created in LuckPerms
- [ ] Website `.env` updated with new domains
- [ ] Website rebuilt and deployed
- [ ] Tested player registration and login
- [ ] Verified automatic group assignment
- [ ] Tested cross-server permission sync

---

## 🆘 Troubleshooting

### Plugin Not Loading

**Check**:
- Server is running Paper/Spigot 1.20+
- Plugin is in the `plugins/` folder
- Check console for errors: `[MinecraftAuth]`

### Players Not Getting "verified" Group

**Check**:
- LuckPerms is installed and running
- "verified" group exists: `/lp group list`
- Plugin config has `luckperms.enabled: true`
- Check console for LuckPerms integration messages

### API Not Accessible

**Check**:
- API is enabled in config.yml (on ONE server)
- Port 8080 is open: `sudo ufw status`
- Test locally: `curl http://localhost:8080/api/test`
- Firewall allows connection from website server

### Permissions Not Syncing Across Servers

**Check**:
- All servers use SAME LuckPerms database
- `messaging-service: sql` is set in LuckPerms config
- Force sync: `/lp sync`

---

## 📚 Additional Resources

- **Full Velocity Guide**: See `VELOCITY-DEPLOYMENT-GUIDE.md`
- **Roles System**: See `ROLES-SYSTEM-SETUP.md`
- **General Deployment**: See `DEPLOYMENT-GUIDE.md`

---

## 🎉 You're All Set!

Your Streetly SMP server is now configured with:
- ✅ New domain: **streetlymc.com**
- ✅ Server address: **play.streetlymc.com**
- ✅ Velocity proxy with multi-server support
- ✅ LuckPerms integration with automatic "verified" role
- ✅ Full authentication system
- ✅ Shared permissions database

**Need Help?**
- Check the troubleshooting sections
- Review server console logs
- Verify database connectivity
- Test each component individually

---

**Last Updated**: November 11, 2025  
**Domain**: streetlymc.com  
**Server**: play.streetlymc.com
