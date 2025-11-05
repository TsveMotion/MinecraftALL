# Minecraft Authentication System

A complete authentication system shared between a Minecraft Java server plugin and a Next.js web application.

## System Architecture

```
┌─────────────────┐         ┌──────────────┐         ┌─────────────────┐
│  Minecraft      │◄───────►│    MySQL     │◄───────►│   Next.js       │
│  Paper Plugin   │         │   Database   │         │   Website       │
└─────────────────┘         └──────────────┘         └─────────────────┘
```

## Features

- **Player Registration**: Players receive a unique link to register on the website
- **Movement Freeze**: Players cannot move, chat, or interact until authenticated
- **Secure Authentication**: Bcrypt password hashing, token expiration
- **Web Dashboard**: Modern Next.js interface with TailwindCSS + shadcn/ui

## Project Structure

```
minecraft/
├── plugin/                    # Minecraft Paper plugin (Java)
│   ├── src/
│   ├── pom.xml
│   └── README.md
├── website/                   # Next.js web application
│   ├── src/
│   ├── package.json
│   └── README.md
├── database/                  # SQL migration scripts
│   └── schema.sql
└── README.md                 # This file
```

## Quick Start

### 1. Database Setup

```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE minecraft_auth;
USE minecraft_auth;
SOURCE database/schema.sql;
```

### 2. Minecraft Plugin Setup

```bash
cd plugin
mvn clean package
# Copy target/MinecraftAuth-1.0.0.jar to your server's plugins/ folder
# Edit plugins/MinecraftAuth/config.yml with your database credentials
# Restart server
```

### 3. Website Setup

```bash
cd website
npm install
# Copy .env.example to .env and configure
npm run dev  # Development
npm run build && npm start  # Production
```

## User Flow

1. Player joins Minecraft server → **Frozen** (cannot move/chat)
2. Player runs `/register` → Receives registration URL
3. Player visits URL → Fills registration form (name, email, password)
4. Player returns to game → Runs `/login <password>`
5. Player is **Unfrozen** → Can play normally

## Security Features

- ✅ Bcrypt password hashing (cost factor 12)
- ✅ Token expiration (30 minutes)
- ✅ SQL injection prevention (prepared statements)
- ✅ Username binding to prevent spoofing
- ✅ Environment-based configuration

## Configuration

### Minecraft Plugin (`plugins/MinecraftAuth/config.yml`)

```yaml
database:
  host: localhost
  port: 3306
  database: minecraft_auth
  username: root
  password: your_password

registration:
  website-url: https://your-domain.com
  token-expiry-minutes: 30
```

### Next.js Website (`.env`)

```env
DATABASE_URL="mysql://root:password@localhost:3306/minecraft_auth"
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Tech Stack

- **Minecraft Plugin**: Java 17, Paper API, HikariCP, BCrypt
- **Website**: Next.js 14, React, TypeScript, TailwindCSS, shadcn/ui, Prisma
- **Database**: MySQL 8.0+

## Support

For issues or questions, please check the individual README files in `plugin/` and `website/` directories.
