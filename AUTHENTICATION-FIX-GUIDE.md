# 🔧 Authentication System Fix Guide

## Problem Summary

Your authentication system is working, but players who login with `/login` are **NOT** being granted the `auth.verified` permission properly. This is why they can't switch servers even after successful authentication.

### Root Causes Identified:

1. ✅ Players authenticate successfully with `/login`
2. ✅ LuckPerms is installed and running
3. ❌ **Players stay in "default" group instead of "verified" group**
4. ❌ **`auth.verified` permission is not being granted**
5. ❌ **Unverified group not being assigned on join**

## 🚀 Quick Fix (5 Minutes)

### Step 1: Rebuild the Plugin

The updated plugin files now properly handle LuckPerms integration.

```powershell
# On Windows (in plugin folder)
cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
mvn clean package

# Copy to server
copy target\MinecraftAuth-1.0.0.jar [YOUR_SERVER_PATH]\plugins\
```

### Step 2: Stop All Servers

```bash
# Stop Lobby server
# Stop Survival server
# Stop Velocity proxy
```

### Step 3: Setup LuckPerms Groups on Lobby Server

**Option A: Use the new `/setupauth` command (EASIEST)**

1. Start your **Lobby** server only
2. Join the server as an OP
3. Run this command:
   ```
   /setupauth
   ```
4. You'll see output like this:
   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Setting up LuckPerms Authentication Groups...
   
   Creating 'unverified' group...
   ✓ Unverified group configured
   Creating 'verified' group...
   ✓ Verified group configured
   
   ✓ Setup Complete!
   ```

**Option B: Manual Setup (if command doesn't work)**

Run these commands on the Lobby server console:

```bash
# Create groups
lp creategroup unverified
lp creategroup verified

# Configure UNVERIFIED group
lp group unverified permission set auth.verified false
lp group unverified permission set velocity.command.server false
lp group unverified permission set essentials.spawn true
lp group unverified setweight 1

# Configure VERIFIED group (THIS IS CRITICAL!)
lp group verified permission set auth.verified true
lp group verified permission set velocity.command.server true
lp group verified permission set essentials.spawn true
lp group verified permission set essentials.home true
lp group verified permission set essentials.sethome true
lp group verified setweight 10

# Verify groups were created
lp listgroups
```

Expected output:
```
Groups:
- default (weight: 0)
- unverified (weight: 1)
- verified (weight: 10)
```

### Step 4: Setup Same Groups on Velocity

If you're using Velocity with LuckPerms, repeat the SAME commands on the Velocity console.

```bash
# On Velocity console
lp creategroup unverified
lp creategroup verified
lp group verified permission set auth.verified true
lp group unverified permission set auth.verified false
```

### Step 5: Test with Existing User

```bash
# On Lobby console, manually fix test123:
lp user test123 parent add verified
lp user test123 parent remove default
lp user test123 permission set auth.verified true

# Check it worked:
lp user test123 permission check auth.verified
# Should show: true ✔

lp user test123 info
# Should show:
#   Parent Groups:
#     > verified
```

### Step 6: Restart Everything

```bash
# Start in this order:
1. Lobby server
2. Survival server  
3. Velocity proxy
```

### Step 7: Test the Flow

1. **Join as test123**
   - Should spawn in lobby
   - Should see "Authentication Required" message

2. **Run `/login <password>`**
   - Should see "✓ Login Successful!"
   - Console should show: `[LuckPerms] Assigned verified role to test123 - granted auth.verified permission`

3. **Run `/server survival`**
   - Should work! ✅

4. **Check permissions (on lobby console):**
   ```bash
   lp user test123 permission check auth.verified
   ```
   - Should show: `true ✔`

## 🔍 What Changed in the Code

### 1. Fixed `LuckyPermsUtils.java`

**Before:**
- Only added groups
- Didn't explicitly grant `auth.verified` permission

**After:**
- **Explicitly grants** `auth.verified: true` when verified
- **Explicitly sets** `auth.verified: false` when unverified
- Adds proper error logging
- Removes conflicting permissions

### 2. Added `/setupauth` Command

- Creates groups automatically
- Sets all required permissions
- Saves you from typing 20+ commands manually

### 3. Better Logging

Now you'll see logs like:
```
[INFO] [LuckPerms] Assigned verified role to test123 - granted auth.verified permission
[INFO] [LuckPerms] Assigned unverified role to PlayerName
```

## 🧪 Testing Checklist

After deploying the fix, test these scenarios:

### Test 1: New Player (Unregistered)
- [ ] Join server
- [ ] Spawns in lobby
- [ ] Has "unverified" group
- [ ] `/lp user <name> info` shows "unverified" in Parent Groups
- [ ] `/lp user <name> permission check auth.verified` shows `false ✘`
- [ ] Cannot run `/server survival` (blocked)

### Test 2: Registered Player (Not Logged In)
- [ ] Join server
- [ ] Spawns in lobby
- [ ] Has "unverified" group
- [ ] Sees "Please login" message
- [ ] Cannot run `/server survival` (blocked)

### Test 3: Login Flow
- [ ] Run `/login <password>`
- [ ] Sees "✓ Login Successful!"
- [ ] Console shows LuckPerms assignment message
- [ ] `/lp user <name> info` shows "verified" in Parent Groups
- [ ] `/lp user <name> permission check auth.verified` shows `true ✔`
- [ ] **CAN run `/server survival`** ✅

### Test 4: After Logout/Rejoin
- [ ] Disconnect from server
- [ ] Rejoin
- [ ] Back to "unverified" group (expected)
- [ ] Must `/login` again
- [ ] After login, can switch servers

## 🐛 Troubleshooting

### Issue: "Could not load LuckPerms user data"

**Cause:** LuckPerms not fully loaded when player joins

**Solution:**
```bash
# On server console
lp sync
```

Then have the player rejoin.

### Issue: Players still can't switch after login

**Check 1: Is the permission actually granted?**
```bash
lp user <username> permission check auth.verified
```
Should show: `true ✔` (with green checkmark)

**Check 2: Is the group configured correctly?**
```bash
lp group verified permission check auth.verified
```
Should show: `true ✔`

**Check 3: Check Velocity logs**
Look for VelocityAuthPlugin messages. Should see:
```
[VelocityAuthPlugin] Player <name> checked - has auth.verified: true
```

**Fix: Force grant permission directly**
```bash
# On lobby console
lp user <username> permission set auth.verified true
lp user <username> parent add verified
```

### Issue: Groups not syncing between servers

**Solution: Ensure all servers use SAME MySQL database**

1. Check `plugins/LuckPerms/config.yml` on ALL servers
2. Verify `storage-method: mysql`
3. Verify all have SAME MySQL host/database/credentials
4. Restart all servers
5. Run `/lp sync` on each

### Issue: `/setupauth` command not found

**Solution:**
1. Verify plugin rebuilt correctly: Check for `SetupAuthCommand.class` in the jar
2. Verify you're running the NEW version of the plugin
3. Check console for any errors on plugin load

## 📊 Before vs After Comparison

### BEFORE (Not Working)
```
Player joins → Default group → Login success → Still default group → Can't switch servers ❌
```

### AFTER (Working)
```
Player joins → Unverified group → Login success → Verified group + auth.verified=true → Can switch servers ✅
```

## 🎯 Critical Permissions Summary

| Group | auth.verified | velocity.command.server | Can Switch Servers? |
|-------|---------------|-------------------------|---------------------|
| **unverified** | **false** | false | ❌ NO |
| **verified** | **true** | true | ✅ YES |
| default | *not set* | *not set* | ❌ NO (problematic) |

The key is the `auth.verified` permission MUST be:
- **`true`** for verified players
- **`false`** for unverified players

## 📝 Manual Commands Reference

If you need to fix players manually:

```bash
# Make a player verified
lp user <username> parent add verified
lp user <username> parent remove unverified
lp user <username> parent remove default
lp user <username> permission set auth.verified true

# Make a player unverified
lp user <username> parent add unverified
lp user <username> parent remove verified
lp user <username> permission set auth.verified false

# Check player status
lp user <username> info
lp user <username> permission check auth.verified
```

## ✅ Success Indicators

You'll know it's working when:

1. ✅ Console shows: `[LuckPerms] Assigned verified role to <name> - granted auth.verified permission`
2. ✅ `/lp user <name> permission check auth.verified` returns `true ✔`
3. ✅ Player can successfully run `/server survival`
4. ✅ No "Account Not Verified" message appears
5. ✅ New players automatically get "unverified" group on join

## 🚨 Important Notes

- **Deploy NEW plugin jar** - The old version doesn't properly set permissions
- **Setup groups BEFORE testing** - Without proper groups, nothing will work
- **MySQL sync required** - If using Velocity, all servers need same database
- **Players must rejoin** - After you fix their permissions, they need to disconnect/reconnect

## 📞 Still Having Issues?

Check these files for errors:

1. **Lobby Server Log:** `logs/latest.log`
   - Look for `[LuckPerms]` messages
   - Look for `Error assigning` messages

2. **Velocity Log:** `logs/latest.log`
   - Look for `[VelocityAuthPlugin]` messages
   - Look for blocked player messages

3. **LuckPerms Verbose Mode:**
   ```bash
   lp verbose on
   # Have player try to login and switch servers
   lp verbose paste
   # Share the paste link for debugging
   ```

---

**Once you complete these steps, your authentication system will work perfectly!** 🎉

The issue was that the permission wasn't being explicitly granted - it's now fixed in the code and will work once you rebuild and redeploy.
