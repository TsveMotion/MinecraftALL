# WebMCBridge - Build Instructions

## Requirements
- Java 21
- Maven 3.8+
- Paper 1.21.1 server with Floodgate installed

## Build

```bash
cd WebMCBridge
mvn clean package
```

The compiled JAR will be in `target/WebMCBridge-1.0.0.jar`

## Installation

1. Copy `target/WebMCBridge-1.0.0.jar` to your server's `plugins/` directory
2. Make sure Floodgate plugin is installed
3. Restart the server

## Configuration

The plugin uses hardcoded endpoints:
- **WebSocket**: `ws://127.0.0.1:8081`
- **HTTP POST**: `http://127.0.0.1:8081/chat`

These match your WebSocket server running on the same machine.

## Features

### Outgoing (Minecraft → Web)
- Captures all player chat (Java + Bedrock)
- Strips Floodgate prefix (`.`) from Bedrock usernames
- Sends as JSON to `http://127.0.0.1:8081/chat`:
  ```json
  {
    "username": "player123",
    "displayName": "Player123",
    "roleSymbol": null,
    "roleColor": null,
    "message": "Hello world!"
  }
  ```

### Incoming (Web → Minecraft)
- Listens on WebSocket `ws://127.0.0.1:8081`
- Receives messages like:
  ```json
  {
    "type": "message",
    "data": {
      "message": "Admin announcement"
    }
  }
  ```
- Broadcasts using `/say` command

## Thread Safety
- ✅ HTTP POST is async (doesn't block main thread)
- ✅ WebSocket messages trigger `/say` on main thread
- ✅ Auto-reconnects every 5 seconds if connection drops

## Testing

### Test Outgoing Chat
1. Join Minecraft server
2. Send a chat message
3. Check WebSocket server logs: `sudo journalctl -u webmc-proxy -f`
4. Should see: "Chat message broadcasted"

### Test Incoming Chat
1. Use browser console on https://play.tsvweb.co.uk
2. Send test message:
   ```javascript
   fetch('http://localhost:3000/api/admin/send-server-message', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({message: 'Test from web'})
   });
   ```
3. Check Minecraft - should see: `[Server] Test from web`

## Troubleshooting

### Plugin won't load
- Check you have Floodgate installed: `/plugins`
- Check server logs: `logs/latest.log`
- Verify Java 21: `java -version`

### WebSocket won't connect
- Verify WebSocket server is running: `curl http://127.0.0.1:8081/health`
- Check plugin logs for "WebSocket connected!"
- Check firewall isn't blocking localhost

### Chat not sending to web
- Check HTTP endpoint is reachable: `curl http://127.0.0.1:8081/health`
- View plugin logs for HTTP errors
- Make sure WebSocket server is running

### Web messages not appearing in Minecraft
- Check WebSocket connection status in plugin logs
- Verify message format matches expected JSON
- Check server has permission to run `/say` command

## Server Setup

If you haven't set up the WebSocket server yet, see:
- `SSH-SETUP-GUIDE.md` - Production deployment
- `LOCAL-SETUP.md` - Local development

WebSocket server should be running at:
- Local: `ws://127.0.0.1:8081`
- Production: `wss://play.tsvweb.co.uk/ws`

## Dependencies

The plugin requires:
- **Paper API 1.21.1** (provided by server)
- **Floodgate API 2.0** (provided by Floodgate plugin)
- **Gson 2.10.1** (shaded into JAR)

## Logs

Watch plugin activity:
```bash
tail -f logs/latest.log | grep WebMCBridge
```

You should see:
```
[WebMCBridge] WebMCBridge enabled!
[WebMCBridge] Connecting to WebSocket at ws://127.0.0.1:8081
[WebMCBridge] WebSocket connected!
```

## Permissions

No permissions required - all players' chat is automatically forwarded.

## Commands

No commands - the plugin works automatically in the background.
