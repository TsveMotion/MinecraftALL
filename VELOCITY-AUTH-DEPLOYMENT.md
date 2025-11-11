# Velocity Authentication System - Complete Deployment Guide

This guide provides step-by-step instructions for deploying the complete authentication system for your Minecraft network.

## Architecture Overview

```
Player → Velocity Proxy (VelocityAuthPlugin + LuckPerms)
         ↓
         ├─→ Lobby Server (LuckPerms) [Default spawn]
         └─→ Survival Server (LuckPerms) [Restricted to verified players]
         
Web System (Next.js) ↔ RCON ↔ Velocity Proxy (Updates LuckPerms groups)
```

## Prerequisites

- **Velocity Proxy** (3.3.0+)
- **Paper/Spigot servers** (1.20.4+) for Lobby and Survival
- **MySQL/MariaDB** database (for LuckPerms sync)
- **Node.js** (18+) for web system
- **Maven** (3.8+) for building plugins
- **Java 17+** runtime

## Part 1: Build the Velocity Plugin

### Step 1: Navigate to Plugin Directory

```bash
cd VelocityAuthPlugin
```

### Step 2: Build with Maven

```bash
mvn clean package
```

This will create `VelocityAuthPlugin-1.0.0.jar` in the `target/` directory.

### Step 3: Verify Build

Check that the file exists:

```bash
ls target/VelocityAuthPlugin-1.0.0.jar
```

**Expected Output:**
- File size: ~15-25 KB
- No build errors in Maven output

## Part 2: Install LuckPerms on All Servers

### On Velocity Proxy

1. Download LuckPerms for Velocity:
   ```bash
   wget https://download.luckperms.net/1541/velocity/LuckPerms-Velocity-5.4.131.jar
   ```

2. Place in Velocity plugins folder:
   ```bash
   cp LuckPerms-Velocity-5.4.131.jar /path/to/velocity/plugins/
   ```

3. Start Velocity to generate config:
   ```bash
   cd /path/to/velocity
   ./start.sh
   ```

4. Stop Velocity after config generation:
   ```
   end
   ```

5. Edit LuckPerms config:
   ```bash
   nano plugins/LuckPerms/config.yml
   ```

   Update storage settings:
   ```yaml
   storage-method: mysql
   
   data:
     address: localhost:3306
     database: luckperms
     username: luckperms_user
     password: your_secure_password
     
   messaging-service: sql
   ```

### On Lobby Server (Paper/Spigot)

1. Download LuckPerms for Bukkit:
   ```bash
   wget https://download.luckperms.net/1541/bukkit/LuckPerms-Bukkit-5.4.131.jar
   ```

2. Place in server plugins folder:
   ```bash
   cp LuckPerms-Bukkit-5.4.131.jar /path/to/lobby/plugins/
   ```

3. Configure the same way as Velocity (use SAME MySQL database)

### On Survival Server (Paper/Spigot)

Repeat the same process as Lobby server.

**CRITICAL:** All servers must use the **SAME MySQL database** for permissions to sync.

## Part 3: Configure MySQL Database

### Create Database and User

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE luckperms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'luckperms_user'@'%' IDENTIFIED BY 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON luckperms.* TO 'luckperms_user'@'%';

-- Apply changes
FLUSH PRIVILEGES;

-- Exit
exit;
```

### Test Connection

From each server, test MySQL connectivity:

```bash
mysql -h localhost -u luckperms_user -p luckperms
```

If successful, you'll see the MySQL prompt.

## Part 4: Install VelocityAuthPlugin

### Step 1: Copy Plugin to Velocity

```bash
cp VelocityAuthPlugin/target/VelocityAuthPlugin-1.0.0.jar /path/to/velocity/plugins/
```

### Step 2: Start Velocity

```bash
cd /path/to/velocity
./start.sh
```

### Step 3: Verify Plugin Loaded

Check console output for:

```
[VelocityAuthPlugin] VelocityAuthPlugin is initializing...
[VelocityAuthPlugin] LuckPerms API loaded successfully!
[VelocityAuthPlugin] VelocityAuthPlugin has been enabled successfully!
[VelocityAuthPlugin] Unverified players will be restricted to: lobby
```

### Step 4: Configure Plugin

The plugin will create `plugins/velocityauthplugin/config.properties`.

Edit it:

```bash
nano plugins/velocityauthplugin/config.properties
```

```properties
# Name of your lobby server (must match velocity.toml)
lobby-server-name=lobby

# URL where players register/login
website-url=https://play.streetlymc.com/register
```

**Important:** The `lobby-server-name` must EXACTLY match the server name in `velocity.toml`:

```toml
[servers]
  lobby = "127.0.0.1:25566"
  survival = "127.0.0.1:25567"
```

In this example, use `lobby-server-name=lobby`.

### Step 5: Reload Configuration

```
/velocity reload
```

Or restart Velocity:

```bash
./start.sh
```

## Part 5: Configure LuckPerms Groups

See the complete guide in `LUCKPERMS-SETUP.md`.

### Quick Setup (Essential Commands Only)

Run these on the Velocity console:

```bash
# Create groups
/lp creategroup unverified
/lp creategroup verified

# Configure unverified group
/lp group unverified permission set auth.verified false
/lp group unverified setweight 1

# Configure verified group (CRITICAL PERMISSION)
/lp group verified permission set auth.verified true
/lp group verified permission set velocity.command.server true
/lp group verified setweight 10

# Set default group for new players
/lp defaultassignments add unverified
```

## Part 6: Configure Velocity Settings

### Enable RCON (for web system integration)

Edit `velocity.toml`:

```toml
[query]
enabled = true
port = 25577

# Add this section if not present
[rcon]
enabled = true
bind = "0.0.0.0:25575"
password = "your_secure_rcon_password"
```

**Security Note:** Use a strong RCON password and consider using `127.0.0.1` instead of `0.0.0.0` if the web server is on the same machine.

### Configure Server Order

Ensure lobby is the default server:

```toml
[servers]
  lobby = "127.0.0.1:25566"
  survival = "127.0.0.1:25567"

# Set lobby as default
try = ["lobby", "survival"]
```

### Configure Forced Hosts (Optional)

```toml
[forced-hosts]
  "play.streetlymc.com" = ["lobby"]
  "lobby.streetlymc.com" = ["lobby"]
  "survival.streetlymc.com" = ["survival"]
```

## Part 7: Configure Lobby Server Restrictions

To prevent unverified players from using lobby features (portals, NPCs) to bypass restrictions:

### Install Essential Plugins on Lobby

1. **EssentialsX** - For basic commands
2. **WorldGuard** - For region protection
3. **DeluxeHub** or similar - For lobby features

### Restrict Portals

In `plugins/Essentials/config.yml`:

```yaml
# Disable portal creation/usage for unverified players
player-commands:
  - home
  - sethome
  - spawn
  
# Don't allow bed spawns
update-bed-at-daytime: false
spawn-on-join: true
respawn-at-home: false
```

### Set Up Permissions

Grant only basic permissions to unverified players on lobby:

```bash
# On lobby server console
/lp group unverified permission set essentials.spawn true
/lp group unverified permission set essentials.afk true

# Deny everything else
/lp group unverified permission set minecraft.command.* false
/lp group unverified permission set essentials.back false
/lp group unverified permission set essentials.warp false
```

### Protect Against Server Selector GUIs

If you use a server selector plugin (like ServerSelector, HubCommand, etc.), ensure unverified players can't use it:

```bash
# Deny GUI access
/lp group unverified permission set serverselector.use false
/lp group unverified permission set hubcommand.use false

# Grant to verified
/lp group verified permission set serverselector.use true
/lp group verified permission set hubcommand.use true
```

## Part 8: Configure Web System Integration

### Update Environment Variables

Edit `website/.env`:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/minecraft_auth"

# Redis (for sessions)
REDIS_HOST="localhost"
REDIS_PORT=6379

# RCON Configuration
RCON_HOST="localhost"
RCON_PORT=25575
RCON_PASSWORD="your_secure_rcon_password"

# Server Configuration
MINECRAFT_SERVER_HOST="play.streetlymc.com"
MINECRAFT_SERVER_PORT=25565

# Website URL
NEXT_PUBLIC_WEBSITE_URL="https://play.streetlymc.com"
```

### Update Registration API to Grant Verified Status

The web system should already have RCON integration. Verify it's working:

Check `website/src/app/api/register/route.ts` or similar for RCON code:

```typescript
import { Rcon } from 'rcon-client';

async function verifyPlayerOnServer(minecraftUsername: string) {
  try {
    const rcon = await Rcon.connect({
      host: process.env.RCON_HOST || 'localhost',
      port: parseInt(process.env.RCON_PORT || '25575'),
      password: process.env.RCON_PASSWORD || ''
    });

    // Grant verified status
    await rcon.send(`lp user ${minecraftUsername} parent add verified`);
    await rcon.send(`lp user ${minecraftUsername} parent remove unverified`);

    await rcon.end();
    return true;
  } catch (error) {
    console.error('RCON error:', error);
    return false;
  }
}
```

Ensure this function is called after successful registration/login.

## Part 9: Testing the System

### Test 1: New Player Flow (Unverified)

1. Join the server with a new Minecraft account (not registered)
2. You should spawn in the lobby
3. Try to run `/server survival`
   - **Expected:** Blocked with friendly message
4. Try to run `/server lobby`
   - **Expected:** Should work (or just reload lobby)
5. Check console logs:
   - **Expected:** `[VelocityAuthPlugin] Blocked unverified player <username> from using /server command`

### Test 2: Registration Flow

1. Visit your website: `https://play.streetlymc.com/register`
2. Register with your Minecraft username
3. Complete registration
4. Check Velocity console:
   - **Expected:** RCON command execution logs
5. In-game, run `/server survival`
   - **Expected:** Should now work!

### Test 3: Permission Verification

From Velocity console:

```bash
# Check if player is verified
/lp user <username> permission check auth.verified

# Should show: true ✔
```

### Test 4: Manual Verification (Troubleshooting)

If a player can't connect after registration:

```bash
# Manually grant verified status
/lp user <username> parent add verified
/lp user <username> parent remove unverified

# Sync changes
/lp sync

# Have player disconnect and reconnect
```

## Part 10: Deploy the New Homepage

### Replace Current Homepage

Option 1 - Direct replacement:

```bash
cd website/src/app
mv page.tsx page_old_backup.tsx
mv new_page.tsx page.tsx
```

Option 2 - Test first then replace:

1. Access `https://yoursite.com/new_page` to test
2. Once satisfied, rename as above

### Rebuild and Deploy Website

```bash
cd website
npm run build
npm start
```

Or if using PM2:

```bash
pm2 restart website
```

## Part 11: Maintenance and Monitoring

### Check Plugin Status

```bash
# On Velocity console
/velocity plugins

# Should show:
# - LuckPerms (enabled)
# - VelocityAuthPlugin (enabled)
```

### Monitor Logs

```bash
# Velocity logs
tail -f /path/to/velocity/logs/latest.log

# Look for:
# - Plugin load messages
# - RCON connections
# - Blocked player attempts
```

### Database Backup

Regular backups of LuckPerms database:

```bash
# Backup MySQL database
mysqldump -u luckperms_user -p luckperms > luckperms_backup_$(date +%Y%m%d).sql
```

### Update Plugin

To update VelocityAuthPlugin:

1. Make code changes
2. Rebuild: `mvn clean package`
3. Replace JAR: `cp target/VelocityAuthPlugin-1.0.0.jar /path/to/velocity/plugins/`
4. Reload: `/velocity reload` or restart Velocity

## Troubleshooting

### Issue: Plugin Not Loading

**Symptoms:** Plugin doesn't appear in `/velocity plugins`

**Solutions:**
1. Check Java version: `java -version` (must be 17+)
2. Check file permissions: `ls -la plugins/VelocityAuthPlugin-1.0.0.jar`
3. Check Velocity logs for errors
4. Verify LuckPerms is loaded first

### Issue: Players Can Switch Despite Being Unverified

**Symptoms:** Unverified players can access survival

**Solutions:**
1. Check player's group: `/lp user <username> info`
2. Check permission: `/lp user <username> permission check auth.verified`
3. Verify plugin config: `nano plugins/velocityauthplugin/config.properties`
4. Check for permission bypass: `/lp group unverified permission check *`

### Issue: RCON Commands Not Working

**Symptoms:** Web registration doesn't grant verified status

**Solutions:**
1. Test RCON connection:
   ```bash
   npm install -g rcon-cli
   rcon -H localhost -p 25575 -P your_password "lp"
   ```
2. Check RCON config in `velocity.toml`
3. Verify firewall allows port 25575
4. Check web system logs for RCON errors

### Issue: Permissions Not Syncing Between Servers

**Symptoms:** Changes on Velocity don't appear on Lobby/Survival

**Solutions:**
1. Verify all servers use SAME MySQL database
2. Check `storage-method` in all LuckPerms configs
3. Use `/lp sync` to force sync
4. Restart all servers
5. Check MySQL connection from each server

### Issue: Players Stuck in Lobby After Verification

**Symptoms:** Verified players still can't switch servers

**Solutions:**
1. Have player disconnect and reconnect
2. Check `/lp user <username> permission check auth.verified` - should be `true`
3. Force update: `/lp user <username> parent set verified`
4. Clear cache: `/lp user <username> clear`

## Security Checklist

- [ ] RCON password is strong and unique
- [ ] RCON bind is set to `127.0.0.1` if web server is on same machine
- [ ] MySQL uses strong password
- [ ] MySQL user has only necessary privileges
- [ ] Firewall rules restrict RCON port access
- [ ] Website uses HTTPS
- [ ] Database connection strings not exposed in public code
- [ ] Regular backups configured
- [ ] LuckPerms admin commands restricted to authorized users

## Performance Optimization

### Enable LuckPerms Caching

In `plugins/LuckPerms/config.yml`:

```yaml
cache:
  enabled: true
  sync-minutes: 3
```

### Optimize MySQL

```sql
-- Add indexes to LuckPerms tables
USE luckperms;
SHOW TABLES;

-- Optimize tables periodically
OPTIMIZE TABLE luckperms_players;
OPTIMIZE TABLE luckperms_groups;
OPTIMIZE TABLE luckperms_actions;
```

## Additional Features (Optional)

### Add Discord Integration

Notify Discord when players register:

1. Install Discord webhook plugin
2. Configure webhook URL
3. Send message on verification

### Add Verification Rewards

Give players a reward on first verification:

```bash
# In your RCON command after verification
lp user ${username} parent add verified
lp user ${username} parent remove unverified
give ${username} diamond 5
```

### Add Verification Status to Scoreboard

On lobby server, use a scoreboard plugin to show verification status.

## Complete File Structure

```
MinecraftALL/
├── VelocityAuthPlugin/
│   ├── pom.xml
│   ├── src/
│   │   └── main/
│   │       ├── java/com/streetlysmp/velocityauth/
│   │       │   ├── VelocityAuthPlugin.java
│   │       │   ├── ServerSwitchListener.java
│   │       │   └── PluginConfig.java
│   │       └── resources/
│   │           └── velocity-plugin.json
│   └── target/
│       └── VelocityAuthPlugin-1.0.0.jar
│
├── website/
│   └── src/
│       └── app/
│           ├── page.tsx (old)
│           └── new_page.tsx (premium version)
│
├── LUCKPERMS-SETUP.md
└── VELOCITY-AUTH-DEPLOYMENT.md (this file)
```

## Support and Documentation

- **Velocity Docs:** https://velocitypowered.com/
- **LuckPerms Docs:** https://luckperms.net/
- **Paper Docs:** https://docs.papermc.io/

---

## Quick Start Summary

```bash
# 1. Build plugin
cd VelocityAuthPlugin && mvn clean package

# 2. Install on Velocity
cp target/VelocityAuthPlugin-1.0.0.jar /path/to/velocity/plugins/

# 3. Setup LuckPerms (see LUCKPERMS-SETUP.md)
/lp creategroup unverified
/lp creategroup verified
/lp group verified permission set auth.verified true

# 4. Configure plugin
nano /path/to/velocity/plugins/velocityauthplugin/config.properties

# 5. Restart Velocity
/path/to/velocity/start.sh

# 6. Test
# Join as unverified player → Should be blocked from /server survival ✓
# Register on website → Should gain access ✓
```

**You're all set! Your authentication system is now live! 🎉**
