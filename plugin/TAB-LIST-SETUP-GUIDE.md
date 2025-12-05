# TAB List Full Names & Year Colors - Setup Guide

## 🎯 What's New

Your MinecraftAuth plugin now has **amazing new features**:

1. **Full Student Names** - TAB list shows real names instead of usernames
2. **Year-Based Colors** - Each year group has a unique color:
   - Year 7: **Red**
   - Year 8: **Gold**
   - Year 9: **Yellow**
   - Year 10: **Green**
   - Year 11: **Aqua**
   - Year 12: **Blue**
   - Year 13: **Light Purple**
3. **LuckPerms Integration** - Prefixes and suffixes still work perfectly
4. **Automatic Updates** - Names and colors update from your website database

---

## 🔧 Fix the Build Error First

### Problem
You're getting: `ERROR: JDK not found! You have JRE but need JDK.`

### Solution
You need to install JDK (Java Development Kit), not just JRE (Java Runtime Environment).

#### Step 1: Download JDK 17+
1. Go to: https://adoptium.net/
2. Download **JDK 17** or higher for Windows
3. Run the installer
4. **IMPORTANT**: Check "Add to PATH" during installation

#### Step 2: Verify Installation
Open a **NEW** PowerShell window and run:
```powershell
javac -version
```

You should see something like: `javac 17.0.x`

#### Step 3: Rebuild
```powershell
cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
.\REBUILD.bat
```

---

## 📋 Configuration

The plugin automatically reads from your website's database. The API is already configured in `config.yml`:

```yaml
# Web API Configuration (for TAB list full names and year groups)
web-api:
  url: https://streetlymc.com
  key: f0d8438bf14eb25723aec7f31cde1666d5b3b3b2daebdf084c95fbd3d3ffa82d
```

### What Gets Displayed

For each player, the plugin fetches from your database:
- `fullName` - The student's full name
- `yearGroup` - Their year group (7-13)

Then it:
1. Colors the name based on year group
2. Adds LuckPerms prefix (if set)
3. Adds LuckPerms suffix (if set)

---

## 🚀 Deployment

### 1. Build the Plugin
```powershell
cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
.\REBUILD.bat
```

### 2. Deploy to Server
```bash
# SSH into your server
ssh ubuntu@vps1-streetly-minecraft

# Navigate to lobby plugins
cd /srv/lobby/plugins

# Backup old version (optional)
mv MinecraftAuth-1.0.0.jar MinecraftAuth-1.0.0.jar.backup

# Exit SSH
exit
```

### 3. Upload New Plugin
```powershell
# From your local machine
scp target\MinecraftAuth-1.0.0.jar ubuntu@217.182.169.167:/srv/lobby/plugins/
```

### 4. Restart Server
```bash
# SSH back in
ssh ubuntu@vps1-streetly-minecraft

# Restart lobby server
cd /srv/lobby
./stop.sh  # or pkill -9 java
./start.sh
```

---

## ✅ Testing

### 1. Check Plugin Loaded
In server console:
```
plugins
```
Look for: `MinecraftAuth v1.0.0`

### 2. Join the Server
Connect to your server and press **TAB**

You should see:
- **Full names** instead of usernames
- **Colors** based on year groups
- **Prefixes** from LuckPerms (if configured)

### 3. Check Logs
```bash
tail -f /srv/lobby/logs/latest.log
```

Look for:
```
[MinecraftAuth] Updated TAB list for USERNAME with full name: FULL NAME and year group: X
```

---

## 🎨 Year Group Colors Reference

| Year Group | Color          | Hex Code   |
|-----------|----------------|------------|
| Year 7    | Red            | `#FF5555`  |
| Year 8    | Gold           | `#FFAA00`  |
| Year 9    | Yellow         | `#FFFF55`  |
| Year 10   | Green          | `#55FF55`  |
| Year 11   | Aqua           | `#55FFFF`  |
| Year 12   | Blue           | `#5555FF`  |
| Year 13   | Light Purple   | `#FF55FF`  |
| No Group  | White          | `#FFFFFF`  |

---

## 🔍 Troubleshooting

### TAB List Shows Usernames Instead of Full Names

**Cause**: Web API not responding or player not in database

**Fix**:
1. Check config.yml has correct `web-api.url`
2. Verify database has `fullName` for the player
3. Check server logs for API errors

### Colors Not Showing

**Cause**: `yearGroup` not set in database

**Fix**:
1. Ensure players have `year_group` field populated in database
2. Years must be 7-13 for colors to apply
3. If `null`, defaults to white

### LuckPerms Prefix Not Showing

**Cause**: LuckPerms not loaded or prefix not set

**Fix**:
1. Verify LuckPerms is installed: `/lp info`
2. Set prefix: `/lp group <group> meta setprefix "&c[Admin] "`
3. Reload: `/lp sync`

### Build Still Fails After Installing JDK

**Fix**:
1. Close **all** PowerShell windows
2. Open a **new** PowerShell
3. Run: `javac -version` to verify
4. If still not found, manually set JAVA_HOME:
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
```

---

## 🔗 Integration with Existing Plugins

### LuckPerms
- ✅ Fully compatible
- Prefixes and suffixes still work
- Groups and permissions unchanged

### EssentialsX
- ✅ Compatible
- Nicknames are NOT used (shows real full name)

### VelocityAuthPlugin
- ✅ Compatible
- Authentication flow unchanged

### Geyser/Floodgate
- ✅ Compatible
- Bedrock players also get full names

---

## 📝 Database Schema

Your users table should have:
```sql
fullName VARCHAR(255)     -- Required for TAB list
yearGroup INT             -- Required for colors (7-13)
minecraftUsername VARCHAR(16)  -- Used to lookup player
```

---

## 🎉 Success!

When everything is working, you'll see in TAB:

```
[Teacher] John Smith      (Year 13, purple)
[Student] Emma Johnson     (Year 11, aqua)
[Student] Oliver Brown     (Year 9, yellow)
```

Instead of just:
```
[Teacher] john_smith
[Student] emmaj
[Student] olibrown
```

---

## 📞 Need Help?

If you encounter issues:
1. Check `/srv/lobby/logs/latest.log`
2. Verify web API is accessible: `curl https://streetlymc.com/api/plugin/roles/USERNAME`
3. Test authentication: `/login <password>`
4. Check LuckPerms: `/lp info`

Happy gaming! 🎮
