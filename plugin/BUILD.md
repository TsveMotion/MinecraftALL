# Building the Plugin JAR

## Prerequisites

You need Maven installed to build the plugin. If you don't have it:

### Install Maven (Windows)

**Option 1: Using Chocolatey (Recommended)**
```powershell
choco install maven
```

**Option 2: Manual Installation**
1. Download Maven from: https://maven.apache.org/download.cgi
2. Extract to `C:\Program Files\Apache\maven`
3. Add to PATH: `C:\Program Files\Apache\maven\bin`
4. Verify: `mvn --version`

## Building the JAR

```powershell
cd d:\minecraft\plugin
mvn clean package
```

The JAR file will be created at:
```
d:\minecraft\plugin\target\MinecraftAuth-1.0.0.jar
```

## Quick Build (If Maven is installed)

Run this command from the plugin directory:
```powershell
mvn clean package -DskipTests
```

## Installing to Server

1. Copy the JAR to your Paper server:
   ```powershell
   Copy-Item target\MinecraftAuth-1.0.0.jar "C:\path\to\server\plugins\"
   ```

2. Download MySQL Connector/J from:
   https://dev.mysql.com/downloads/connector/j/
   
3. Place `mysql-connector-j-8.0.33.jar` in your server's `plugins/` folder

4. Start your Paper server to generate config

5. Edit `plugins/MinecraftAuth/config.yml`:
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

6. Restart the server

## Troubleshooting

**Maven not found:**
- Install Maven using the instructions above
- Make sure it's in your system PATH
- Restart your terminal after installation

**Build fails:**
- Ensure Java 17+ is installed: `java -version`
- Check internet connection (Maven downloads dependencies)
- Clear Maven cache: `mvn clean`

## Alternative: Use Pre-built Release

If you can't install Maven locally, you can:
1. Use GitHub Actions to build automatically
2. Build on a different machine with Maven
3. Use an online Maven build service
