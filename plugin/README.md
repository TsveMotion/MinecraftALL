# MinecraftAuth Plugin

A Paper/Purpur Minecraft plugin that enforces authentication through a web-based registration system.

## Features

- **Movement Freeze**: Players cannot move, chat, or interact until authenticated
- **Web Registration**: Players receive a unique registration link
- **Secure Login**: BCrypt password verification
- **Session Management**: Players must re-authenticate each session
- **Database Integration**: MySQL with HikariCP connection pooling

## Building

```bash
mvn clean package
```

The compiled JAR will be in `target/MinecraftAuth-1.0.0.jar`

## Installation

1. Copy `MinecraftAuth-1.0.0.jar` to your server's `plugins/` folder
2. Start the server to generate the default config
3. Stop the server
4. Edit `plugins/MinecraftAuth/config.yml` with your database credentials
5. Restart the server

## Configuration

Edit `plugins/MinecraftAuth/config.yml`:

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

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/register` | Get registration link | `minecraftauth.register` |
| `/login <password>` | Login with password | `minecraftauth.login` |
| `/authreload` | Reload config | `minecraftauth.admin` |

## How It Works

1. Player joins server → Frozen (cannot move/chat/interact)
2. Player runs `/register` → Receives clickable registration URL
3. Player visits URL → Completes registration on website
4. Player runs `/login <password>` in game
5. Player is unfrozen → Can play normally

## Requirements

- Java 17+
- Paper/Purpur 1.20+
- MySQL 8.0+
- MySQL Connector/J in server plugins folder

## Security

- All passwords are hashed with BCrypt (cost factor 12)
- Registration tokens expire after 30 minutes
- Prepared statements prevent SQL injection
- Players re-authenticate each session

## Troubleshooting

**Database connection failed:**
- Verify MySQL is running
- Check database credentials in config.yml
- Ensure MySQL Connector/J is in the plugins folder or server libraries

**Players can't register:**
- Check that the website URL in config.yml is correct
- Verify the database is accessible
- Check server logs for errors

## Support

Check the main README.md in the root directory for full system documentation.
