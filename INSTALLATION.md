# Installation Guide

Complete step-by-step guide to set up the Minecraft Authentication System.

## Prerequisites

- **Java 17+** (for Minecraft plugin)
- **Maven 3.6+** (for building the plugin)
- **MySQL 8.0+** (database)
- **Node.js 18+** (for Next.js website)
- **Paper/Purpur Server 1.20+** (Minecraft server)

## Step 1: Database Setup

### 1.1 Create MySQL Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE minecraft_auth;
exit;
```

### 1.2 Run Schema Migration

```bash
cd database
mysql -u root -p minecraft_auth < schema.sql
```

### 1.3 Verify Tables Created

```bash
mysql -u root -p minecraft_auth
```

```sql
SHOW TABLES;
-- Should show: users, registration_tokens
DESCRIBE users;
DESCRIBE registration_tokens;
exit;
```

## Step 2: Build Minecraft Plugin

### 2.1 Navigate to Plugin Directory

```bash
cd plugin
```

### 2.2 Build with Maven

```bash
mvn clean package
```

This creates `target/MinecraftAuth-1.0.0.jar`

### 2.3 Install Plugin

1. Copy JAR to your server's `plugins/` folder:
   ```bash
   cp target/MinecraftAuth-1.0.0.jar /path/to/your/minecraft/server/plugins/
   ```

2. **IMPORTANT**: Download MySQL Connector/J and add it to your server:
   ```bash
   # Download MySQL Connector/J 8.0.33
   # Place it in server/plugins/ or server/libraries/
   ```
   
   Download from: https://dev.mysql.com/downloads/connector/j/

### 2.4 Start Server (First Time)

```bash
cd /path/to/your/minecraft/server
java -Xmx4G -Xms4G -jar paper.jar --nogui
```

The plugin will generate default config and then fail to connect to database. This is expected.

### 2.5 Configure Plugin

Edit `plugins/MinecraftAuth/config.yml`:

```yaml
database:
  host: localhost
  port: 3306
  database: minecraft_auth
  username: root
  password: YOUR_MYSQL_PASSWORD  # Change this!

registration:
  website-url: http://your-domain.com  # Change this!
  token-expiry-minutes: 30
```

### 2.6 Restart Server

```bash
# Stop the server and start again
java -Xmx4G -Xms4G -jar paper.jar --nogui
```

Check logs for: `MinecraftAuth has been enabled!`

## Step 3: Set Up Next.js Website

### 3.1 Navigate to Website Directory

```bash
cd ../website
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Configure Environment

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/minecraft_auth"
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # Change for production
```

### 3.4 Generate Prisma Client

```bash
npx prisma generate
```

### 3.5 Start Development Server

```bash
npm run dev
```

Website available at: http://localhost:3000

### 3.6 Production Build (Optional)

```bash
npm run build
npm start
```

## Step 4: Testing the System

### 4.1 Join Minecraft Server

1. Open Minecraft and connect to your server
2. You should be frozen and see registration instructions

### 4.2 Register

1. Type `/register` in game
2. Click the link in chat
3. Fill out the registration form on the website
4. Submit the form

### 4.3 Login

1. Return to Minecraft
2. Type `/login YOUR_PASSWORD`
3. You should be unfrozen and able to play

## Step 5: Production Deployment

### For the Website

#### Option A: Vercel (Recommended)

1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

#### Option B: VPS/Docker

```bash
# Build production
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "minecraft-auth" -- start

# Or use systemd service
```

### For the Minecraft Server

1. Use a proper domain name
2. Update `config.yml` with production URL
3. Consider using a reverse proxy (nginx/Caddy)
4. Enable SSL/HTTPS for the website

## Troubleshooting

### Plugin Issues

**Error: "Failed to initialize database"**
- Check MySQL is running: `sudo systemctl status mysql`
- Verify credentials in `config.yml`
- Ensure MySQL Connector/J is installed
- Check MySQL user permissions

**Error: "Plugin disabled"**
- Check server logs in `logs/latest.log`
- Verify Java version: `java -version` (needs 17+)
- Ensure Paper API version matches

### Website Issues

**Error: "Cannot connect to database"**
- Verify `DATABASE_URL` in `.env`
- Test MySQL connection: `mysql -u root -p`
- Check MySQL is accessible from Node.js

**Error: "Prisma Client not generated"**
- Run: `npx prisma generate`
- Delete `node_modules` and reinstall: `npm install`

**Token validation fails**
- Check system time is synchronized
- Verify token hasn't expired (30 min default)
- Check database for token existence

### Database Issues

**Connection refused**
- Start MySQL: `sudo systemctl start mysql`
- Check port: `netstat -tulpn | grep 3306`
- Verify firewall rules

**Access denied**
- Grant permissions:
  ```sql
  GRANT ALL PRIVILEGES ON minecraft_auth.* TO 'root'@'localhost';
  FLUSH PRIVILEGES;
  ```

## Security Checklist

- [ ] Change default MySQL password
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS for production website
- [ ] Configure firewall (only expose necessary ports)
- [ ] Regular database backups
- [ ] Update dependencies regularly
- [ ] Use strong passwords in registration
- [ ] Consider rate limiting on API routes

## Maintenance

### Database Backups

```bash
# Backup
mysqldump -u root -p minecraft_auth > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p minecraft_auth < backup_20240101.sql
```

### Update Plugin

1. Build new version
2. Stop server
3. Replace JAR in `plugins/`
4. Start server

### Update Website

```bash
git pull
npm install
npm run build
pm2 restart minecraft-auth
```

### Clean Up Expired Tokens

Tokens are automatically cleaned by MySQL event scheduler. To manually clean:

```sql
DELETE FROM registration_tokens WHERE expires_at < NOW();
```

## Performance Optimization

### Database

- Add indexes (already in schema)
- Configure connection pooling (already set to 10)
- Monitor slow queries

### Website

- Enable caching
- Use CDN for static assets
- Optimize images
- Enable compression

### Minecraft Server

- Allocate sufficient RAM
- Use Paper optimizations
- Monitor TPS

## Support

If you encounter issues:

1. Check the logs (`logs/latest.log` for server, browser console for website)
2. Verify all prerequisites are installed
3. Review configuration files
4. Check database connectivity
5. Consult the README files in each directory

For more help, check the individual README files:
- `/plugin/README.md` - Plugin documentation
- `/website/README.md` - Website documentation
- `/README.md` - System overview
