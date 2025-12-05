# Production Deployment Guide - MinecraftAuth + LuckPerms + TAB

Complete guide for deploying the finalized auth system on Velocity + Paper/Purpur network.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Velocity Proxy (Modern Forwarding)                      │
│ - LuckPerms (proxy)                                     │
│ - TAB (proxy mode)                                      │
│ - Manages /server command permissions                   │
└─────────────────┬───────────────────────────────────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌─────────────────┐  ┌─────────────────┐
│ Lobby (Paper)   │  │ Survival (Paper)│
│ - LuckPerms     │  │ - LuckPerms     │
│ - TAB (backend) │  │ - TAB (backend) │
│ - MinecraftAuth │  │ - EssentialsX   │
│ - EssentialsX   │  │                 │
└─────────────────┘  └─────────────────┘
```

## Prerequisites

- ✅ Java 17+ installed
- ✅ Velocity proxy configured with modern forwarding
- ✅ Paper/Purpur 1.20.4+ backends
- ✅ MySQL database for MinecraftAuth
- ✅ Website with registration system

## Part 1: Build the Plugin

1. **Rebuild with latest changes:**
   ```powershell
   cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
   .\REBUILD.bat
   ```

2. **Verify build success:**
   ```
   [INFO] BUILD SUCCESS
   [INFO] MinecraftAuth-1.0.0.jar created
   ```

## Part 2: Deploy LuckPerms

### On Velocity Proxy

1. Download latest LuckPerms Velocity: https://luckperms.net/download
2. Place in `velocity/plugins/`
3. Start proxy, let it generate config
4. Stop proxy
5. Configure `velocity/plugins/LuckPerms/config.yml`:
   ```yaml
   server: minecraft
   storage-method: mysql  # or mariadb
   data:
     address: vps1.streetlymc.com:3306
     database: luckperms
     username: luckperms
     password: YOUR_PASSWORD
   
   messaging-service: pluginmsg  # or sql/redis for production
   ```

### On Backend Servers

1. Download latest LuckPerms Bukkit: https://luckperms.net/download
2. Place in `lobby/plugins/` and `survival/plugins/`
3. Configure same as proxy (use same database for sync)

### Run Setup Commands

Connect to Velocity console and run ALL commands from:
```
LUCKPERMS-SETUP.txt
```

**Critical commands:**
```
lp creategroup default
lp creategroup verified
lp group default setweight 10
lp group verified setweight 20
lp group default meta setprefix "&c[Unverified] &7"
lp group verified meta setprefix "&a[Verified] &7"
lp group default permission set velocity.command.server false
lp group verified permission set velocity.command.server true
lp group verified permission set auth.verified true
```

## Part 3: Deploy TAB Plugin

### On Velocity Proxy

1. Download TAB Velocity version: https://www.mc-market.org/resources/14009/
2. Place JAR in `velocity/plugins/`
3. Start proxy to generate config
4. Stop proxy
5. Replace `velocity/plugins/TAB/config.yml` with `TAB-PROXY-CONFIG.yml`
6. Verify header/footer shows correctly

### On Backend Servers

1. Download TAB Bukkit version (same link)
2. Place in `lobby/plugins/TAB/` and `survival/plugins/TAB/`
3. Start servers to generate configs
4. Stop servers
5. Replace configs with `TAB-BACKEND-CONFIG.yml`

## Part 4: Deploy MinecraftAuth Plugin

### On Lobby Server

1. Copy built JAR:
   ```powershell
   scp target/MinecraftAuth-1.0.0.jar ubuntu@vps1.streetlymc.com:/srv/lobby/plugins/
   ```

2. SSH to server:
   ```bash
   ssh ubuntu@vps1.streetlymc.com
   cd /srv/lobby
   ```

3. Edit config (if needed):
   ```bash
   nano plugins/MinecraftAuth/config.yml
   ```

4. Verify these settings:
   ```yaml
   auth:
     kickAfterRegister: true
     registerKickTitle: "&a&lRegistration Complete ✅"
     registerKickMessage: "&7This is normal.\n&eRejoin and use &a/login &eto sign in to your new account."
     loginMessage: "&aLogged in ✅ — you can now use &e/server &ato switch realms."
   
   api:
     port: 8080
     secret-key: UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/
   ```

5. Start server:
   ```bash
   ./start.sh
   ```

## Part 5: Update Website Registration Flow

Your website needs to call the new API endpoint when registration completes.

### Add to website registration handler:

After successfully creating account in database, make API call:

```typescript
// In your Next.js API route after registration success
async function notifyMinecraftServer(username: string) {
  try {
    const response = await fetch('http://vps1.streetlymc.com:8080/api/register-complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/'
      },
      body: JSON.stringify({ username })
    });
    
    if (!response.ok) {
      console.error('Failed to notify Minecraft server:', await response.text());
    }
  } catch (error) {
    console.error('Error notifying Minecraft server:', error);
  }
}
```

**Call it in your registration completion:**
```typescript
// After successful password hash and user creation
await notifyMinecraftServer(minecraftUsername);
```

## Part 6: Testing the Complete Flow

### Test 1: New User Registration

1. Join server as new user
2. Should see: `[Unverified]` prefix in TAB
3. Cannot use `/server` command
4. Run `/register` → receive registration link
5. Complete registration on website
6. **Should be immediately kicked with message:**
   ```
   Registration Complete ✅

   This is normal.
   Rejoin and use /login to sign in to your new account.
   ```

### Test 2: First Login

1. Rejoin server
2. Run `/login <password>`
3. Should see success message: `Logged in ✅ — you can now use /server to switch realms.`
4. TAB prefix changes to: `[Verified]` (green)
5. Can now use `/server lobby` or `/server survival`

### Test 3: Subsequent Logins

1. Disconnect and rejoin
2. Run `/login <password>` again
3. Should authenticate smoothly (idempotent - no errors)
4. `/server` command works immediately

### Test 4: Header/Footer Verification

1. Press TAB
2. Should see:
   ```
   Streetly MC (gold, bold)
   Sponsored & hosted by TSVWEB.co.uk
   play.streetlymc.com
   
   [Player list with prefixes]
   
   Lobby: X online | Ping: Xms
   Players: X / 100
   ```

## Part 7: Verification Commands

### Check User Permissions
```bash
lp user <playername> info
```
Should show:
- Primary Group: `verified`
- Permissions include: `auth.verified` and `velocity.command.server`

### Check Group Setup
```bash
lp listgroups
```
Should show:
- default (weight: 10)
- verified (weight: 20)

### Check Server Logs
```bash
tail -f /srv/lobby/logs/latest.log
```
Look for:
- `[LuckPerms] Assigned verified role to <name> - granted auth.verified permission`
- `[MinecraftAuth] <name> logged in successfully with password.`

## Part 8: Troubleshooting

### Issue: Still seeing "Account Not Verified" after login

**Solution:**
1. Check if LuckPerms is loaded: `/lp info`
2. Check if user has permission: `/lp user <name> permission check auth.verified`
3. Verify plugin logs show: `Assigned verified role to <name>`
4. Try manual assignment: `/lp user <name> parent set verified`

### Issue: /server command still denied

**Solution:**
1. Verify command run on **proxy** LuckPerms:
   ```
   lp group verified permission set velocity.command.server true
   ```
2. Check user primary group: `/lp user <name> info` (on proxy console)
3. If shows `(type: offline)`, you're on wrong side - switch to proxy

### Issue: Player not kicked after registration

**Solution:**
1. Check website logs - API call to `/api/register-complete` succeeded?
2. Verify API key matches in both website and `config.yml`
3. Check plugin is listening: `netstat -an | grep 8080`
4. Test manually:
   ```bash
   curl -X POST http://localhost:8080/api/register-complete \
     -H "X-API-Key: UC84inPweN/VcAR9AgnTqy98ZadMljoWZic0GL+Q/94/" \
     -H "Content-Type: application/json" \
     -d '{"username":"TestPlayer"}'
   ```

### Issue: TAB header/footer not showing

**Solution:**
1. Verify TAB is on **proxy**: `ls velocity/plugins/ | grep TAB`
2. Check TAB config: `header-footer.enabled: true`
3. Restart proxy after config changes
4. Check TAB version matches Velocity version

### Issue: Unverified players can still use Essentials commands

**Solution:**
1. Verify default group has tight restrictions:
   ```
   lp group default permission set essentials.* false
   lp group default permission set essentials.msg true  # only allow chat
   ```
2. Check Essentials config - may have `default: true` perms

## Part 9: Production Hardening

### Database Backups
```bash
# Daily MySQL backup
mysqldump -u root -p minecraft_auth > backup_$(date +%Y%m%d).sql
mysqldump -u root -p luckperms > luckperms_backup_$(date +%Y%m%d).sql
```

### Monitoring
- Set up alerts for failed logins
- Monitor API endpoint health (`/api/register-complete`)
- Track LuckPerms sync status

### Security
- Change API secret key in production
- Use HTTPS for website <-> plugin communication
- Restrict port 8080 to localhost if website is on same server
- Enable rate limiting on API endpoints

### Performance
- Enable LuckPerms caching: `cache-policy: write-through`
- Use Redis for LP messaging in production (not pluginmsg)
- Monitor TAB refresh rates - increase if lag occurs

## Support

If issues persist:
1. Check all logs: Velocity, Lobby, Survival
2. Verify LuckPerms database has both groups
3. Test with admin user to isolate permission issues
4. Ensure modern forwarding is enabled on ALL servers

**Key Files to Review:**
- `velocity.toml` - modern forwarding enabled
- `paper.yml` (backends) - velocity support enabled
- `spigot.yml` (backends) - bungeecord: true

---

## Summary Checklist

- [ ] LuckPerms installed on proxy + backends
- [ ] Groups created (default, verified) with correct weights
- [ ] Group prefixes set (&c[Unverified], &a[Verified])
- [ ] Permissions configured (default: no /server, verified: yes /server)
- [ ] TAB installed on proxy + backends
- [ ] TAB configs updated with header/footer
- [ ] MinecraftAuth rebuilt and deployed
- [ ] Website updated to call `/api/register-complete`
- [ ] Tested: new user register → kick → login → /server works
- [ ] Verified TAB shows correct prefixes and header/footer
- [ ] Logs show "Assigned verified role" messages

**Once all checked, system is production-ready! 🎉**
