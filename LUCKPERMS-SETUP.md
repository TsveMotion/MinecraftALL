# LuckPerms Configuration for Authentication System

This document provides all the LuckPerms commands needed to set up the authentication system for your Minecraft network.

## Prerequisites

- LuckPerms installed on Velocity proxy AND all backend servers (Lobby, Survival)
- LuckPerms using MySQL/MariaDB storage (for network-wide sync)
- VelocityAuthPlugin installed on Velocity proxy

## Group Setup

### 1. Create the Groups

Run these commands on your Velocity proxy or any backend server (changes will sync across the network):

```bash
# Create the Unverified group (default for new players)
/lp creategroup unverified

# Create the Verified group (for authenticated players)
/lp creategroup verified

# Create the Default group (fallback)
/lp creategroup default
```

### 2. Configure the Unverified Group

The Unverified group should have minimal permissions - only lobby access:

```bash
# Set display name
/lp group unverified meta setdisplayname "&7[Unverified] "

# Set weight (lower weight = less priority)
/lp group unverified setweight 1

# Basic permissions for unverified players
/lp group unverified permission set minecraft.command.me true
/lp group unverified permission set essentials.spawn true
/lp group unverified permission set essentials.afk true

# DENY server switching permission
/lp group unverified permission set auth.verified false

# DENY server command
/lp group unverified permission set velocity.command.server false

# Allow only lobby world access (if using multiworld)
/lp group unverified permission set multiverse.access.lobby true
/lp group unverified permission set multiverse.access.survival false
```

### 3. Configure the Verified Group

The Verified group should have full gameplay permissions:

```bash
# Set display name
/lp group verified meta setdisplayname "&a[Verified] "

# Set weight
/lp group verified setweight 10

# Grant verified permission (CRITICAL - this is checked by the plugin)
/lp group verified permission set auth.verified true

# Grant server switching permissions
/lp group verified permission set velocity.command.server true
/lp group verified permission set bungeecord.server.survival true
/lp group verified permission set bungeecord.server.lobby true

# Grant gameplay permissions
/lp group verified permission set essentials.spawn true
/lp group verified permission set essentials.sethome true
/lp group verified permission set essentials.home true
/lp group verified permission set essentials.tpa true
/lp group verified permission set essentials.tpaccept true

# World access
/lp group verified permission set multiverse.access.* true
```

### 4. Configure the Default Group

Set up the default group as a fallback:

```bash
/lp group default meta setdisplayname "&8[Member] "
/lp group default setweight 5
/lp group default permission set essentials.spawn true
```

### 5. Set Default Group

Make "unverified" the default group for new players:

```bash
# Set unverified as the default group
/lp group unverified setweight 0
/lp defaultassignments add unverified
```

Alternatively, you can configure this in LuckPerms config:

Edit `plugins/LuckPerms/config.yml` and add:

```yaml
default-assignments:
  unverified: true
```

## Player Management Commands

### Manually Verify a Player (for testing)

```bash
# Add a player to the verified group
/lp user <username> parent add verified

# Remove from unverified group
/lp user <username> parent remove unverified

# Check a player's groups
/lp user <username> info

# Check if player has auth.verified permission
/lp user <username> permission check auth.verified
```

### Manually Unverify a Player

```bash
# Remove from verified group
/lp user <username> parent remove verified

# Add back to unverified group
/lp user <username> parent add unverified
```

## Automated Verification (Web System Integration)

Your web system should execute these commands via RCON when a player successfully registers/logs in:

```bash
# Grant verified permissions
lp user <minecraft_username> parent add verified
lp user <minecraft_username> parent remove unverified
```

Example RCON command from Node.js/PHP:

```javascript
// Node.js example using rcon-client
const Rcon = require('rcon-client').Rcon;

async function verifyPlayer(minecraftUsername) {
    const rcon = await Rcon.connect({
        host: "your-velocity-ip",
        port: 25575, // RCON port
        password: "your-rcon-password"
    });
    
    await rcon.send(`lp user ${minecraftUsername} parent add verified`);
    await rcon.send(`lp user ${minecraftUsername} parent remove unverified`);
    
    rcon.end();
}
```

## Permission Node Reference

### Core Permissions Used by VelocityAuthPlugin

- **auth.verified**: Main permission checked by the plugin. Must be `true` for verified players.

### Additional Recommended Permissions

#### For Lobby Server (Paper/Spigot)

Unverified players should be able to:
- Walk around the lobby
- Read signs
- Use basic commands like /spawn

Unverified players should NOT be able to:
- Use portals (Nether, End, Custom)
- Break/place blocks
- Use server selector NPCs/GUIs
- Access command like /server

#### For Survival Server (Paper/Spigot)

Only verified players can join this server (enforced by VelocityAuthPlugin).

## Verification Flow

1. **Player joins network** → Velocity assigns them to "unverified" group
2. **Plugin checks permission** → Player lacks `auth.verified` permission
3. **Access restricted** → Can only stay in Lobby, cannot run `/server`
4. **Player sees message** → Friendly message with website URL
5. **Player registers on website** → Web system verifies identity
6. **Web system updates LuckPerms** → Adds player to "verified" group via RCON
7. **Player gets access** → Can now switch servers and play normally

## Testing the Setup

### Test 1: Verify Unverified Players Are Blocked

```bash
# Create a test account
/lp user TestPlayer parent add unverified

# Join as TestPlayer and try:
/server survival  # Should be blocked
# Try walking through a portal # Should be blocked by lobby server permissions
```

### Test 2: Verify Verified Players Can Access Everything

```bash
# Grant verified status
/lp user TestPlayer parent add verified
/lp user TestPlayer parent remove unverified

# Join as TestPlayer and try:
/server survival  # Should work
/server lobby     # Should work
```

### Test 3: Check Plugin is Working

```bash
# On Velocity console, you should see logs like:
[VelocityAuthPlugin] LuckPerms API loaded successfully!
[VelocityAuthPlugin] Unverified players will be restricted to: lobby

# When unverified player tries to switch:
[VelocityAuthPlugin] Blocked unverified player TestPlayer from joining survival
```

## Troubleshooting

### Players Can't Switch Servers Even When Verified

```bash
# Check if player has the permission
/lp user <username> permission check auth.verified

# Verify the group has the permission
/lp group verified permission check auth.verified

# Force update
/lp user <username> parent add verified
/lp user <username> clear
```

### Permission Changes Not Syncing

1. Verify LuckPerms is using MySQL storage on ALL servers
2. Check `storage-method` in LuckPerms config.yml:
   ```yaml
   storage-method: mysql
   ```
3. Restart all servers after config changes
4. Use `/lp sync` to manually sync

### Plugin Not Loading

1. Check Velocity logs for errors
2. Verify LuckPerms is loaded BEFORE VelocityAuthPlugin
3. Check that velocity-plugin.json has correct dependency:
   ```json
   "dependencies": [{"id": "luckperms"}]
   ```

## Additional Security Recommendations

### Prevent Permission Bypass

```bash
# Deny permission manipulation for regular players
/lp group verified permission set luckperms.* false
/lp group unverified permission set luckperms.* false

# Only admins should have LP access
/lp group admin permission set luckperms.* true
```

### Protect Against Alt Accounts

Consider using a plugin like JPremium or similar to enforce account authentication.

### Enable Login Attempts Limiting

On your web system, implement rate limiting and account lockout after failed attempts.

## Integration with Web System

Your web authentication system should update LuckPerms automatically. Here's the flow:

1. Player registers on website with Minecraft username
2. Player logs in on website
3. Backend verifies credentials
4. Backend executes RCON command to Velocity:
   ```
   lp user <minecraft_username> parent add verified
   lp user <minecraft_username> parent remove unverified
   ```
5. Changes sync instantly across network
6. Player can now access all servers

## Complete Setup Checklist

- [ ] LuckPerms installed on Velocity
- [ ] LuckPerms installed on all backend servers (Lobby, Survival)
- [ ] LuckPerms configured to use MySQL storage
- [ ] MySQL credentials configured in LuckPerms config.yml (same database for all)
- [ ] Created "unverified" group with restricted permissions
- [ ] Created "verified" group with `auth.verified` permission
- [ ] Set "unverified" as default group for new players
- [ ] VelocityAuthPlugin compiled and installed
- [ ] VelocityAuthPlugin config.properties configured with correct lobby server name
- [ ] Web system configured to execute RCON commands
- [ ] Tested with unverified player (blocked from switching)
- [ ] Tested with verified player (can switch servers)
- [ ] Reviewed server logs for any errors

---

**Need Help?**

If you encounter issues, check:
1. Velocity console logs
2. LuckPerms verbose mode: `/lp verbose on`
3. Player permission check: `/lp user <name> permission check auth.verified`

**Documentation:**
- LuckPerms: https://luckperms.net/
- Velocity: https://velocitypowered.com/
