require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const mqtt = require('mqtt');
const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws'); // WebSocket import

// -------------------- Express Setup --------------------
const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Middleware
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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
  status: { type: String, default: 'granted' } // optional field for future denied/granted
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

// -------------------- MQTT Setup --------------------
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);
const pendingRegistrations = new Map();

mqttClient.on('connect', () => {
  console.log("✅ MQTT Connected");
  mqttClient.subscribe('security/alerts');
  mqttClient.subscribe('security/fingerprint-id');
});

mqttClient.on('error', err => console.error("❌ MQTT Error:", err.message));

// -------------------- HTTP + WebSocket Server --------------------
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();
let pythonClient = null;
let lastFrameSent = 0;
const MAX_FPS = 8;

wss.on('connection', ws => {
  clients.add(ws);
  console.log("[INFO] WS client connected");

  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);

      if (data.type === 'frame' && !pythonClient) pythonClient = ws;

      if (data.type === 'frame' && ws === pythonClient) {
        const now = Date.now();
        if ((now - lastFrameSent) < 1000 / MAX_FPS) return;
        lastFrameSent = now;
        const sendData = JSON.stringify(data);
        clients.forEach(client => {
          if (client !== pythonClient && client.readyState === WebSocket.OPEN)
            setImmediate(() => client.send(sendData));
        });
      }

      if (data.type === 'event') {
        const sendData = JSON.stringify(data);
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) setImmediate(() => client.send(sendData));
        });
      }
    } catch (e) {
      console.error("[WS MESSAGE ERROR]", e.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    if (ws === pythonClient) pythonClient = null;
    console.log("[INFO] WS client disconnected");
  });
});

// -------------------- MQTT Message Handling --------------------
mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (topic === 'security/alerts') console.log('📥 Alert:', payload);

    if (topic === 'security/fingerprint-id') {
      const { name, id } = payload;
      const pending = pendingRegistrations.get(name);
      if (!pending) return console.warn(`⚠️ No pending registration for: ${name}`);

      await RegisteredUser.create({ ...pending, fingerprint_id: id });

      console.log(`✅ ${name} fully registered with fingerprint ID ${id}`);

      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN)
          client.send(JSON.stringify({ type: 'fingerprint_result', name, success: true }));
      });

      pendingRegistrations.delete(name);
    }
  } catch (err) {
    console.error("❌ MQTT Message Error:", err.message);
  }
});

// -------------------- Multer for uploads --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// -------------------- API Routes --------------------

// Face registration
app.post('/api/register-face', upload.single('image'), async (req, res) => {
  const { name, userId } = req.body;
  const imagePath = req.file?.path;

  if (!name || !userId || !imagePath)
    return res.status(400).json({ success: false, message: 'Name, number, and image are required.' });

  const pythonProcess = spawn('python', [path.join(__dirname, 'register_user.py'), imagePath, name]);
  let stdout = '', stderr = '';

  pythonProcess.stdout.on('data', data => stdout += data.toString());
  pythonProcess.stderr.on('data', data => stderr += data.toString());

  pythonProcess.on('close', () => {
    try {
      const result = JSON.parse(stdout);
      if (!result.success)
        return res.status(200).json({ success: false, message: result.message || 'No face detected.' });

      const { face_encoding, image_binary_base64 } = result.data;
      const imageBuffer = Buffer.from(image_binary_base64, 'base64');

      pendingRegistrations.set(name, {
        name,
        face_encoding,
        image_data: imageBuffer,
        image_path: path.basename(imagePath),
        timestamp: new Date()
      });

      mqttClient.publish('security/request-fingerprint', JSON.stringify({ name, number: parseInt(userId) }));

      return res.status(202).json({ success: true, message: 'Face registered. Awaiting fingerprint...', name, userId });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Face registration failed.', error: stderr || err.message });
    }
  });

  pythonProcess.on('error', () => res.status(500).json({ success: false, message: 'Failed to run Python script.' }));
});

// Pending registrations
app.get('/api/pending', (req, res) => res.json(Array.from(pendingRegistrations.keys())));

// Logs
app.get('/api/logs', async (req, res) => {
  try {
    const rawLogs = await LoginLog.find().sort({ timestamp: -1 });
    const logs = rawLogs.map(log => ({
      _id: log._id,
      message: log.name === "Unknown" ? `An unknown person attempted access.` : `${log.name} entered.`,
      device: log.device_id,
      timestamp: log.timestamp,
      image_url: log.image_path ? `http://localhost:${PORT}/uploads/${log.image_path}` : null
    }));
    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// -------------------- New Chart APIs --------------------

// Pie chart: Access Summary
app.get('/api/access-summary', async (req, res) => {
  try {
    const total = await LoginLog.countDocuments();
    const denied = await LoginLog.countDocuments({ status: 'denied' }); // optional if using status field
    const granted = total - denied;

    res.json([
      { name: "Granted", value: granted, color: "#00b894" },
      { name: "Denied", value: denied, color: "#d63031" }
    ]);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bar chart: Access Trend per day
app.get('/api/access-trend', async (req, res) => {
  try {
    const logs = await LoginLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const data = logs.map(l => ({ day: l._id, Attempts: l.count }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Registered users
app.get('/api/registered-users', async (req, res) => {
  try {
    const users = await RegisteredUser.find();
    res.status(200).json({
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        timestamp: u.timestamp,
        image_url: u.image_path ? `http://localhost:${PORT}/uploads/${u.image_path}` : null
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update privilege
app.patch('/api/registered-users/:id', async (req, res) => {
  try {
    const updated = await RegisteredUser.findByIdAndUpdate(req.params.id, { privilege: req.body.privilege }, { new: true });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete user
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
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
