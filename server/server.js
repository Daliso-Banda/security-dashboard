const http = require('http');
const app = require('./app'); // your existing app
const { setupWebSocket } = require('./ws');
const cors = require("cors");
const express = require('express');  // <-- needed for express.static
const path = require('path');

// Serve access_logs folder
app.use('/access_logs', express.static('/home/codeofwar/FinalYearProject/FacialRecogition/access_logs'));

// Other middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://10.252.154.149:5173",
    "http://10.252.154.149:5176"
  ],
  credentials: true
}));

// API routes
app.use('/api', require('./routes/logs'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/summary'));
app.use('/api', require('./routes/registration.js'));
app.use('/api', require('./routes/accessControl'));

// Server setup
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
setupWebSocket(server);

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on http://10.252.154.149:${PORT}`)
);
