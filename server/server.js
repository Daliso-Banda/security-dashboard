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

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ✅ MongoDB Schemas
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
  image_path: String
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

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ MongoDB Connected");
}).catch((err) => {
  console.error("❌ MongoDB Error:", err.message);
});

// ✅ MQTT Setup
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);
const pendingRegistrations = new Map();

mqttClient.on('connect', () => {
  console.log("✅ MQTT Connected");
  mqttClient.subscribe('security/alerts');
  mqttClient.subscribe('security/fingerprint-id');
});

mqttClient.on('error', (err) => {
  console.error("❌ MQTT Error:", err.message);
});

mqttClient.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());

    if (topic === 'security/alerts') {
      console.log('📥 Alert:', payload);
    }

    if (topic === 'security/fingerprint-id') {
      const { name, fingerprint_id } = payload;
      const pending = pendingRegistrations.get(name);
      if (!pending) return console.warn(`⚠️ No pending registration for: ${name}`);

      await RegisteredUser.create({
        ...pending,
        fingerprint_id
      });

      console.log(`✅ ${name} fully registered with fingerprint ID ${fingerprint_id}`);
      pendingRegistrations.delete(name);
    }
  } catch (err) {
    console.error("❌ MQTT Message Error:", err.message);
  }
});

// ✅ Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ✅ API Routes

// Face registration
app.post('/api/register-face', upload.single('image'), async (req, res) => {

  const name = req.body.name;
  const number = req.body.userId; // NEW: Trigger number
  const imagePath = req.file?.path;

  console.log(req.body.userId);
  console.log(req.body.name);
  console.log(req.file);


  if (!name || !number || !imagePath) {
    return res.status(400).json({
      success: false,
      message: 'Name, number, and image are required.'
    });
  }

  const pythonProcess = spawn('python', [path.join(__dirname, 'register_user.py'), imagePath, name]);

  let stdout = '', stderr = '';
  pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
  pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

  pythonProcess.on('close', () => {
    try {
      const result = JSON.parse(stdout);
      if (!result.success) {
        return res.status(200).json({
          success: false,
          message: result.message || 'Registration unsuccessful: no face detected.'
        });
      }

      const { face_encoding, image_binary_base64 } = result.data;
      const imageBuffer = Buffer.from(image_binary_base64, 'base64');

      pendingRegistrations.set(name, {
        name,
        face_encoding,
        image_data: imageBuffer,
        image_path: path.basename(imagePath),
        timestamp: new Date()
      });

      // ✅ Include number in the MQTT message
      const payload = {
        name,
        number: parseInt(number) // Ensure it's a number
      };

      mqttClient.publish('security/request-fingerprint', JSON.stringify(payload));
      console.log(payload);
      console.log(`🕓 Face registered. Awaiting fingerprint for: ${name}, ID: ${number}`);

      return res.status(202).json({
        success: true,
        message: 'Face registered. Awaiting fingerprint...',
        name,
        number
      });

    } catch (err) {
      console.error("❌ Python Output Parse Error:", err.message);
      return res.status(500).json({
        success: false,
        message: 'Face registration failed.',
        error: stderr || err.message
      });
    }
  });

  pythonProcess.on('error', (err) => {
    console.error("❌ Python Execution Error:", err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to run Python script.'
    });
  });
});


// Optional: See pending
app.get('/api/pending', (req, res) => {
  res.json(Array.from(pendingRegistrations.keys()));
});

// Logs
app.get('/api/logs', async (req, res) => {
  try {
    const rawLogs = await LoginLog.find().sort({ timestamp: -1 });
    const logs = rawLogs.map(log => ({
      _id: log._id,
      message: log.name === "Unknown" ? `An unknown person attempted access.` : `${log.name} entered.`,
      device: log.device_id,
      timestamp: log.timestamp
    }));
    res.status(200).json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// View registered users
app.get('/api/registered-users', async (req, res) => {
  try {
    const users = await RegisteredUser.find();
    const formatted = users.map(user => ({
      _id: user._id,
      name: user.name,
      timestamp: user.timestamp,
      image_url: user.image_path ? `http://localhost:${PORT}/uploads/${user.image_path}` : null
    }));
    res.status(200).json({ users: formatted });
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

// ✅ Start server
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
