# 🔥 CRITICAL FIX - Authentication Not Working

## The Problem

Players who `/login` successfully **CANNOT** switch servers because:
1. They're staying in "default" group instead of "verified" 
2. The `auth.verified` permission is NOT being granted
3. VelocityAuthPlugin blocks them because permission check fails

## The Solution

I've fixed the plugin code to properly grant LuckPerms permissions. Here's what you need to do:

---

## ⚡ QUICK FIX (5 Steps)

### Step 1: Rebuild the Plugin (2 minutes)

```powershell
cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
.\REBUILD.bat
```

**Or manually:**
```powershell
cd plugin
mvn clean package
```

✅ **Result:** `target\MinecraftAuth-1.0.0.jar` created

### Step 2: Deploy to Server (1 minute)

```powershell
# Stop your Lobby server
# Replace the old plugin
copy target\MinecraftAuth-1.0.0.jar [YOUR_SERVER]\plugins\MinecraftAuth-1.0.0.jar
# Start your Lobby server
```

### Step 3: Setup LuckPerms Groups (1 minute)

**On your Lobby server, run AS OP:**

```
/setupauth
```

This automatically creates and configures the `unverified` and `verified` groups.

**Expected output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Setting up LuckPerms Authentication Groups...

Creating 'unverified' group...
✓ Unverified group configured
Creating 'verified' group...
✓ Verified group configured

✓ Setup Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Fix test123 Manually (30 seconds)

On Lobby console:
```bash
lp user test123 parent add verified
lp user test123 permission set auth.verified true
lp user test123 info
```

Should now show:
```
Parent Groups:
  > verified
```

### Step 5: Test (30 seconds)

1. Join as test123
2. Run `/login <password>`
3. Console should show: `[LuckPerms] Assigned verified role to test123 - granted auth.verified permission`
4. Run `/server survival`
5. **Should work!** ✅

---

## 📋 What Was Changed

### Files Modified:

1. **`LuckyPermsUtils.java`**
   - Now **explicitly grants** `auth.verified: true` permission
   - Properly removes conflicting permissions
   - Added detailed logging

2. **`SetupAuthCommand.java`** (NEW)
   - Auto-creates LuckPerms groups
   - Sets all required permissions
   - Makes setup instant

3. **`plugin.yml`**
   - Added `/setupauth` command
   - Added `minecraftauth.setup` permission

4. **`MinecraftAuthPlugin.java`**
   - Registered new command

### Key Fix:

**BEFORE:**
```java
// Only added group membership
user.data().add(InheritanceNode.builder("verified").build());
```

**AFTER:**
```java
// Explicitly grant the permission (CRITICAL!)
PermissionNode verifiedPerm = PermissionNode.builder("auth.verified").value(true).build();
user.data().add(verifiedPerm);

// Also add group
user.data().add(InheritanceNode.builder("verified").build());
```

This ensures the permission is **directly granted**, not relying on group inheritance alone.

---

## ✅ Testing Checklist

After deploying, verify:

- [ ] Plugin rebuilt successfully
- [ ] New JAR deployed to server
- [ ] Server restarted
- [ ] `/setupauth` command executed
- [ ] Groups created: `lp listgroups` shows unverified & verified
- [ ] test123 manually verified
- [ ] test123 can login and see success message
- [ ] test123 can run `/server survival` ✅
- [ ] Console shows LuckPerms assignment logs

---

## 🆘 If Something Goes Wrong

### Can't build plugin:
```bash
# Install Maven: https://maven.apache.org/download.cgi
# Or use: choco install maven
```

### `/setupauth` not found:
- Verify you deployed the NEW jar
- Check console for plugin load errors
- Manually create groups using AUTHENTICATION-FIX-GUIDE.md

### Player still can't switch:
```bash
# Force grant permission
lp user <name> permission set auth.verified true
lp user <name> parent add verified

# Check if it worked
lp user <name> permission check auth.verified
# Must show: true ✔
```

### Permission not syncing to Velocity:
- Ensure Velocity also has same LuckPerms groups
- Run same `/setupauth` on Velocity (if it has the command)
- Or manually: `lp group verified permission set auth.verified true` on Velocity

---

## 📚 Full Documentation

For detailed explanations, see:
- **`AUTHENTICATION-FIX-GUIDE.md`** - Complete troubleshooting guide
- **`LUCKPERMS-SETUP.md`** - Full LuckPerms configuration
- **`VELOCITY-AUTH-DEPLOYMENT.md`** - Complete system deployment

---

## 🎯 Expected Behavior After Fix

### Scenario 1: New Player
```
Join → Unverified group → Cannot switch → /register → /login → Verified group → Can switch ✅
```

### Scenario 2: Existing Verified Player
```
Join → Unverified group → /login → Verified group + auth.verified=true → Can switch ✅
```

### Scenario 3: Check Permission
```bash
lp user test123 permission check auth.verified
# Output: true ✔ (green checkmark means working!)
```

---

## 🚀 Deploy Now!

1. Double-click `plugin\REBUILD.bat`
2. Copy JAR to server
3. Restart server
4. Run `/setupauth`
5. Test with test123

**Total time: ~5 minutes** ⏱️

---

**This fix is CRITICAL for operation and will resolve the authentication issue completely!** 🎉
