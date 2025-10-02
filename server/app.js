require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// -------------------- Middleware --------------------
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://10.252.154.149:5173",
    "http://10.252.154.149:5176"
  ],
  credentials: true
}));
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// **Serve access log images**
app.use('/access_logs', express.static('/home/codeofwar/FinalYearProject/FacialRecogition/access_logs'));

// -------------------- Routes --------------------
app.use('/api', require('./routes/registration'));
app.use('/api', require('./routes/logs'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/alerts'));
app.use('/api', require('./routes/summary'));

// -------------------- MongoDB connection --------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

module.exports = app;
