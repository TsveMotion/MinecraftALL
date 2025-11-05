# 🚀 Ready to Deploy - TSV Network Authentication System

## ✅ What's Configured

### Database Configuration
- **Host**: `ddns.tsvweb.com:3306`
- **Database**: `minecraft_auth`
- **User**: `authuser`
- **Password**: `StrongPasswordHere`

### Domains
- **Minecraft Server**: `Play.tsvweb.co.uk`
- **Website**: `mc-verify.tsvweb.co.uk`

---

## 📦 Step 1: Build the Plugin JAR

### Option A: Using Maven (Recommended)

If you have Maven installed:
```powershell
cd d:\minecraft
.\BUILD-PLUGIN.bat
```

Or manually:
```powershell
cd d:\minecraft\plugin
mvn clean package
```

**Output**: `d:\minecraft\plugin\target\MinecraftAuth-1.0.0.jar`

### Option B: Install Maven First

If Maven is not installed:
```powershell
# Using Chocolatey
choco install maven

# Or download from: https://maven.apache.org/download.cgi
```

Then run the build command above.

---

## 🎮 Step 2: Deploy Plugin to Paper Server

1. **Copy the JAR** to your Paper server:
   ```
   MinecraftAuth-1.0.0.jar → server/plugins/
   ```

2. **Download MySQL Connector/J**:
   - Get it from: https://dev.mysql.com/downloads/connector/j/
   - Place `mysql-connector-j-8.0.33.jar` in `server/plugins/` folder

3. **Start your Paper server** (first time):
   - Plugin will generate default config
   - Server will create: `plugins/MinecraftAuth/config.yml`

4. **Configure the plugin**:
   ```yaml
   database:
     host: ddns.tsvweb.com
     port: 3306
     database: minecraft_auth
     username: authuser
     password: StrongPasswordHere
   
   registration:
     website-url: https://mc-verify.tsvweb.co.uk
     token-expiry-minutes: 30
   ```

5. **Restart the Paper server**

---

## 🌐 Step 3: Deploy Website

### Using Vercel (Recommended)

1. **Push code to GitHub**:
   ```powershell
   cd d:\minecraft\website
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to https://vercel.com
   - Import your GitHub repository
   - Set environment variables:
     ```
     DATABASE_URL=mysql://authuser:StrongPasswordHere@ddns.tsvweb.com:3306/minecraft_auth
     NEXT_PUBLIC_SITE_URL=https://mc-verify.tsvweb.co.uk
     NEXT_PUBLIC_MINECRAFT_SERVER=Play.tsvweb.co.uk
     ```
   - Deploy

3. **Configure DNS**:
   - Add CNAME record: `mc-verify.tsvweb.co.uk` → `your-vercel-domain.vercel.app`
   - Or use Vercel's domain settings to add custom domain

### Using VPS (Alternative)

1. **Build for production**:
   ```powershell
   cd d:\minecraft\website
   npm install
   npm run build
   ```

2. **Upload to your server** and run:
   ```bash
   npm start
   # Or use PM2: pm2 start npm --name "tsv-auth" -- start
   ```

3. **Configure nginx** as reverse proxy with SSL

---

## 🗄️ Step 4: Verify Database

Make sure your MySQL database at `ddns.tsvweb.com` has:

1. **Database created**: `minecraft_auth`
2. **User created** with permissions:
   ```sql
   CREATE USER 'authuser'@'%' IDENTIFIED BY 'StrongPasswordHere';
   GRANT ALL PRIVILEGES ON minecraft_auth.* TO 'authuser'@'%';
   FLUSH PRIVILEGES;
   ```
3. **Tables created** (run the schema):
   ```powershell
   mysql -h ddns.tsvweb.com -u authuser -p minecraft_auth < d:\minecraft\database\schema.sql
   ```

---

## ✅ Step 5: Test the System

### Test Sequence

1. **Visit website**: https://mc-verify.tsvweb.co.uk
   - Should see the TSV Network homepage
   - Server IP should show: `Play.tsvweb.co.uk`
   - Copy button should work

2. **Join Minecraft server**: `Play.tsvweb.co.uk`
   - You should be frozen
   - Should see registration message

3. **Type `/register` in game**
   - Should receive clickable link
   - Link should go to: `https://mc-verify.tsvweb.co.uk/register?token=...`

4. **Click link and register**
   - Fill out form (name, email, password)
   - Should see success message

5. **Return to game**
   - Type `/login YOUR_PASSWORD`
   - Should be unfrozen
   - Can now play normally!

---

## 🔍 Troubleshooting

### Website Issues

**Can't connect to database:**
```bash
# Test connection from your deployment location:
mysql -h ddns.tsvweb.com -u authuser -p minecraft_auth
```

**Build fails:**
```powershell
cd d:\minecraft\website
Remove-Item -Recurse -Force .next,node_modules
npm install
npm run build
```

### Plugin Issues

**Database connection failed:**
- Check `ddns.tsvweb.com` is accessible from server
- Verify MySQL user has remote access permissions
- Check firewall allows MySQL port 3306

**Plugin won't load:**
- Ensure Java 17+ is installed
- Verify Paper server version is 1.20+
- Check `logs/latest.log` for errors

### Testing Locally First

**Local database for testing:**
```env
# In website/.env (for local testing)
DATABASE_URL="mysql://root:password@localhost:3306/minecraft_auth"
```

**Local plugin config:**
```yaml
# In plugins/MinecraftAuth/config.yml (for local testing)
database:
  host: localhost
  username: root
  password: your_local_password
```

---

## 📋 Pre-Deployment Checklist

- [ ] Maven installed and working
- [ ] Plugin JAR built successfully
- [ ] MySQL database created at ddns.tsvweb.com
- [ ] Database schema imported
- [ ] MySQL user has correct permissions
- [ ] Website environment variables configured
- [ ] DNS records set up:
  - `Play.tsvweb.co.uk` → Minecraft server IP
  - `mc-verify.tsvweb.co.uk` → Website host
- [ ] SSL certificates configured for website
- [ ] MySQL Connector/J in server plugins folder

---

## 🎉 You're All Set!

Once everything is deployed:
1. Players join: `Play.tsvweb.co.uk`
2. They type `/register`
3. Visit the link at `mc-verify.tsvweb.co.uk`
4. Register their account
5. Return and `/login <password>`
6. Play!

**Support**: Check individual README files in `plugin/` and `website/` directories for more details.

**Powered by** [tsvweb.co.uk](https://tsvweb.co.uk) 🚀
