@echo off
echo ================================================
echo Building MinecraftAuth Plugin for Paper Server
echo ================================================
echo.

cd /d "%~dp0plugin"

echo Checking Maven installation...
where mvn >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Maven is not installed!
    echo.
    echo Please install Maven:
    echo 1. Download from: https://maven.apache.org/download.cgi
    echo 2. Or use Chocolatey: choco install maven
    echo.
    pause
    exit /b 1
)

echo Maven found! Building plugin...
echo.

mvn clean package -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo SUCCESS! Plugin built successfully!
    echo ================================================
    echo.
    echo JAR Location: %~dp0plugin\target\MinecraftAuth-1.0.0.jar
    echo.
    echo Next steps:
    echo 1. Copy the JAR to your Paper server's plugins folder
    echo 2. Download MySQL Connector/J and place in plugins folder
    echo 3. Start server and configure plugins/MinecraftAuth/config.yml
    echo 4. Restart server
    echo.
) else (
    echo.
    echo ================================================
    echo ERROR: Build failed!
    echo ================================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause
