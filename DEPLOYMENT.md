# Deployment Guide

Production deployment guide for the Minecraft Authentication System.

## Production Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Nginx     │────▶│   Next.js    │────▶│   MySQL     │
│  (Reverse   │     │   (Port      │     │  (Port      │
│   Proxy)    │     │    3000)     │     │   3306)     │
└─────────────┘     └──────────────┘     └─────────────┘
      │                                         ▲
      │                                         │
      ▼                                         │
┌─────────────────────────────────────────────┐│
│         Minecraft Server (Paper)            ││
│              Port 25565                     ││
└─────────────────────────────────────────────┘
```

## Prerequisites

- Ubuntu 22.04 LTS (or similar)
- Root or sudo access
- Domain name pointed to your server
- At least 4GB RAM
- 20GB+ storage

## 1. Server Setup

### 1.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Required Software

```bash
# Java 17
sudo apt install openjdk-17-jdk -y

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# MySQL
sudo apt install mysql-server -y
sudo mysql_secure_installation

# Nginx
sudo apt install nginx -y

# PM2 (Process Manager)
sudo npm install -g pm2

# Maven (for building plugin)
sudo apt install maven -y
```

### 1.3 Configure Firewall

```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 25565/tcp   # Minecraft
sudo ufw enable
```

## 2. Database Setup

### 2.1 Secure MySQL

```bash
sudo mysql
```

```sql
CREATE DATABASE minecraft_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mcauth'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON minecraft_auth.* TO 'mcauth'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2.2 Import Schema

```bash
mysql -u mcauth -p minecraft_auth < /path/to/database/schema.sql
```

### 2.3 Enable Event Scheduler

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
event_scheduler=ON
```

Restart MySQL:

```bash
sudo systemctl restart mysql
```

## 3. Deploy Next.js Website

### 3.1 Clone Repository

```bash
cd /opt
sudo mkdir minecraft-auth
sudo chown $USER:$USER minecraft-auth
cd minecraft-auth
# Copy your files here or clone from git
```

### 3.2 Configure Environment

```bash
cd website
cp .env.example .env
nano .env
```

```env
DATABASE_URL="mysql://mcauth:STRONG_PASSWORD_HERE@localhost:3306/minecraft_auth"
NEXT_PUBLIC_SITE_URL=https://auth.yourdomain.com
```

### 3.3 Install and Build

```bash
npm install --production
npx prisma generate
npm run build
```

### 3.4 Start with PM2

```bash
pm2 start npm --name "minecraft-auth-web" -- start
pm2 save
pm2 startup
```

### 3.5 Configure Nginx

Create `/etc/nginx/sites-available/minecraft-auth`:

```nginx
server {
    listen 80;
    server_name auth.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/minecraft-auth /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 3.6 Enable SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d auth.yourdomain.com
```

## 4. Deploy Minecraft Server

### 4.1 Create Server Directory

```bash
sudo mkdir -p /opt/minecraft-server
sudo chown $USER:$USER /opt/minecraft-server
cd /opt/minecraft-server
```

### 4.2 Download Paper

```bash
wget https://api.papermc.io/v2/projects/paper/versions/1.20.4/builds/497/downloads/paper-1.20.4-497.jar
mv paper-1.20.4-497.jar paper.jar
```

### 4.3 Download MySQL Connector

```bash
wget https://dev.mysql.com/get/Downloads/Connector-J/mysql-connector-j-8.0.33.tar.gz
tar -xzf mysql-connector-j-8.0.33.tar.gz
cp mysql-connector-j-8.0.33/mysql-connector-j-8.0.33.jar plugins/
```

### 4.4 Build and Install Plugin

```bash
cd /opt/minecraft-auth/plugin
mvn clean package
cp target/MinecraftAuth-1.0.0.jar /opt/minecraft-server/plugins/
```

### 4.5 First Run

```bash
cd /opt/minecraft-server
java -Xmx4G -Xms4G -jar paper.jar --nogui
# Accept EULA
nano eula.txt  # Change false to true
```

### 4.6 Configure Plugin

Edit `plugins/MinecraftAuth/config.yml`:

```yaml
database:
  host: localhost
  port: 3306
  database: minecraft_auth
  username: mcauth
  password: STRONG_PASSWORD_HERE

registration:
  website-url: https://auth.yourdomain.com
  token-expiry-minutes: 30
```

### 4.7 Create Systemd Service

Create `/etc/systemd/system/minecraft.service`:

```ini
[Unit]
Description=Minecraft Server
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/opt/minecraft-server
ExecStart=/usr/bin/java -Xmx4G -Xms4G -jar paper.jar --nogui
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable minecraft
sudo systemctl start minecraft
```

### 4.8 View Logs

```bash
sudo journalctl -u minecraft -f
```

## 5. Monitoring and Maintenance

### 5.1 Monitor Processes

```bash
# Check PM2
pm2 status
pm2 logs minecraft-auth-web

# Check Minecraft
sudo systemctl status minecraft
sudo journalctl -u minecraft -n 100

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
```

### 5.2 Database Backups

Create backup script `/opt/scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mysqldump -u mcauth -p'PASSWORD' minecraft_auth > $BACKUP_DIR/minecraft_auth_$DATE.sql
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
```

Make executable and add to cron:

```bash
chmod +x /opt/scripts/backup-db.sh
crontab -e
# Add: 0 2 * * * /opt/scripts/backup-db.sh
```

### 5.3 Auto-Restart on Reboot

```bash
# PM2 is already configured with pm2 startup
# Minecraft is configured with systemd
# MySQL and Nginx auto-start by default
```

## 6. Performance Tuning

### 6.1 MySQL Optimization

Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 1G
max_connections = 200
query_cache_type = 1
query_cache_size = 64M
```

### 6.2 Nginx Optimization

Edit `/etc/nginx/nginx.conf`:

```nginx
http {
    # Enable gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss;

    # Buffer sizes
    client_body_buffer_size 10K;
    client_header_buffer_size 1k;
    client_max_body_size 8m;
    large_client_header_buffers 2 1k;
}
```

### 6.3 Next.js Optimization

Already optimized with production build.

## 7. Security Hardening

### 7.1 SSH Security

```bash
# Disable password authentication
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

### 7.2 Fail2Ban

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 7.3 Database Security

- Use strong passwords
- Limit MySQL to localhost only
- Regular updates

### 7.4 Application Security

- Keep dependencies updated
- Use HTTPS everywhere
- Rate limit API endpoints (consider adding to Nginx)

## 8. Scaling Considerations

### Horizontal Scaling

- Use a load balancer (nginx/HAProxy)
- Deploy multiple Next.js instances
- Shared MySQL database
- Redis for session management

### Vertical Scaling

- Increase server resources
- Optimize MySQL queries
- Use database read replicas

## 9. Troubleshooting

### Website won't start

```bash
pm2 logs minecraft-auth-web
# Check for port conflicts, database connection issues
```

### Minecraft plugin errors

```bash
sudo journalctl -u minecraft -n 100
# Check config.yml, database credentials
```

### Database connection issues

```bash
sudo systemctl status mysql
mysql -u mcauth -p
# Test connection
```

### SSL certificate issues

```bash
sudo certbot renew --dry-run
sudo systemctl reload nginx
```

## 10. Updating the System

### Update Website

```bash
cd /opt/minecraft-auth/website
git pull  # or copy new files
npm install
npm run build
pm2 restart minecraft-auth-web
```

### Update Plugin

```bash
cd /opt/minecraft-auth/plugin
mvn clean package
sudo systemctl stop minecraft
cp target/MinecraftAuth-1.0.0.jar /opt/minecraft-server/plugins/
sudo systemctl start minecraft
```

### Update Database Schema

```bash
# Backup first!
mysqldump -u mcauth -p minecraft_auth > backup.sql
# Apply new schema
mysql -u mcauth -p minecraft_auth < new_schema.sql
```

## Support

For issues, check:
- Application logs
- System logs
- Database logs
- Nginx logs

Refer to INSTALLATION.md for detailed troubleshooting steps.
