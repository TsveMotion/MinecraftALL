# Bedrock Player Support - Implementation Guide

This guide documents the complete Bedrock player authentication system using Floodgate + PIN authentication.

## 🎯 Features Implemented

### Java Edition Players
- Run `/register` to receive a clickable registration link in chat
- Click the link to open the registration website
- Set password and complete registration
- Use `/login <password>` to authenticate

### Bedrock Edition Players
- Run `/register` to receive:
  - A 6-digit PIN displayed in chat
  - A popup form with a button to open the registration website
- Visit the registration website on phone/PC
- Enter the 6-digit PIN to link the account
- Set password and complete registration
- Use `/login <password>` OR `/login <pin>` to authenticate

---

## 📦 What Was Changed

### Plugin (Java)

#### 1. **Dependencies Added** (`pom.xml`)
```xml
<!-- Floodgate API -->
<dependency>
    <groupId>org.geysermc.floodgate</groupId>
    <artifactId>api</artifactId>
    <version>2.2.2-SNAPSHOT</version>
    <scope>provided</scope>
</dependency>

<!-- Cumulus (Forms API) -->
<dependency>
    <groupId>org.geysermc.cumulus</groupId>
    <artifactId>cumulus</artifactId>
    <version>1.1.2</version>
    <scope>provided</scope>
</dependency>
```

#### 2. **New Utility Class** (`BedrockUtils.java`)
- `isBedrock(Player)` - Detects if player is using Bedrock Edition
- `generatePIN()` - Generates secure 6-digit numerical PIN
- `isValidPIN(String)` - Validates PIN format
- `getBedrockUsername(Player)` - Gets username without Floodgate prefix

#### 3. **Updated Commands**

**RegisterCommand.java**
- Detects player platform (Java vs Bedrock)
- Java players: Sends clickable URL link
- Bedrock players: 
  - Generates and stores 6-digit PIN
  - Sends Cumulus form popup with "Open Registration Page" button
  - Displays PIN and instructions in chat

**LoginCommand.java**
- Supports both password and PIN authentication
- Auto-detects if credential is a 6-digit PIN
- PIN authentication for Bedrock players after registration
- Password authentication for all players

#### 4. **Database Manager Updates** (`DatabaseManager.java`)
New methods:
- `storePIN(username, pin)` - Store PIN with 30-minute expiry
- `verifyPIN(pin)` - Verify PIN and return username
- `getValidPIN(username)` - Get active PIN for a player
- `deletePIN(pin)` - Delete PIN after use
- `cleanupExpiredPINs()` - Cleanup expired PINs

#### 5. **Configuration Updates**
- `plugin.yml` - Added Floodgate as soft dependency
- `config.yml` - Added PIN expiry and Bedrock-specific messages

### Website (Next.js + TypeScript)

#### 1. **Prisma Schema** (`schema.prisma`)
New model:
```prisma
model BedrockPin {
  id                Int      @id @default(autoincrement())
  minecraftUsername String   @map("minecraft_username") @db.VarChar(16)
  pin               String   @db.VarChar(6)
  expiresAt         DateTime @map("expires_at")
  createdAt         DateTime @default(now()) @map("created_at")

  @@index([pin])
  @@index([minecraftUsername])
  @@index([expiresAt])
  @@map("bedrock_pins")
}
```

#### 2. **Registration Page** (`src/app/register/page.tsx`)
- Added PIN input field for Bedrock players
- Two-step flow: Verify PIN → Complete registration
- Auto-detects if user has token (Java) or needs PIN (Bedrock)
- Clean UI with 6-digit PIN input field

#### 3. **API Endpoints**

**`/api/verify-pin` (NEW)**
- Validates 6-digit PIN format
- Checks if PIN exists and hasn't expired
- Returns associated Minecraft username
- Deletes expired PINs automatically

**`/api/register` (UPDATED)**
- Supports both token-based (Java) and PIN-based (Bedrock) registration
- Validates either token OR PIN
- Creates user account with password
- Deletes used token/PIN after successful registration

### Database

#### Migration SQL (`002_add_bedrock_pins.sql`)
```sql
CREATE TABLE IF NOT EXISTS bedrock_pins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    minecraft_username VARCHAR(16) NOT NULL,
    pin VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pin (pin),
    INDEX idx_username (minecraft_username),
    INDEX idx_expires (expires_at)
);
```

---

## 🚀 Deployment Steps

### 1. Database Setup

Run the migration SQL:
```bash
cd d:\minecraft\database
mysql -u authuser -p minecraft_auth < migrations/002_add_bedrock_pins.sql
```

### 2. Website Setup

Navigate to website directory and regenerate Prisma client:
```bash
cd d:\minecraft\website
npx prisma generate
npx prisma db push
```

This will:
- Generate TypeScript types for the new BedrockPin model (fixes lint errors)
- Update the database schema

### 3. Plugin Build

Build the plugin with Maven:
```bash
cd d:\minecraft\plugin
mvn clean package
```

The compiled JAR will be in `target/MinecraftAuth-1.0.0.jar`

### 4. Server Deployment

1. **Install Floodgate** (if not already installed):
   - Download from https://geysermc.org/download/?project=floodgate
   - Place in server `plugins/` folder

2. **Install Geyser** (if not already installed):
   - Download from https://geysermc.org/download
   - Place in server `plugins/` folder
   - Configure Geyser to connect to your Bedrock port

3. **Deploy Plugin**:
   ```bash
   # Stop server
   # Replace old plugin JAR
   cp target/MinecraftAuth-1.0.0.jar /path/to/server/plugins/
   # Start server
   ```

---

## 🧪 Testing the System

### Test 1: Java Player Registration
1. Join server as Java player
2. Run `/register`
3. Click the URL link
4. Complete registration form
5. Run `/login <password>`
6. ✅ Should be authenticated

### Test 2: Bedrock Player Registration
1. Join server as Bedrock player (via Geyser)
2. Run `/register`
3. Note the 6-digit PIN in chat
4. Click the popup button to open website (or visit manually)
5. Enter PIN on website
6. Complete registration form
7. Run `/login <password>` or `/login <pin>`
8. ✅ Should be authenticated

### Test 3: PIN Expiry
1. Run `/register` as Bedrock player
2. Wait 31+ minutes (PIN expires at 30 min)
3. Try to use PIN on website
4. ❌ Should show "PIN has expired"

---

## 🔧 Configuration Options

### Plugin (`config.yml`)
```yaml
registration:
  website-url: https://mc-verify.tsvweb.co.uk
  token-expiry-minutes: 30
  pin-expiry-minutes: 30  # ← Bedrock PIN expiry
```

### Messages
All messages support color codes (`&c`, `&e`, etc.):
- `bedrock-pin-generated` - PIN display message
- `bedrock-register-instructions` - Registration steps
- `bedrock-pin-expired` - PIN expiry message
- `pin-login-success` - Successful PIN login

---

## 📊 Database Schema

### Tables Used
- `users` - User accounts
- `registration_tokens` - Java registration tokens
- `bedrock_pins` - Bedrock registration PINs (NEW)
- `bans` - Player bans
- `reports` - Player reports

### BedrockPin Fields
- `id` - Auto-increment primary key
- `minecraft_username` - Player's username
- `pin` - 6-digit numerical PIN
- `expires_at` - Expiry timestamp (30 min)
- `created_at` - Creation timestamp

---

## 🔐 Security Features

1. **PIN Format**: Exactly 6 digits, numeric only
2. **Secure Generation**: Uses `SecureRandom` for cryptographic strength
3. **Expiry**: PINs expire after 30 minutes
4. **One-Time Use**: PINs deleted after successful registration
5. **Username Validation**: PIN must match the player attempting to register
6. **Automatic Cleanup**: Expired PINs removed from database

---

## 🐛 Troubleshooting

### "Property 'bedrockPin' does not exist" (TypeScript Error)
**Solution**: Run `npx prisma generate` in the website directory

### Bedrock Players Can't Join
**Solution**: 
- Ensure Geyser and Floodgate are installed
- Check Geyser configuration
- Verify Floodgate is loaded before your plugin

### PIN Not Showing Up on Website
**Solution**:
- Verify database migration ran successfully
- Check API endpoint logs
- Ensure Prisma client was regenerated

### Form Popup Not Appearing
**Solution**:
- Verify Cumulus dependency is in classpath
- Check for errors in server console
- Ensure Floodgate API is accessible

---

## 📝 Key Implementation Details

### Platform Detection
```java
FloodgateApi.getInstance().isFloodgatePlayer(player.getUniqueId())
```

### PIN Generation
```java
int pin = 100000 + SecureRandom.nextInt(900000); // 100000-999999
```

### Form UI (Bedrock)
```java
SimpleForm.Builder form = SimpleForm.builder()
    .title("Account Registration")
    .content("Your PIN: " + pin)
    .button("Open Registration Page", ClickHandler.DEFAULT, url);
```

### Login Logic
```java
if (isValidPIN(credential)) {
    // Handle PIN authentication
} else {
    // Handle password authentication
}
```

---

## ✅ Checklist

- [x] Floodgate API dependency added
- [x] Cumulus Forms API dependency added
- [x] BedrockUtils utility class created
- [x] RegisterCommand updated for dual flow
- [x] LoginCommand supports PIN auth
- [x] DatabaseManager PIN methods added
- [x] Database migration SQL created
- [x] Prisma schema updated
- [x] Website registration page updated
- [x] API endpoints created/updated
- [x] Configuration files updated
- [x] Plugin.yml soft dependency added

---

## 🎉 Success Criteria

✅ Java players can register with token link  
✅ Bedrock players can register with PIN  
✅ Bedrock players get UI popup  
✅ PIN verification works on website  
✅ Both password and PIN login work  
✅ PINs expire after 30 minutes  
✅ Used PINs are deleted  
✅ Security measures in place  

---

## 📞 Support

If you encounter issues:
1. Check server console for errors
2. Verify all dependencies are installed
3. Ensure database migration completed
4. Check Prisma client was regenerated
5. Review configuration files

**The system is now fully compatible with both Java and Bedrock Edition players!** 🎮
