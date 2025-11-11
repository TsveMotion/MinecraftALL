const net = require('net');
const http = require('http');
const WebSocket = require('ws');

// Configuration
const MINECRAFT_HOST = '127.0.0.1';
const MINECRAFT_PORT = 25565;
const WS_PORT = 8082;
const WS_HOST = '0.0.0.0'; // Listen on all interfaces

const server = http.createServer();
const wss = new WebSocket.Server({ server });

console.log('EaglercraftX WebSocket Proxy');
console.log('============================');
console.log(`Minecraft Server: ${MINECRAFT_HOST}:${MINECRAFT_PORT}`);
console.log(`WebSocket Port: ${WS_PORT}`);

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] WebSocket client connected from ${clientIp}`);

  // Create TCP connection to Minecraft server
  const mcSocket = net.createConnection({
    host: MINECRAFT_HOST,
    port: MINECRAFT_PORT
  });

  let isConnected = false;

  mcSocket.on('connect', () => {
    console.log(`[${new Date().toISOString()}] Connected to Minecraft server`);
    isConnected = true;
  });

  // Forward data from WebSocket to Minecraft
  ws.on('message', (data) => {
    if (isConnected && mcSocket.writable) {
      try {
        // EaglercraftX sends binary data, forward as-is
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        mcSocket.write(buffer);
      } catch (err) {
        console.error('Error forwarding to Minecraft:', err.message);
      }
    }
  });

  // Forward data from Minecraft to WebSocket
  mcSocket.on('data', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(data, { binary: true });
      } catch (err) {
        console.error('Error forwarding to WebSocket:', err.message);
      }
    }
  });

  // Handle disconnections
  ws.on('close', () => {
    console.log(`[${new Date().toISOString()}] WebSocket client disconnected`);
    if (mcSocket && !mcSocket.destroyed) {
      mcSocket.destroy();
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
    if (mcSocket && !mcSocket.destroyed) {
      mcSocket.destroy();
    }
  });

  mcSocket.on('close', () => {
    console.log(`[${new Date().toISOString()}] Minecraft connection closed`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  mcSocket.on('error', (err) => {
    console.error('Minecraft connection error:', err.message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
});

server.listen(WS_PORT, WS_HOST, () => {
  console.log(`\n✅ Server listening on ${WS_HOST}:${WS_PORT}`);
  console.log(`\nClients should connect to: wss://play.tsvweb.co.uk/eagler\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nShutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
