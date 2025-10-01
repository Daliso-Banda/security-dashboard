require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
//app.use('/api', require('./routes/registration'));

const app = express();
const PORT = process.env.PORT || 3000;
app.use('/api', require('./routes/registration'));
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://10.24.91.149:5173",
    "http://10.24.91.149:5176"
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

// Routes
app.use('/api', require('./routes/registration'));
app.use('/api', require('./routes/logs'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/summary'));

module.exports = app;
