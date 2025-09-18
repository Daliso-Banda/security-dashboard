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

// Create uploads folder if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Middleware
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(cors({ origin: 'http://10.24.91.149:5175' }));
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

// Face and Fingerprint Registration
app.post('/api/register-face', upload.single('image'), async (req, res) => {
    const { name, userId } = req.body;
    const imagePath = req.file?.path;

    if (!name || !userId || !imagePath) {
        return res.status(400).json({ success: false, message: 'Name, number, and image are required.' });
    }

    // First, run the face registration script
    const faceProcess = spawn('python', [path.join(__dirname, 'register_user.py'), imagePath, name]);
    let face_stdout = '', face_stderr = '';

    faceProcess.stdout.on('data', data => face_stdout += data.toString());
    faceProcess.stderr.on('data', data => face_stderr += data.toString());

    faceProcess.on('close', async (face_code) => {
        try {
            const face_result = JSON.parse(face_stdout);

            if (face_code !== 0) {
                return res.status(500).json({ success: false, message: face_result.message || 'Face registration failed.', error: face_stderr });
            }

            // If face registration is successful, proceed with fingerprint enrollment
            const fingerprintProcess = spawn('python', [path.join(__dirname, 'enroll_fingerprint.py'), userId, name]);
            let fingerprint_stdout = '', fingerprint_stderr = '';

            fingerprintProcess.stdout.on('data', data => fingerprint_stdout += data.toString());
            fingerprintProcess.stderr.on('data', data => fingerprint_stderr += data.toString());

            fingerprintProcess.on('close', async (fingerprint_code) => {
                try {
                    const fingerprint_result = JSON.parse(fingerprint_stdout);

                    if (fingerprint_code !== 0) {
                        return res.status(500).json({ success: false, message: fingerprint_result.message || 'Fingerprint registration failed.', error: fingerprint_stderr });
                    }

                    // Combine face and fingerprint data and save to database
                    await RegisteredUser.create({
                        name,
                        fingerprint_id: fingerprint_result.data.id,
                        face_encoding: face_result.data.encoding, // Note: The key is 'encoding' from your first script
                        image_data: Buffer.from(face_result.data.image_binary_base64, 'base64'),
                        image_path: path.basename(imagePath),
                    });

                    // Notify the frontend via WebSocket that both steps are complete
                    clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'fingerprint_result',
                                name,
                                success: true
                            }));
                        }
                    });

                    return res.status(201).json({ success: true, message: `User '${name}' registered successfully.`, name, userId });
                } catch (err) {
                    return res.status(500).json({ success: false, message: 'Fingerprint registration failed.', error: fingerprint_stderr || err.message });
                }
            });

            fingerprintProcess.on('error', (err) => res.status(500).json({ success: false, message: 'Failed to run fingerprint script.', error: err.message }));

        } catch (err) {
            return res.status(500).json({ success: false, message: 'Face registration failed.', error: face_stderr || err.message });
        }
    });

    faceProcess.on('error', () => res.status(500).json({ success: false, message: 'Failed to run face recognition script.' }));
});

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
        image_url: u.image_path ? `http://10.24.91.149:5175/uploads/${u.image_path}` : null
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