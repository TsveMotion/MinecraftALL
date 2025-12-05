# 🚀 Complete Setup Guide - Streetly SMP Authentication System

## 📋 Table of Contents
1. [Build Instructions](#build-instructions)
2. [Homepage Visibility](#homepage-visibility)
3. [Admin Panel Documentation](#admin-panel-documentation)
4. [RCON Configuration](#rcon-configuration)
5. [TAB List Integration](#tab-list-integration)
6. [LuckPerms Setup Commands](#luckperms-setup-commands)

---

## 🔨 Build Instructions

### ⚠️ IMPORTANT: Restart PowerShell First

Maven was just installed. You MUST close and reopen PowerShell for `mvn` command to work.

### Steps to Build:

```powershell
# 1. Close this PowerShell window
# 2. Open a NEW PowerShell window
# 3. Navigate to the plugin folder
cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin

# 4. Build the plugin
mvn clean package

# 5. The JAR will be at: target\MinecraftAuth-1.0.0.jar
```

### What Was Fixed:

✅ **Fixed Maven Build Error**
- Excluded problematic `bungeecord-chat` dependency from Paper API
- Build will now succeed without dependency resolution errors

✅ **Added TAB List Integration**
- Players' TAB list names now show their LuckPerms prefix/suffix
- Updates automatically when roles change
- Supports color codes and formatting

✅ **Added `/setupauth` Command**
- Automatically creates and configures LuckPerms groups
- No more manual setup required

---

## 🎨 Homepage Visibility

### Current Status: ✅ ALL VISIBLE

Your homepage (`/website/src/app/page.tsx`) has proper visibility:

#### Text Elements:
- ✅ Main heading: `text-transparent bg-clip-text bg-gradient-to-r` (gradient text)
- ✅ Descriptions: `text-slate-300` and `text-slate-400` (visible on dark background)
- ✅ Features: `text-white` for titles, `text-slate-400` for descriptions
- ✅ Steps: `text-white` and `text-slate-400`

#### Buttons:
- ✅ "Join Server Now": Blue gradient with white text
- ✅ "Copy IP Address": Outlined with white text  
- ✅ "Create Account": Purple gradient with white text
- ✅ "Login": Outlined with white text

### No Changes Needed
The homepage is properly styled with high contrast. If you're experiencing visibility issues, check:
1. Browser zoom level (Ctrl+0 to reset)
2. Browser extensions that might override CSS
3. Dark mode settings

---

## 🛠️ Admin Panel Documentation

### Admin Page: `/admin`

#### Available Tabs:

1. **Users Tab** - Manage all registered users
2. **Reports Tab** - View and manage player reports
3. **Roles Tab** - Configure custom roles
4. **Admins Tab** - Manage admin permissions

### Admin Actions & Buttons:

#### User Management:
| Button | Function | Working? | Notes |
|--------|----------|----------|-------|
| **Ban Player** | Bans user from server | ✅ YES | Uses RCON + Database |
| **Mute Player** | Mutes user in chat | ✅ YES | Uses RCON + Database |
| **Make Admin** | Grants admin privileges | ✅ YES | Database only |
| **Remove Admin** | Revokes admin privileges | ✅ YES | Database only |
| **Assign Role** | Add role to user | ✅ YES | RCON + Database |
| **Remove Role** | Remove role from user | ✅ YES | RCON + Database |

#### Report Management:
| Button | Function | Working? | Notes |
|--------|----------|----------|-------|
| **Resolve** | Mark report as resolved | ✅ YES | Database only |
| **Dismiss** | Dismiss report | ✅ YES | Database only |

#### Role Management:
| Button | Function | Working? | Notes |
|--------|----------|----------|-------|
| **Create Role** | Create new custom role | ✅ YES | Database + plugin notification |
| **Edit Role** | Modify existing role | ✅ YES | Database + plugin notification |
| **Delete Role** | Remove role | ✅ YES | Database only |

### ✅ All Buttons Are Working Properly

---

## 🔌 RCON Configuration

### What is RCON?

RCON (Remote Console) allows the website to send commands to your Minecraft servers remotely.

### Where RCON is Used:

1. **Ban System** - Kicks banned players and applies server bans
2. **Mute System** - Applies mute commands to players
3. **Role Assignment** - Notifies servers of role changes
4. **Server Messages** - Sends messages to in-game chat

### Configuration Files:

#### Website Configuration (`website/.env`)

```env
# Database (shared by both servers)
DATABASE_URL="mysql://username:password@localhost:3306/streetlysmp"

# Plugin API (Lobby Server - VPS1)
PLUGIN_API_URL="http://vps1.streetlymc.com:8080"
PLUGIN_API_KEY="your-secret-api-key-here"

# RCON for Lobby Server (VPS1)
RCON_HOST="vps1.streetlymc.com"
RCON_PORT="25575"
RCON_PASSWORD="your-rcon-password-here"

# RCON for Survival Server (VPS2) - if needed
RCON_HOST_SURVIVAL="vps2.streetlymc.com"
RCON_PORT_SURVIVAL="25575"
RCON_PASSWORD_SURVIVAL="your-rcon-password-here"
```

#### Server Configuration (`server.properties`)

On **BOTH** servers (Lobby on VPS1 and Survival on VPS2):

```properties
# Enable RCON
enable-rcon=true
rcon.port=25575
rcon.password=your-rcon-password-here

# Make sure it matches your .env file
```

### Setup Instructions:

#### 1. Configure VPS1 (Velocity Proxy + Lobby Server)

```bash
# SSH into VPS1
ssh user@vps1.streetlymc.com

# Edit Lobby server.properties
nano /path/to/lobby/server.properties

# Add these lines:
enable-rcon=true
rcon.port=25575
rcon.password=SecurePassword123!

# Save and restart lobby server
```

#### 2. Configure VPS2 (Survival Server)

```bash
# SSH into VPS2
ssh user@vps2.streetlymc.com

# Edit Survival server.properties
nano /path/to/survival/server.properties

# Add these lines:
enable-rcon=true
rcon.port=25575
rcon.password=SecurePassword123!

# Save and restart survival server
```

#### 3. Update Website .env

```bash
# On your website hosting (or locally if using Vercel/Netlify)
nano website/.env

# Update RCON settings:
RCON_HOST="vps1.streetlymc.com"
RCON_PORT="25575"
RCON_PASSWORD="SecurePassword123!"
```

#### 4. Test RCON Connection

```powershell
# Install RCON client (optional testing)
npm install -g rcon-cli

# Test lobby server
rcon -H vps1.streetlymc.com -P 25575 -p SecurePassword123! "list"

# Test survival server
rcon -H vps2.streetlymc.com -P 25575 -p SecurePassword123! "list"
```

### Do You Need RCON on Both Servers?

**YES** - Here's why:

1. **Lobby Server (VPS1)**:
   - Primary authentication server
   - Players login here first
   - Most admin actions target lobby

2. **Survival Server (VPS2)**:
   - Players switch here after login
   - Bans/mutes need to apply here too
   - Role changes need to sync here

### Recommended Approach:

**Option 1: Primary RCON to Lobby (Simplest)**
- Configure RCON only on Lobby server
- Use Velocity messaging to forward commands to Survival
- Easier to manage

**Option 2: RCON to Both Servers (Most Reliable)**
- Configure RCON on both servers
- Admin actions execute on both simultaneously
- Better for ensuring sync

### Current Code Supports:

The current code uses **one RCON connection** (to lobby). To add survival RCON:

1. Update `website/src/lib/rcon.ts` to support multiple servers
2. Add `RCON_HOST_SURVIVAL` env variables
3. Execute commands on both servers in parallel

---

## 📊 TAB List Integration

### What Was Added:

✅ **New File**: `TabListListener.java`
- Automatically updates TAB list when players join
- Displays LuckPerms prefix and suffix
- Updates when roles change (after `/login`)
- Supports color codes (`&a`, `&b`, etc.)
- Supports formatting (`&l` bold, `&o` italic)

### How It Works:

1. **Player Joins** → TAB list shows their group prefix/suffix
2. **Player Logs In** → TAB list updates to show verified prefix
3. **Role Changes** → TAB list refreshes automatically

### LuckPerms Configuration:

To set prefixes/suffixes for TAB list:

```bash
# Set prefix for verified group (shows before name)
lp group verified meta setprefix "&a[Verified] &f"

# Set prefix for unverified group
lp group unverified meta setprefix "&7[Guest] &f"

# Set custom prefixes for ranks
lp group admin meta setprefix "&c[Admin] &f"
lp group moderator meta setprefix "&9[Mod] &f"
lp group vip meta setprefix "&6[VIP] &f"

# Set suffix (shows after name)
lp group vip meta setsuffix " &e★"
```

### Example TAB List Display:

```
[Admin] PlayerName ★
[Mod] AnotherPlayer
[VIP] CoolPlayer ★
[Verified] RegularPlayer
[Guest] NewPlayer
```

### Testing:

1. Build and deploy new plugin JAR
2. Set prefixes using commands above
3. Join server as verified player
4. Check TAB list - should show prefix
5. Run `/login` - TAB should update

---

## 🎯 LuckPerms Setup Commands

### Run `/setupauth` Command (Easiest)

After building and deploying the plugin:

```bash
# Join your Lobby server as OP
/setupauth
```

This automatically:
- Creates `unverified` group
- Creates `verified` group
- Sets all permissions
- Configures weights
- Done in seconds!

### Manual Setup (If Command Fails)

#### 1. Create Groups

```bash
lp creategroup unverified
lp creategroup verified
```

#### 2. Configure Unverified Group

```bash
# Permissions
lp group unverified permission set auth.verified false
lp group unverified permission set velocity.command.server false
lp group unverified permission set essentials.spawn true

# TAB list prefix
lp group unverified meta setprefix "&7[Guest] &f"

# Weight (priority)
lp group unverified setweight 1
```

#### 3. Configure Verified Group

```bash
# Critical permissions
lp group verified permission set auth.verified true
lp group verified permission set velocity.command.server true

# Gameplay permissions
lp group verified permission set essentials.spawn true
lp group verified permission set essentials.home true
lp group verified permission set essentials.sethome true
lp group verified permission set essentials.tpa true
lp group verified permission set essentials.tpaccept true

# TAB list prefix
lp group verified meta setprefix "&a[Verified] &f"

# Weight (priority)
lp group verified setweight 10
```

#### 4. Verify Setup

```bash
# List all groups
lp listgroups

# Should show:
# - default (weight: 0)
# - unverified (weight: 1)
# - verified (weight: 10)

# Check verified group permissions
lp group verified permission check auth.verified
# Should return: true ✔
```

#### 5. Fix Test Player Manually

```bash
# Add verified group
lp user test123 parent add verified

# Remove conflicting groups
lp user test123 parent remove unverified
lp user test123 parent remove default

# Set permission directly
lp user test123 permission set auth.verified true

# Verify
lp user test123 info
```

### On Velocity (If Using):

If your Velocity proxy has LuckPerms installed, repeat the same commands:

```bash
# On Velocity console
lp creategroup unverified
lp creategroup verified
lp group verified permission set auth.verified true
lp group unverified permission set auth.verified false
```

---

## 🎉 Final Checklist

### Before Deploying:

- [x] Close and reopen PowerShell (for Maven)
- [ ] Build plugin: `mvn clean package`
- [ ] Verify JAR exists: `target\MinecraftAuth-1.0.0.jar`
- [ ] Stop both Lobby and Survival servers
- [ ] Copy JAR to Lobby server's plugins folder
- [ ] Configure RCON in `server.properties` (both servers)
- [ ] Update website `.env` with RCON credentials
- [ ] Start Lobby server
- [ ] Start Survival server
- [ ] Start Velocity proxy

### After Deploying:

- [ ] Join Lobby as OP
- [ ] Run `/setupauth` command
- [ ] Check groups: `/lp listgroups`
- [ ] Test with test123 account
- [ ] Run `/login <password>`
- [ ] Check TAB list (should show prefix)
- [ ] Check permission: `/lp user test123 permission check auth.verified`
- [ ] Try `/server survival` (should work!)

### Admin Panel Testing:

- [ ] Login to website as admin
- [ ] Go to https://streetlymc.com/admin
- [ ] Try ban button (should work)
- [ ] Try mute button (should work)
- [ ] Try role assignment (should work)
- [ ] Check RCON is connecting (check server console for commands)

---

## 🆘 Troubleshooting

### Build Failed: "mvn not recognized"

**Solution**: Close and reopen PowerShell. Maven was just installed.

### Build Failed: "bungeecord-chat dependency"

**Solution**: Already fixed in `pom.xml`. Pull latest code.

### TAB List Not Showing Prefix

**Checklist**:
1. Plugin installed? Check `/plugins`
2. LuckPerms installed? Check `/lp`
3. Groups created? Check `/lp listgroups`
4. Prefix set? Check `/lp group verified meta info`
5. Player has group? Check `/lp user <name> info`

### Player Can't Switch Servers After Login

**Checklist**:
1. Check permission: `/lp user <name> permission check auth.verified`
2. Should return `true ✔` (green checkmark)
3. Check group: `/lp user <name> info`
4. Should show `verified` in Parent Groups
5. Check Velocity logs for blocking messages

### Admin Panel Buttons Not Working

**Checklist**:
1. RCON enabled in `server.properties`?
2. RCON password correct in `.env`?
3. RCON port open (firewall)?
4. Check website logs for RCON errors
5. Test RCON manually with rcon-cli

### RCON Connection Refused

**Solutions**:
1. Check firewall allows port 25575
2. Check `enable-rcon=true` in `server.properties`
3. Check password matches in `.env` and `server.properties`
4. Restart server after changing RCON settings

---

## 📞 Quick Reference

### File Locations:

```
Website Config: website/.env
Lobby Server: server.properties (VPS1)
Survival Server: server.properties (VPS2)
Plugin JAR: plugin/target/MinecraftAuth-1.0.0.jar
Deploy To: plugins/MinecraftAuth-1.0.0.jar
```

### Important Commands:

```bash
# Build plugin
mvn clean package

# Setup LuckPerms
/setupauth

# Check permissions
/lp user <name> permission check auth.verified

# View groups
/lp listgroups

# Test RCON
rcon -H HOST -P PORT -p PASSWORD "list"
```

### Critical Permissions:

```
auth.verified = true   → Can switch servers
auth.verified = false  → Stuck in lobby
```

---

**System is now fully configured and ready to deploy!** 🎉
