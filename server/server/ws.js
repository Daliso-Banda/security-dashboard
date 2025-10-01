const WebSocket = require('ws');
const clients = new Set();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', ws => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

// New function to send updates
function sendWSUpdate(eventType, userName, message) {
  const alertData = { type: eventType, user: userName, message };
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(alertData));
    }
  });
}

// Export functions
module.exports = { setupWebSocket, sendWSUpdate };
