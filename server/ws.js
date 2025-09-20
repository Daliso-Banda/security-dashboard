const WebSocket = require('ws');
const clients = new Set();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', ws => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
  return wss;
}

function sendWSUpdate(type, name, message) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, name, message }));
    }
  });
  console.log(`[REGISTRATION] ${name}: ${message}`);
}

module.exports = { setupWebSocket, sendWSUpdate };