# Quick Start Guide

Get the system running in under 10 minutes (for local development/testing).

## Prerequisites Check

```bash
# Check Java (needs 17+)
java -version

# Check Node.js (needs 18+)
node -v

# Check Maven
mvn -v

# Check MySQL
mysql --version
```

## 1. Database (2 minutes)

```bash
# Create database
mysql -u root -p -e "CREATE DATABASE minecraft_auth;"

# Import schema
mysql -u root -p minecraft_auth < database/schema.sql
```

## 2. Build Minecraft Plugin (1 minute)

```bash
cd plugin
mvn clean package
# Output: target/MinecraftAuth-1.0.0.jar
```

## 3. Setup Minecraft Server (3 minutes)

```bash
# Copy plugin to your server's plugins folder
cp target/MinecraftAuth-1.0.0.jar /path/to/server/plugins/

# Download and copy MySQL Connector/J to server
# https://dev.mysql.com/downloads/connector/j/
# Place mysql-connector-j-8.0.33.jar in server/plugins/ or server/libraries/

# Start server (it will generate config)
cd /path/to/server
java -Xmx2G -Xms2G -jar paper.jar --nogui

# Accept EULA when prompted
nano eula.txt  # Change false to true

# Configure plugin
nano plugins/MinecraftAuth/config.yml
```

Edit `config.yml`:
```yaml
database:
  host: localhost
  port: 3306
  database: minecraft_auth
  username: root
  password: YOUR_MYSQL_PASSWORD

registration:
  website-url: http://localhost:3000
  token-expiry-minutes: 30
```

```bash
# Restart server
java -Xmx2G -Xms2G -jar paper.jar --nogui
```

## 4. Setup Website (3 minutes)

```bash
cd ../website

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
```

Edit `.env`:
```env
DATABASE_URL="mysql://root:YOUR_MYSQL_PASSWORD@localhost:3306/minecraft_auth"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

```bash
# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Website running at: http://localhost:3000

## 5. Test It! (1 minute)

1. **Join Minecraft server** (localhost or your local IP)
2. **You'll be frozen** with registration message
3. Type: `/register`
4. **Click the link** in chat (or copy to browser)
5. **Fill out registration form**:
   - Full Name
   - Email
   - Password (min 8 chars)
6. **Submit form**
7. **Return to Minecraft**
8. Type: `/login YOUR_PASSWORD`
9. **You're unfrozen!** Start playing!

## Troubleshooting

### Plugin won't load
- Check Java version (needs 17+)
- Verify MySQL Connector/J is installed
- Check server logs: `logs/latest.log`

### Database connection failed
- Verify MySQL is running: `sudo systemctl status mysql` (Linux) or check Services (Windows)
- Check credentials in config.yml
- Test connection: `mysql -u root -p minecraft_auth`

### Website won't start
- Check Node.js version (needs 18+)
- Verify DATABASE_URL in `.env`
- Run: `npx prisma generate`
- Check port 3000 is not in use

### Token invalid/expired
- Tokens expire in 30 minutes by default
- Generate a new one: `/register` again
- Check website URL in plugin config matches where site is running

## Next Steps

- Read [INSTALLATION.md](INSTALLATION.md) for detailed setup
- Read [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Customize messages in `plugins/MinecraftAuth/config.yml`
- Customize website appearance in `website/src/app/`

## Common Commands

### Minecraft Plugin
```bash
# Rebuild plugin
cd plugin && mvn clean package

# Reload config in-game
/authreload
```

### Website
```bash
# Development
npm run dev

# Production
npm run build
npm start

# Database operations
npx prisma studio  # Visual database editor
```

### MySQL
```bash
# Access database
mysql -u root -p minecraft_auth

# View users
SELECT * FROM users;

# View active tokens
SELECT * FROM registration_tokens;

# Clean expired tokens
DELETE FROM registration_tokens WHERE expires_at < NOW();
```

## File Locations

```
minecraft/
├── database/schema.sql          # Database schema
├── plugin/
│   ├── target/                  # Built JAR here
│   └── src/main/resources/
│       └── config.yml           # Plugin config template
├── website/
│   ├── .env                     # Website config (create this)
│   └── src/                     # Source code
└── Server Location/
    └── plugins/
        └── MinecraftAuth/
            └── config.yml       # Active plugin config
```

## Support

Having issues? Check:
1. Server logs: `logs/latest.log`
2. Website logs: Terminal where `npm run dev` is running
3. MySQL logs: `sudo tail -f /var/log/mysql/error.log`
4. Browser console: F12 → Console tab

For detailed troubleshooting, see [INSTALLATION.md](INSTALLATION.md).
