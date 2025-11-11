const http = require('http');
const WebSocket = require('ws');

// In-memory chat history (last 100 messages)
let chatHistory = [];

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws, req) => {
  console.log('New WebSocket client connected from:', req.socket.remoteAddress);
  
  // Send chat history to new client
  ws.send(JSON.stringify({ type: 'history', messages: chatHistory }));
  
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log('Received:', data);
      
      // Echo back for testing
      ws.send(JSON.stringify({ type: 'ack', received: true }));
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// HTTP endpoint for plugin to post chat messages
server.on('request', (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const chatMessage = JSON.parse(body);
        
        // Add to history
        const message = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          username: chatMessage.username,
          displayName: chatMessage.displayName || chatMessage.username,
          roleSymbol: chatMessage.roleSymbol || null,
          roleColor: chatMessage.roleColor || null,
          message: chatMessage.message
        };
        
        chatHistory.push(message);
        if (chatHistory.length > 100) {
          chatHistory = chatHistory.slice(-100);
        }
        
        // Broadcast to all connected WebSocket clients
        broadcast({ type: 'message', data: message });
        
        console.log('Chat message broadcasted:', message);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('Error processing chat message:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      clients: wss.clients.size,
      messages: chatHistory.length 
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.WS_PORT || 8081;
const HOST = process.env.WS_HOST || '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`WebSocket server listening on ${HOST}:${PORT}`);
  console.log(`HTTP endpoint: http://${HOST}:${PORT}/chat`);
  console.log(`WebSocket endpoint: ws://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
