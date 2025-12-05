@echo off
echo ========================================
echo   Rebuilding MinecraftAuth Plugin
echo ========================================
echo.
echo IMPORTANT: If you just installed Maven, close
echo this PowerShell window and open a NEW one!
echo.
pause
echo.

echo Checking Maven installation...
where mvn >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Maven not found!
    echo.
    echo Please close this PowerShell window and open a NEW one.
    echo Maven was just installed and needs a fresh shell.
    echo.
    pause
    exit /b 1
)

echo Maven found! Proceeding with build...
echo.

echo Checking Java installation...
java -version 2>&1 | findstr /C:"version" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java not found!
    pause
    exit /b 1
)

echo Detecting JDK...
where javac >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: JDK not found! You have JRE but need JDK.
    echo.
    echo Please install JDK 17 or higher from:
    echo https://adoptium.net/
    echo.
    echo After installing, set JAVA_HOME to your JDK path.
    echo Example: C:\Program Files\Eclipse Adoptium\jdk-17.0.9.9-hotspot\
    echo.
    pause
    exit /b 1
)

echo JDK found! Proceeding with build...
echo.

echo Cleaning old builds...
call mvn clean

echo.
echo Building plugin...
call mvn package -DskipTests

echo.
if exist "target\MinecraftAuth-1.0.0.jar" (
    echo ========================================
    echo   BUILD SUCCESSFUL!
    echo ========================================
    echo.
    echo Plugin location: target\MinecraftAuth-1.0.0.jar
    echo.
    echo NEW FEATURES IN THIS BUILD:
    echo   - TAB list now displays students' FULL NAMES
    echo   - Year-based colors for TAB list names
    echo   - Full LuckPerms integration with prefixes/suffixes
    echo   - Web API integration for student data
    echo   - Fixed JDK detection in build script
    echo.
    echo Next steps:
    echo 1. Stop your Lobby server
    echo 2. Copy target\MinecraftAuth-1.0.0.jar to plugins folder
    echo 3. Start your Lobby server
    echo 4. Run /setupauth command in-game as OP
    echo 5. Test with: /login [password]
    echo 6. Verify TAB list shows rank prefix
    echo.
    echo For full instructions, see:
    echo   - COMPLETE-SETUP-GUIDE.md
    echo   - AUTHENTICATION-FIX-GUIDE.md
    echo.
) else (
    echo ========================================
    echo   BUILD FAILED!
    echo ========================================
    echo.
    echo Check the error messages above.
    echo.
    echo Common issues:
    echo   - Maven not in PATH (restart PowerShell)
    echo   - Missing dependencies (run: mvn clean)
    echo   - Network issues (check internet)
    echo.
)

pause
