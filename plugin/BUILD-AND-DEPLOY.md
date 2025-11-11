# MinecraftAuth Plugin - Build and Deployment Guide

## Project Overview
Complete Minecraft Paper plugin with authentication system and role-based chat features.

## Features
- ✅ Player authentication with web registration
- ✅ Bedrock player support via Floodgate
- ✅ Role-based chat formatting with API integration
- ✅ Player mute system
- ✅ Player reporting system
- ✅ Username obfuscation for privacy
- ✅ MySQL database integration

## Server Configuration

### Environment Details
- **Main Server Host**: vps1.streetlymc.com
- **Game Server Address**: play.streetlymc.com:25565
- **Website & API Base**: https://streetlymc.com
- **Database Host**: ddns.tsvweb.com:3306

### API Endpoints
The plugin expects these API endpoints at https://streetlymc.com:

1. **GET** `/api/plugin/roles/{username}` - Fetch player role
   - Returns JSON with player's primary role (symbol, colorHex, isAdmin)
   
2. **GET** `/api/plugin/mute/{username}` - Check mute status
   - Returns JSON with mute status (muted, endsAt, reason)
   
3. **POST** `/api/plugin/report` - Submit player report
   - Accepts JSON: `{reporter, target, reason, server}`
   - Returns 200 on success

## Building the Plugin

### Prerequisites
- Java 17 or higher
- Maven 3.6+
- Internet connection (for downloading dependencies)

### Build Commands

From WSL/Linux:
```bash
cd /mnt/c/Users/tsvet/Documents/minecraft/MinecraftALL/plugin
mvn clean package
```

From PowerShell/CMD:
```cmd
cd C:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
mvn clean package
```

### Build Output
- **JAR Location**: `target/MinecraftAuth-1.0.0.jar`
- **Size**: ~2-3 MB (includes shaded dependencies)

## Installation

### Step 1: Upload Plugin
```bash
# Upload to server
scp target/MinecraftAuth-1.0.0.jar admin1@vps1.streetlymc.com:/path/to/server/plugins/

# Or via SFTP
# Connect to vps1.streetlymc.com
# Navigate to server/plugins/ directory
# Upload MinecraftAuth-1.0.0.jar
```

### Step 2: Configure the Plugin

Edit `plugins/MinecraftAuth/config.yml`:

```yaml
# Database Configuration
database:
  host: ddns.tsvweb.com
  port: 3306
  database: minecraft_auth
  username: authuser
  password: YOUR_DB_PASSWORD_HERE
  pool-size: 10

# Website URL for registration
registration:
  website-url: https://streetlymc.com
  token-expiry-minutes: 30
  pin-expiry-minutes: 30

# HTTP API Server (for external integration)
api:
  port: 8080
  secret-key: YOUR_SECRET_KEY_HERE

# Discord Webhook (optional)
discord:
  webhook-url: YOUR_DISCORD_WEBHOOK_URL_HERE

# MinecraftRoles API Configuration
apiBaseUrl: https://streetlymc.com
apiKey: YOUR_API_KEY_HERE  # ⚠️ REQUIRED - Get from your web API
cacheSeconds: 30

# Role Tag Configuration
roleTag:
  admin:
    symbol: "◆"
    color: "#93C572"

# Privacy Settings
privacy:
  chatObfuscate: true
  obfuscatePattern: "first3_ellipsis_last2"  # Options: first3_ellipsis_last2, first2_asterisks_last2, first1_asterisks_last1

# Features Toggle
report:
  enabled: true

mute:
  enabled: true
```

### Step 3: Restart Server
```bash
# Stop the server
screen -r minecraft  # Or however you access your server console
stop

# Wait for shutdown
# Start the server
./start.sh  # Or your start command
```

## Required Dependencies

### Server Requirements
- **Paper** 1.20.4 or higher (Spigot/Bukkit will NOT work)
- **MySQL** 8.0+ database server
- **Java** 17 runtime on server

### Optional Dependencies (Auto-detected)
- **Floodgate** 2.2.2+ (for Bedrock player support)
- **Geyser** (for Bedrock-Java crossplay)

## Database Setup

### Create Database
```sql
CREATE DATABASE minecraft_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'authuser'@'%' IDENTIFIED BY 'StrongPasswordHere';
GRANT ALL PRIVILEGES ON minecraft_auth.* TO 'authuser'@'%';
FLUSH PRIVILEGES;
```

### Tables
The plugin will auto-create required tables on first run:
- `players` - Player accounts and passwords
- `verification_tokens` - Registration tokens
- `bedrock_pins` - PIN codes for Bedrock players
- `reports` - Player reports

## Commands

### Player Commands
- `/register` - Generate registration link
- `/login <password|pin>` - Login to your account
- `/report <player> <reason>` - Report a player
- `/links` - View server links
- `/mute [player]` - Check mute status

### Admin Commands
- `/authreload` - Reload configuration
- `/mute <player>` - Check another player's mute status (requires permission)

## Permissions

```yaml
minecraftauth.register: true       # Allow registration
minecraftauth.login: true          # Allow login
minecraftauth.report: true         # Allow reporting
minecraftauth.links: true          # View links
minecraftauth.mute: true           # Check own mute status
minecraftauth.mute.check: op       # Check other players' mute status
minecraftauth.admin: op            # Admin commands
```

## Troubleshooting

### Build Errors

**Issue**: `maven command not found`
```bash
# Install Maven (Ubuntu/Debian)
sudo apt update
sudo apt install maven

# Verify installation
mvn -version
```

**Issue**: `Paper API SNAPSHOT not found`
- This is normal - Paper only publishes SNAPSHOT versions
- Maven will download from cache or repository
- Ensure internet connection is active

**Issue**: `Floodgate API not found`
- Floodgate API is marked as optional
- Build should succeed even if not found
- Only needed if using Bedrock support

### Runtime Errors

**Issue**: `API key not configured`
- Edit `plugins/MinecraftAuth/config.yml`
- Set `apiKey: YOUR_ACTUAL_API_KEY_HERE`
- Get API key from your web application
- Restart server

**Issue**: `Failed to connect to database`
- Check database host: `ddns.tsvweb.com`
- Verify credentials in config.yml
- Ensure MySQL port 3306 is accessible
- Check firewall rules

**Issue**: `Failed to fetch role for player`
- Check API base URL: `https://streetlymc.com`
- Verify API endpoints are implemented
- Check API key is correct
- Check HMAC signature generation

**Issue**: `Chat formatting not working`
- Ensure Paper API (not Spigot/Bukkit)
- Check role API returns correct JSON format
- Enable debug logging to see API responses

### Testing API Connection

Test role API:
```bash
curl -H "X-MC-SIGN: <signature>" https://streetlymc.com/api/plugin/roles/PlayerName
```

Expected response:
```json
{
  "primaryRole": {
    "symbol": "◆",
    "colorHex": "#93C572",
    "isAdmin": true
  }
}
```

Test mute API:
```bash
curl -H "X-MC-SIGN: <signature>" https://streetlymc.com/api/plugin/mute/PlayerName
```

Expected response:
```json
{
  "muted": false,
  "endsAt": null,
  "reason": null
}
```

## Verification Checklist

After deployment:
- [ ] Server starts without errors
- [ ] Plugin shows "MinecraftAuth has been enabled!"
- [ ] Plugin shows "MinecraftRoles system enabled!"
- [ ] Database connection successful
- [ ] Players can use `/register` command
- [ ] Players can use `/login` command
- [ ] Chat messages show role symbols
- [ ] Mute system works correctly
- [ ] Report system works correctly
- [ ] API endpoints responding correctly

## Performance Notes

- **Role Caching**: Roles are cached for 30 seconds (configurable via `cacheSeconds`)
- **Mute Caching**: Mute status cached for 10 seconds
- **Database Pool**: Default 10 connections (adjust `pool-size` if needed)
- **Async Operations**: All API calls are non-blocking

## Security Recommendations

1. **API Key**: Keep secret, rotate regularly
2. **Database Password**: Use strong password, restrict access
3. **HMAC Signature**: Validates all API requests
4. **Rate Limiting**: Implement on your API endpoints
5. **HTTPS Only**: Always use HTTPS for API calls
6. **Firewall**: Restrict database access to known IPs

## Support

For issues or questions:
- Check server logs: `logs/latest.log`
- Enable debug mode in Paper configuration
- Check API endpoint responses
- Verify database connectivity
- Review configuration settings

## Version Information

- **Plugin Version**: 1.0.0
- **Minecraft Version**: 1.20.4+
- **Paper API**: 1.20.4-R0.1-SNAPSHOT
- **Java Version**: 17+
- **Dependencies**: Gson 2.10.1, HikariCP 5.1.0, BCrypt 0.4
