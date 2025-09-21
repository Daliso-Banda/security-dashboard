const WebSocket = require('ws');
const clients = new Set();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });
  wss.on('connection', ws => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

function broadcastAlert(alertData) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'alert', ...alertData }));
    }
  });
}

module.exports = { setupWebSocket, broadcastAlert };