const http = require('http');
const app = require('./app');
const { setupWebSocket } = require('./ws');
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://10.24.91.149:5173",
    "http://10.24.91.149:5176"
  ],
  credentials: true
}));
app.use('/api', require('./routes/logs'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/summary'));
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
setupWebSocket(server);



const mongoose = require('mongoose');
require('dotenv').config();



mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on http://10.24.91.149:${PORT}`)
);