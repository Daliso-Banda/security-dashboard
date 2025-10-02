const WebSocket = require('ws');
const clients = new Set();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

// Send registration updates to all connected clients
function sendWSUpdate(eventType, name, message) {
  const alertData = { type: eventType, name, message }; // use 'name' to match frontend
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(alertData));
    }
  });
}

module.exports = { setupWebSocket, sendWSUpdate };
