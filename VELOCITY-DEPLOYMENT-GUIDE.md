# Velocity Proxy Deployment Guide for Streetly SMP

This guide covers deploying the MinecraftAuth plugin to a **Velocity proxy** with multiple backend servers (Lobby + Survival) and integrating with **LuckPerms** for permissions management.

---

## 🎯 Overview

### Your Setup:
- **Proxy**: Velocity (handles player connections)
- **Backend Servers**: 
  - Lobby server
  - Survival server
- **Permissions**: LuckPerms with shared MySQL database
- **Domain**: `play.streetlymc.com`
- **Website**: `https://streetlymc.com`

### Architecture:
```
Player → Velocity Proxy (play.streetlymc.com)
           ├── Lobby Server
           └── Survival Server
                 └── LuckPerms (shared database)
```

---

## 📦 Part 1: Where to Install the Plugins

### Authentication Plugin (MinecraftAuth)

**Install on**: **BOTH Lobby and Survival servers** (NOT on Velocity)

**Why?**
- The authentication plugin needs to run on **Paper/Spigot servers**, not the proxy
- Players must authenticate regardless of which server they're on
- The HTTP API server (port 8080) should run on one backend server

**Steps:**

1. **Build the plugin** (if not already built):
   ```bash
   cd plugin
   mvn clean package
   ```

2. **Copy to BOTH backend servers**:
   ```bash
   # Copy to Lobby server
   cp plugin/target/MinecraftAuth-1.0.0.jar /path/to/lobby/plugins/

   # Copy to Survival server
   cp plugin/target/MinecraftAuth-1.0.0.jar /path/to/survival/plugins/
   ```

3. **Configure the plugin** on each server:
   
   **File**: `plugins/MinecraftAuth/config.yml` (on both servers)
   
   ```yaml
   # MinecraftAuth Configuration

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

   # HTTP API Server Configuration
   # IMPORTANT: Only enable this on ONE server (recommend Survival)
   api:
     port: 8080
     secret-key: UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/

   # Discord Webhook for Reports
   discord:
     webhook-url: DISCORD_WEBHOOK_URL_HERE

   # LuckPerms Integration
   luckperms:
     enabled: true
     verified-group: "verified"  # Group to assign after verification
     auto-assign: true

   messages:
     must-register: "&cYou must register an account to play."
     register-command-info: "&eType &a/register &eto receive your registration link."
     registration-link: "&aClick here to register: &b{link}"
     token-generated: "&aRegistration link generated! Check your chat."
     already-registered: "&cYou are already registered. Use &e/login <password> &cor &e/login <pin>"
     login-success: "&aSuccessfully logged in! Welcome back."
     login-failed: "&cIncorrect password. Please try again."
     not-registered: "&cYou are not registered. Use &e/register &cfirst."
     action-blocked: "&cYou must login first! Use &e/login <password> &cor &e/login <pin>"
     usage-login: "&eUsage: &a/login <password> &eor &a/login <pin>"
     config-reloaded: "&aConfiguration reloaded successfully."
     
     # Bedrock-specific messages
     bedrock-pin-generated: "&aYour PIN: &e{pin}"
     bedrock-register-instructions: "&e1. Click the popup button to open registration\n&e2. Enter your PIN on the website\n&e3. Set your password\n&e4. Use /login <password> or /login <pin>"
     bedrock-pin-expired: "&cYour PIN has expired. Use &e/register &cto get a new one."
     pin-login-success: "&aLogged in with PIN! Next time use /login <password>"
   ```

   **⚠️ IMPORTANT**: 
   - Only run the HTTP API server (port 8080) on **ONE** backend server (e.g., Survival)
   - To disable the API on Lobby, comment out the `api:` section in that server's config

---

## 🔑 Part 2: LuckPerms Setup

### Step 1: Install LuckPerms

**Install on**: **ALL servers** (Velocity + Lobby + Survival)

1. **Download LuckPerms**:
   - Velocity version: https://luckperms.net/download
   - Bukkit version: https://luckperms.net/download

2. **Install on each server**:
   ```bash
   # Velocity
   cp LuckPerms-Velocity-*.jar /path/to/velocity/plugins/

   # Lobby
   cp LuckPerms-Bukkit-*.jar /path/to/lobby/plugins/

   # Survival
   cp LuckPerms-Bukkit-*.jar /path/to/survival/plugins/
   ```

### Step 2: Configure Shared MySQL Database

**Edit** `config.yml` in LuckPerms folder on **ALL THREE SERVERS**:

```yaml
# LuckPerms Configuration
storage-method: mysql

data:
  address: ddns.tsvweb.com:3306
  database: luckperms
  username: authuser
  password: StrongPasswordHere
  
  # Recommended settings for multi-server setup
  pool-settings:
    maximum-pool-size: 10
    minimum-idle: 10
    maximum-lifetime: 1800000
    connection-timeout: 5000

# Enable messaging service for real-time sync
messaging-service: sql

# Sync data every 3 minutes
sync-minutes: 3
```

**⚠️ CRITICAL**: All three servers (Velocity, Lobby, Survival) must use the **SAME database** for permissions to sync across servers.

### Step 3: Create the "verified" Group

On **any server** (recommend Survival), run these commands:

```bash
# Create the verified group
lp creategroup verified

# Set the display name
lp group verified setdisplayname "&a[Verified] "

# Give basic permissions
lp group verified permission set minecraft.command.msg true
lp group verified permission set minecraft.command.tell true
lp group verified permission set essentials.spawn true

# Set group priority (higher number = more important)
lp group verified setweight 10

# Make default group lower priority
lp group default setweight 0
```

### Step 4: Add LuckPerms Integration to Plugin

The plugin needs to automatically add players to the "verified" group after successful login.

**Create this file**: `plugin/src/main/java/com/minecraftauth/listeners/LoginListener.java`

```java
package com.minecraftauth.listeners;

import com.minecraftauth.MinecraftAuthPlugin;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.Node;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerLoginEvent;

public class LoginListener implements Listener {
    
    private final MinecraftAuthPlugin plugin;
    private LuckPerms luckPerms;
    
    public LoginListener(MinecraftAuthPlugin plugin) {
        this.plugin = plugin;
        
        // Get LuckPerms API
        var provider = Bukkit.getServicesManager().getRegistration(LuckPerms.class);
        if (provider != null) {
            this.luckPerms = provider.getProvider();
            plugin.getLogger().info("LuckPerms integration enabled!");
        } else {
            plugin.getLogger().warning("LuckPerms not found! Group assignment will not work.");
        }
    }
    
    @EventHandler
    public void onPlayerLogin(PlayerLoginEvent event) {
        Player player = event.getPlayer();
        String username = player.getName();
        
        // Check if player is verified in database
        if (plugin.getDatabaseManager().isPlayerVerified(username)) {
            // Add player to verified group
            addVerifiedGroup(player);
        }
    }
    
    private void addVerifiedGroup(Player player) {
        if (luckPerms == null) return;
        
        // Run async to avoid blocking the main thread
        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            User user = luckPerms.getUserManager().getUser(player.getUniqueId());
            if (user == null) {
                plugin.getLogger().warning("Could not get LuckPerms user for " + player.getName());
                return;
            }
            
            // Check if player already has verified group
            boolean hasVerified = user.getNodes().stream()
                .anyMatch(node -> node.getKey().equals("group.verified"));
            
            if (!hasVerified) {
                // Add verified group node
                Node node = Node.builder("group.verified").build();
                user.data().add(node);
                
                // Save changes
                luckPerms.getUserManager().saveUser(user);
                
                plugin.getLogger().info("Added " + player.getName() + " to verified group!");
                
                // Send confirmation message to player
                Bukkit.getScheduler().runTask(plugin, () -> {
                    player.sendMessage("§a✓ You have been added to the verified group!");
                });
            }
        });
    }
}
```

**Register the listener** in `MinecraftAuthPlugin.java`:

```java
@Override
public void onEnable() {
    // ... existing code ...
    
    // Register LuckPerms integration listener
    if (getConfig().getBoolean("luckperms.enabled", true)) {
        getServer().getPluginManager().registerEvents(new LoginListener(this), this);
    }
    
    // ... existing code ...
}
```

**Add LuckPerms dependency** to `pom.xml`:

```xml
<dependencies>
    <!-- Existing dependencies... -->
    
    <!-- LuckPerms API -->
    <dependency>
        <groupId>net.luckperms</groupId>
        <artifactId>api</artifactId>
        <version>5.4</version>
        <scope>provided</scope>
    </dependency>
</dependencies>

<repositories>
    <!-- Existing repositories... -->
    
    <repository>
        <id>luckperms</id>
        <url>https://repo.luckperms.net/</url>
    </repository>
</repositories>
```

**Add LuckPerms to plugin.yml**:

```yaml
name: MinecraftAuth
version: 1.0.0
main: com.minecraftauth.MinecraftAuthPlugin
api-version: '1.20'
softdepend: [LuckPerms, Floodgate]
```

---

## 🚀 Part 3: Deployment Steps

### Step 1: Stop All Servers

```bash
# Stop Velocity
# Stop Lobby
# Stop Survival
```

### Step 2: Deploy Plugins

1. **Copy MinecraftAuth** to both backend servers:
   ```bash
   cp plugin/target/MinecraftAuth-1.0.0.jar /lobby/plugins/
   cp plugin/target/MinecraftAuth-1.0.0.jar /survival/plugins/
   ```

2. **Install LuckPerms** on all three servers (if not already installed)

3. **Configure LuckPerms** with shared MySQL on all three servers

### Step 3: Configure Velocity

**Edit** `velocity.toml`:

```toml
[servers]
lobby = "localhost:25566"
survival = "localhost:25567"

try = [
  "lobby"
]

[forced-hosts]
"play.streetlymc.com" = [
  "lobby"
]
```

### Step 4: Start Servers in Order

```bash
# 1. Start backend servers first
# Start Lobby (port 25566)
# Start Survival (port 25567)

# 2. Wait 30 seconds for them to fully start

# 3. Start Velocity (port 25577)
```

### Step 5: Verify Installation

1. **Check console logs**:
   - Look for `[MinecraftAuth] MinecraftAuth has been enabled!`
   - Look for `[LuckPerms] Enabling LuckPerms...`
   - Look for `HTTP API server started on port 8080` (on Survival only)

2. **Test in-game**:
   ```
   /lp group list
   /lp user <your-username> info
   ```

---

## 🔧 Part 4: Testing the Complete Flow

### Test Player Registration and Login

1. **Join the server**: Connect to `play.streetlymc.com`
   - You should spawn in the Lobby server
   
2. **Register account**:
   ```
   /register
   ```
   - Click the link (Java) or enter PIN (Bedrock)
   - Complete registration on https://streetlymc.com

3. **Login**:
   ```
   /login <your-password>
   ```
   - You should see: `§aSuccessfully logged in! Welcome back.`
   - You should see: `§a✓ You have been added to the verified group!`

4. **Verify permissions**:
   ```
   /lp user <your-username> info
   ```
   - Should show you're in the "verified" group

5. **Switch servers**:
   - Go to Survival server
   - Your "verified" group should persist (thanks to shared LuckPerms database)

---

## 🎨 Part 5: Setting Up Roles with LuckPerms

### Create Additional Roles

```bash
# VIP Role
lp creategroup vip
lp group vip parent add verified
lp group vip setdisplayname "&6[VIP] "
lp group vip setweight 20

# MVP Role
lp creategroup mvp
lp group mvp parent add vip
lp group mvp setdisplayname "&5[MVP] "
lp group mvp setweight 30

# Admin Role
lp creategroup admin
lp group admin setdisplayname "&c[Admin] "
lp group admin setweight 100
lp group admin permission set * true
```

### Assign Roles to Players

```bash
# Add player to VIP
lp user <username> parent add vip

# Add player to Admin
lp user <username> parent add admin

# Remove a role
lp user <username> parent remove vip
```

---

## 🔥 Part 6: Firewall Configuration

### Open Required Ports

```bash
# Velocity (public)
sudo ufw allow 25577/tcp

# Lobby (internal only)
# Don't expose to public

# Survival (internal only)
# Don't expose to public

# HTTP API (internal only - for website to plugin communication)
sudo ufw allow from YOUR_WEBSITE_SERVER_IP to any port 8080
```

**Security Note**: Only Velocity should be accessible from the internet. Backend servers should only accept connections from Velocity.

---

## 📊 Part 7: Monitoring and Logs

### Check Plugin Status

**On Survival server** (where API runs):
```bash
tail -f logs/latest.log | grep MinecraftAuth
```

### Check LuckPerms Sync

**On any server**:
```bash
tail -f logs/latest.log | grep LuckPerms
```

### Test API Endpoint

```bash
curl -X POST http://YOUR_SERVER_IP:8080/api/test \
  -H "X-API-Key: UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/"
```

---

## ⚠️ Troubleshooting

### Players Can't Login After Verification

**Solution**:
- Verify both servers have the plugin installed
- Check database connection on both servers
- Restart both backend servers

### LuckPerms Permissions Not Syncing

**Solution**:
- Ensure all three servers use the **SAME** MySQL database
- Verify `messaging-service: sql` is set in LuckPerms config
- Run `/lp sync` to force sync

### HTTP API Not Accessible

**Solution**:
- Ensure API is enabled on ONE server only
- Check firewall rules: `sudo ufw status`
- Verify port 8080 is open
- Test locally: `curl http://localhost:8080/api/test`

### Players Stuck in Lobby

**Solution**:
- Check Velocity `velocity.toml` configuration
- Ensure backend servers are running and accessible
- Check server addresses are correct (localhost:25566, localhost:25567)

---

## 📝 Quick Reference

### File Locations

```
Velocity/
├── plugins/
│   └── LuckPerms-Velocity-*.jar
└── velocity.toml

Lobby/
└── plugins/
    ├── MinecraftAuth-1.0.0.jar
    ├── LuckPerms-Bukkit-*.jar
    └── MinecraftAuth/
        └── config.yml (API disabled)

Survival/
└── plugins/
    ├── MinecraftAuth-1.0.0.jar
    ├── LuckPerms-Bukkit-*.jar
    └── MinecraftAuth/
        └── config.yml (API enabled on port 8080)
```

### Important Commands

```bash
# LuckPerms
/lp user <username> info
/lp user <username> parent add verified
/lp group list
/lp sync

# MinecraftAuth
/register
/login <password>
/links
```

### Configuration Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| Velocity | Proxy server | Routes players to backend servers |
| Lobby | Backend (25566) | Starting server, no API |
| Survival | Backend (25567) | Main server, runs HTTP API (8080) |
| LuckPerms | All servers | Shared permissions via MySQL |
| MinecraftAuth | Lobby + Survival | Player authentication + verification |

---

## ✅ Deployment Checklist

- [ ] LuckPerms installed on Velocity, Lobby, and Survival
- [ ] LuckPerms configured with shared MySQL database on all servers
- [ ] "verified" group created in LuckPerms
- [ ] MinecraftAuth plugin installed on Lobby and Survival
- [ ] MinecraftAuth config.yml configured on both servers
- [ ] HTTP API enabled on Survival only (port 8080)
- [ ] Velocity configured with backend server addresses
- [ ] Firewall rules configured (25577 public, 8080 internal only)
- [ ] Website `.env` configured with correct domains
- [ ] Database accessible from all servers
- [ ] Tested player registration flow
- [ ] Tested player login flow
- [ ] Verified "verified" group assignment works
- [ ] Tested permissions sync across servers

---

**🎉 Setup Complete!**

Your Velocity network is now configured with:
- Full authentication system
- Automatic "verified" role assignment via LuckPerms
- Multi-server permission sync
- Secure API for website integration

Players joining `play.streetlymc.com` will:
1. Connect through Velocity proxy
2. Spawn in Lobby server
3. Register and authenticate
4. Automatically receive "verified" group
5. Keep permissions when moving to Survival

**Questions or Issues?**
- Check the Troubleshooting section above
- Review console logs on each server
- Test database connectivity
- Verify LuckPerms is syncing properly
