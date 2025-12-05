# Quick JDK Installation Guide

## ⚠️ Problem
Your build is failing with:
```
ERROR: JDK not found! You have JRE but need JDK.
```

## 🔧 Solution

### Option 1: Eclipse Adoptium (Recommended)

1. **Download**
   - Go to: https://adoptium.net/temurin/releases/
   - Select: **JDK 17 (LTS)**
   - Operating System: **Windows**
   - Architecture: **x64**
   - Package Type: **.msi**
   - Click: **Download**

2. **Install**
   - Run the downloaded `.msi` file
   - ✅ **CHECK**: "Add to PATH" (very important!)
   - ✅ **CHECK**: "Set JAVA_HOME variable"
   - Click: **Install**

3. **Verify**
   - Close ALL PowerShell windows
   - Open a NEW PowerShell
   - Run:
   ```powershell
   java -version
   javac -version
   ```
   
   Both should show version 17.x.x

4. **Build Your Plugin**
   ```powershell
   cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
   .\REBUILD.bat
   ```

---

### Option 2: Oracle JDK

1. **Download**
   - Go to: https://www.oracle.com/java/technologies/downloads/#java17
   - Download: **Windows x64 Installer**

2. **Install**
   - Run installer
   - Follow default options

3. **Set Environment Variables**
   - Open: **Control Panel** → **System** → **Advanced system settings**
   - Click: **Environment Variables**
   - Under **System variables**:
     - Click **New**
     - Variable name: `JAVA_HOME`
     - Variable value: `C:\Program Files\Java\jdk-17`
   - Find **Path** variable:
     - Click **Edit**
     - Click **New**
     - Add: `%JAVA_HOME%\bin`
   - Click **OK** on all windows

4. **Verify**
   - Close ALL PowerShell windows
   - Open NEW PowerShell
   - Run:
   ```powershell
   java -version
   javac -version
   ```

5. **Build Your Plugin**
   ```powershell
   cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
   .\REBUILD.bat
   ```

---

## 🚨 Still Not Working?

### Manual PATH Setup

If the installer didn't add JDK to PATH:

1. Find your JDK installation path:
   - Usually: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot\`
   - Or: `C:\Program Files\Java\jdk-17\`

2. Open PowerShell and run:
   ```powershell
   [Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot", "Machine")
   [Environment]::SetEnvironmentVariable("PATH", $env:PATH + ";C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot\bin", "Machine")
   ```
   
   ⚠️ Replace the path with YOUR actual JDK path

3. **Restart Computer** (important for system variables)

4. Verify:
   ```powershell
   java -version
   javac -version
   ```

---

## ✅ Success Checklist

- [ ] JDK 17+ installed
- [ ] `java -version` works
- [ ] `javac -version` works
- [ ] `mvn -version` works
- [ ] `REBUILD.bat` runs without errors
- [ ] `target\MinecraftAuth-1.0.0.jar` created

---

## 🎯 What's the Difference?

### JRE (Java Runtime Environment)
- ❌ **Cannot compile** Java code
- ✅ Can **run** Java programs
- Used by: End users, Minecraft players

### JDK (Java Development Kit)
- ✅ Can **compile** Java code
- ✅ Can **run** Java programs
- ✅ Includes development tools
- Used by: Developers (you!)

**You need JDK to build Minecraft plugins!**

---

## 📞 Quick Commands Reference

Check if JDK is installed:
```powershell
javac -version
```

Check JAVA_HOME:
```powershell
echo $env:JAVA_HOME
```

List Java installations:
```powershell
where java
where javac
```

Build plugin:
```powershell
cd c:\Users\tsvet\Documents\minecraft\MinecraftALL\plugin
.\REBUILD.bat
```

---

## 🔗 Useful Links

- **Adoptium (Recommended)**: https://adoptium.net/
- **Oracle JDK**: https://www.oracle.com/java/technologies/downloads/
- **Maven Documentation**: https://maven.apache.org/install.html
- **Environment Variables Guide**: https://docs.oracle.com/en/java/javase/17/install/installation-jdk-microsoft-windows-platforms.html

---

Once JDK is installed, proceed to: **TAB-LIST-SETUP-GUIDE.md**
