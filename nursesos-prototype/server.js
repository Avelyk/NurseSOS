/**
 * ============================================================
 * NurseSOS Prototype — server.js (REFERENCE ONLY)
 *
 * This file is a LEARNING AID. It shows what a real Node.js
 * WebSocket backend looks like when routing text and media objects.
 * ============================================================
 */

const http = require('http');    
const fs   = require('fs');      
const path = require('path');    
const { WebSocketServer } = require('ws');  

const PORT = 3000;

const server = http.createServer((req, res) => {
  let filePath = '.' + req.url;
  if (filePath === './' || filePath === './public/index.html') {
    filePath = './index.html';        
  }

  const extname = path.extname(filePath);
  let contentType = 'text/html';

  if (extname === '.css') contentType = 'text/css';
  if (extname === '.js')  contentType = 'text/javascript';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      fs.readFile('./index.html', (err2, content2) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content2, 'utf-8');
      });
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// ===== STEP 2: Live WebSocket Packet Multiplex Pipeline =====
const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total channels open:', clients.size);

  ws.on('message', (rawData) => {
    try {
      const data = JSON.parse(rawData.toString());
      console.log('Data payload routing:', data.sender, 'sent content.');

      // Broadcast structural object to every open browser tab
      clients.forEach((client) => {
        if (client.readyState === 1) { // 1 = Connection Open Status
          client.send(JSON.stringify({
            text: data.text || "",
            sender: data.sender,           // 'patient' or 'nurse'
            mediaUrl: data.mediaUrl || null,   // Base64 data string or relative path 
            mediaType: data.mediaType || null, // Mime type validation: 'image/jpeg', 'video/mp4'
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
        }
      });
    } catch (e) {
      console.error('Error compiling incoming network frame transmission:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Remaining pools:', clients.size);
  });
});

// ===== STEP 3: Ignite Server Connection Interface =====
server.listen(PORT, () => {
  console.log(`\n  NurseSOS real-time infrastructure running at:`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  Deploy two separate windows alongside each other to verify live pipeline updates!\n`);
});