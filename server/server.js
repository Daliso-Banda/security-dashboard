const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./ws');
app.use('/api', require('./routes/logs'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/summary'));
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
setupWebSocket(server);

server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on http://10.24.91.149:${PORT}`)
);