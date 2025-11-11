# Building VelocityAuthPlugin

## Prerequisites

- Java 17 or higher
- Maven 3.8 or higher

## Build Instructions

### Windows

```powershell
# Navigate to plugin directory
cd VelocityAuthPlugin

# Clean and build
mvn clean package

# The compiled JAR will be in target/VelocityAuthPlugin-1.0.0.jar
```

### Linux/Mac

```bash
# Navigate to plugin directory
cd VelocityAuthPlugin

# Clean and build
mvn clean package

# The compiled JAR will be in target/VelocityAuthPlugin-1.0.0.jar
```

## Expected Output

After successful build, you should see:

```
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  X.XXX s
[INFO] Finished at: YYYY-MM-DD HH:MM:SS
[INFO] ------------------------------------------------------------------------
```

And the JAR file will be created at:
```
target/VelocityAuthPlugin-1.0.0.jar
```

File size should be approximately 15-25 KB.

## Installation

Copy the compiled JAR to your Velocity proxy plugins folder:

```bash
# Example path (adjust to your setup)
cp target/VelocityAuthPlugin-1.0.0.jar /path/to/velocity/plugins/
```

Then restart your Velocity proxy or use `/velocity reload`.

## Troubleshooting Build Errors

### Error: "JAVA_HOME is not set"

**Solution:**
```bash
# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-17

# Linux/Mac
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk
```

### Error: "Dependencies cannot be resolved"

**Solution:**
```bash
# Force update dependencies
mvn clean install -U
```

### Error: "Source option 17 is no longer supported"

**Solution:**
- Ensure you're using Java 17 or higher
- Check Java version: `java -version`
- Update JAVA_HOME to point to Java 17+

## Development

To modify the plugin:

1. Edit source files in `src/main/java/com/streetlysmp/velocityauth/`
2. Rebuild: `mvn clean package`
3. Replace JAR in Velocity plugins folder
4. Reload Velocity: `/velocity reload`

## Dependencies

This plugin depends on:
- **Velocity API** (3.3.0-SNAPSHOT) - Provided by Velocity
- **LuckPerms API** (5.4) - Provided by LuckPerms plugin

Both dependencies are marked as `provided` scope, so they won't be bundled in the JAR.

## Configuration

After first run, the plugin will create:
```
plugins/velocityauthplugin/config.properties
```

Edit this file to configure:
- `lobby-server-name` - Name of your lobby server
- `website-url` - URL where players register

## Testing

To test the plugin:

1. Build and install as described above
2. Ensure LuckPerms is installed on Velocity
3. Start Velocity and check logs for:
   ```
   [VelocityAuthPlugin] VelocityAuthPlugin is initializing...
   [VelocityAuthPlugin] LuckPerms API loaded successfully!
   [VelocityAuthPlugin] VelocityAuthPlugin has been enabled successfully!
   ```
4. Join with an unverified account and try `/server survival`
5. Should be blocked with a friendly message

See `VELOCITY-AUTH-DEPLOYMENT.md` for complete testing procedures.
