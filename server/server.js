require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

// -------------------- Express Setup --------------------
const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://10.24.91.149:5173",
    "http://10.24.91.149:5176"
  ],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));

// -------------------- MongoDB Schemas --------------------
const alertSchema = new mongoose.Schema({
  message: String,
  device: String,
  command: String,
  timestamp: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

const loginLogSchema = new mongoose.Schema({
  name: String,
  device_id: String,
  timestamp: { type: Date, default: Date.now },
  image_path: String,
  status: { type: String, default: 'granted' }
});
const LoginLog = mongoose.model('LoginLog', loginLogSchema, 'login_logs');

const registeredUserSchema = new mongoose.Schema({
  name: String,
  timestamp: { type: Date, default: Date.now },
  face_encoding: String,
  image_data: Buffer,
  image_path: String,
  fingerprint_id: Number,
  privilege: { type: String, default: "user" }
});
const RegisteredUser = mongoose.model('RegisteredUser', registeredUserSchema, 'registered_users');

// -------------------- MongoDB Connection --------------------
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Error:", err.message));

// -------------------- HTTP + WebSocket Server --------------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Set();

wss.on('connection', ws => {
  clients.add(ws);
  console.log("[INFO] WS client connected");

  ws.on('close', () => {
    clients.delete(ws);
    console.log("[INFO] WS client disconnected");
  });
});

// Helper to send WebSocket updates AND log to terminal
const sendWSUpdate = (type, name, message) => {
  console.log(`[REGISTRATION] ${name}: ${message}`);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type, name, message }));
    }
  });
};

// -------------------- Multer Setup --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// -------------------- API Routes --------------------

// Face + Fingerprint Registration
app.post('/api/register-face', upload.single('image'), async (req, res) => {
  const { name } = req.body;
  const imagePath = req.file?.path;

  if (!name || !imagePath) {
    return res.status(400).json({ success: false, message: 'Name and image are required.' });
  }

  const fingerprint_id = Math.floor(Math.random() * 199) + 1;

  try {
    sendWSUpdate('registration_status', name, 'Face registration started...');

    // 1️⃣ Face registration
    const faceResult = await new Promise((resolve, reject) => {
      const faceProcess = spawn('python3', [path.join(__dirname, 'register_user.py'), imagePath, name]);
      let stdout = '', stderr = '';
      faceProcess.stdout.on('data', data => stdout += data.toString());
      faceProcess.stderr.on('data', data => stderr += data.toString());
      faceProcess.on('close', code => {
        try {
          const jsonLine = stdout.trim().split('\n').pop();
          const result = JSON.parse(jsonLine);
          if (!result.success) reject(new Error(result.message));
          else resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse face registration result.'));
        }
      });
      faceProcess.on('error', err => reject(err));
    });
    sendWSUpdate('registration_status', name, '✅ Face registered successfully!');

    // 2️⃣ Fingerprint enrollment
    sendWSUpdate('registration_status', name, `Fingerprint enrollment started (ID: ${fingerprint_id})...`);
    const fpResult = await new Promise((resolve, reject) => {
      const fpProcess = spawn('python3', [path.join(__dirname, 'enroll_fingerprint.py'), fingerprint_id, name]);
      let stdout = '', stderr = '';
      fpProcess.stdout.on('data', data => stdout += data.toString());
      fpProcess.stderr.on('data', data => stderr += data.toString());
      fpProcess.on('close', code => {
        try {
          const jsonLine = stdout.trim().split('\n').pop();
          const result = JSON.parse(jsonLine);
          if (!result.success) reject(new Error(result.message));
          else resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse fingerprint enrollment result.'));
        }
      });
      fpProcess.on('error', err => reject(err));
    });
    sendWSUpdate('registration_status', name, '✅ Fingerprint enrolled successfully!');

    // 3️⃣ Save user **after both succeed**
    const userDoc = await RegisteredUser.create({
      name,
      face_encoding: faceResult.data.encoding,
      image_data: fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null,
      image_path: path.basename(imagePath),
      fingerprint_id
    });
    sendWSUpdate('registration_status', name, '✅ User saved to DB successfully.');

    res.status(200).json({
      success: true,
      message: 'Face and fingerprint registered successfully.',
      data: {
        name,
        embedding_length: faceResult.data.embedding_length,
        fingerprint_id,
        user_id: userDoc._id
      }
    });

  } catch (err) {
    console.error('[ERROR] Registration failed:', err.message);
    sendWSUpdate('registration_status', name, `❌ Registration failed: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
  }
});

// -------------------- Other APIs (Logs, Users, Alerts, Summary) --------------------

// Logs
app.get('/api/logs', async (req, res) => {
  try {
    const rawLogs = await LoginLog.find().sort({ timestamp: -1 });
    const logs = rawLogs.map(log => ({
      _id: log._id,
      message: log.name === "Unknown" ? `An unknown person attempted access.` : `${log.name} entered.`,
      device: log.device_id,
      timestamp: log.timestamp,
      image_url: log.image_path ? `http://10.24.91.149:${PORT}/uploads/${log.image_path}` : null
    }));
    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Access Summary
app.get('/api/access-summary', async (req, res) => {
  try {
    const total = await LoginLog.countDocuments();
    const denied = await LoginLog.countDocuments({ status: 'denied' });
    const granted = total - denied;
    res.json([
      { name: "Granted", value: granted, color: "#00b894" },
      { name: "Denied", value: denied, color: "#d63031" }
    ]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Access Trend
app.get('/api/access-trend', async (req, res) => {
  try {
    const logs = await LoginLog.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const data = logs.map(l => ({ day: l._id, Attempts: l.count }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registered Users
app.get('/api/registered-users', async (req, res) => {
  try {
    const users = await RegisteredUser.find();
    res.status(200).json({
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        timestamp: u.timestamp,
        image_url: u.image_path ? `http://10.24.91.149:${PORT}/uploads/${u.image_path}` : null
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
});

// Update Privilege
app.patch('/api/registered-users/:id', async (req, res) => {
  try {
    const updated = await RegisteredUser.findByIdAndUpdate(req.params.id, { privilege: req.body.privilege }, { new: true });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete User
app.delete('/api/registered-users/:id', async (req, res) => {
  try {
    await RegisteredUser.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------- Start Server --------------------
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on http://10.24.91.149:${PORT}`)
);
