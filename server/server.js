require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

// --- NEW IMPORTS for file uploads and child processes ---
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process'); // Import spawn from child_process
// Serves uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- END NEW IMPORTS ---

// --- CORS Middleware for Express HTTP requests ---
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5173'
}));
// --- END CORS Middleware for Express ---

// --- Socket.IO Server Initialization ---
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"]
  }
});
// --- END Socket.IO Server Initialization ---

// --- Load environment variables from .env file ---
// This should be at the very top!
// -------------------------------------------------

app.use(express.json()); // For parsing JSON bodies

// --- Alert Model ---
const alertSchema = new mongoose.Schema({
  message: String,
  device: String,
  command: String,
  timestamp: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

// --- LoginLog Model ---
const loginLogSchema = new mongoose.Schema({
  name: String,
  device_id: String,
  timestamp: { type: Date, default: Date.now },
  image_path: String
});
const LoginLog = mongoose.model('LoginLog', loginLogSchema, 'login_logs');

// --- NEW: RegisteredUser Model for Face Registrations ---
const registeredUserSchema = new mongoose.Schema({
  name: String,
  timestamp: { type: Date, default: Date.now },
  face_encoding: String, // Stored as Base64 string from Python
  image_data: Buffer,    // Store original binary image data as Buffer
  image_path: String,
  privilege: { type: String, default: "user" }
});

// Explicitly name the collection 'registered_users' to match previous Python behavior
const RegisteredUser = mongoose.model('RegisteredUser', registeredUserSchema, 'registered_users');
// --- END NEW: RegisteredUser Model ---

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log(`✅ Connected to MongoDB at ${MONGO_URI.split('@')[1] || MONGO_URI.split('//')[1].split('/')[0]}`))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// --- MQTT Broker Connection ---
const mqtt = require('mqtt');
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL);

console.log("🚀 Script running...");

mqttClient.on('connect', () => {
  console.log(`✅ Connected to external MQTT broker at ${process.env.MQTT_BROKER_URL.split('//')[1]}`);
  mqttClient.subscribe('security/alerts', (err) => {
    if (!err) {
      console.log('📥 Subscribed to topic: security/alerts');
    } else {
      console.error('❌ Subscription failed:', err.message);
    }
  });
});

mqttClient.on('error', (err) => {
  console.error('❌ MQTT Error:', err.message);
});

// --- MQTT message handler for Node.js server ---
mqttClient.on('message', (topic, message) => {
  if (topic === 'security/alerts') {
    try {
      const alertData = JSON.parse(message.toString());
      console.log('📥 Received alert via MQTT:', alertData);
      io.emit('alert', alertData);
      console.log('⚡ Alert bridged to Socket.IO clients.');
    } catch (error) {
      console.error('❌ Error parsing MQTT alert message:', error.message);
    }
  }
});

// --- Socket.IO connection event (optional, for logging) ---
io.on('connection', (socket) => {
  console.log('⚡ A user connected via Socket.IO');
  socket.on('disconnect', () => {
    console.log('🔥 A user disconnected from Socket.IO');
  });
});

// --- Configure Multer for file uploads ---
// Define a directory for temporary uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
// Ensure the upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    // Create a unique filename: fieldname-timestamp.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
  }
});

const upload = multer({ storage: storage });
// --- END Multer Config ---

// --- API Endpoints ---

// READ All Alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
    console.error('❌ Error fetching alerts:', err.message);
  }
});

//view users 
// 🔄 UPDATED: View registered users with full image URLs
app.get('/api/registered-users', async (req, res) => {
  try {
    const users = await RegisteredUser.find({});
    const formattedUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      timestamp: user.timestamp,
      image_url: user.image_path
        ? `http://localhost:${PORT}/uploads/${user.image_path}`
        : null
    }));
    res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching registered users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});


// Update user privilege
app.patch('/api/registered-users/:id', async (req, res) => {
  const { privilege } = req.body;
  try {
    const updated = await RegisteredUser.findByIdAndUpdate(req.params.id, { privilege }, { new: true });
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





// READ All Login Logs
app.get('/api/logs', async (req, res) => {
  try {
    const rawLogs = await LoginLog.find().sort({ timestamp: -1 });
    const formattedLogs = rawLogs.map(log => {
      let message = "";
      if (log.name === "Unknown") {
        message = `An unknown person attempted access.`;
      } else {
        message = `${log.name} entered.`;
      }
      return {
        _id: log._id,
        message: message,
        device: log.device_id,
        timestamp: log.timestamp
      };
    });
    res.status(200).json({ success: true, logs: formattedLogs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
    console.error('❌ Error fetching login logs:', err.message);
  }
});

// --- NEW: Face Registration Endpoint ---
app.post('/api/register-face', upload.single('image'), async (req, res) => {
  const name = req.body.name;
  const imagePath = req.file ? req.file.path : null; // Path to the saved image in uploads/

  let responseSent = false;

  if (!name || !imagePath) {
    if (imagePath) { // Clean up if name missing but image uploaded
      fs.unlink(imagePath, (err) => {
        if (err) console.error(`❌ Error deleting incomplete file ${imagePath}:`, err);
      });
    }
    responseSent = true;
    return res.status(400).json({ success: false, message: 'Name and image file are required.' });
  }

  const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
  const pythonScriptPath = path.join(__dirname, 'register_user.py');

  console.log(`Executing Python script: ${pythonScriptPath} with image: ${imagePath} and name: ${name}`);

  let pythonStdout = '';
  let pythonStderr = '';

  const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, imagePath, name]);

  pythonProcess.stdout.on('data', (data) => {
    pythonStdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    pythonStderr += data.toString();
  });

  pythonProcess.on('close', async (code) => {
    // IMPORTANT: Do NOT delete the uploaded image here — keep it permanently in uploads

    if (responseSent) return;

    try {
      const pythonResult = JSON.parse(pythonStdout);

      if (pythonResult.success) {
        const { name, face_encoding, image_binary_base64 } = pythonResult.data;

        let imageBuffer = null;
        if (image_binary_base64) {
          imageBuffer = Buffer.from(image_binary_base64, 'base64');
        }

        try {
          await RegisteredUser.create({
            name: name,
            timestamp: new Date(),
            face_encoding: face_encoding,
            image_data: imageBuffer,
            image_path: path.basename(imagePath)  // Save filename for permanent storage reference
          });

          console.log(`✅ ${name} registered successfully in MongoDB.`);
          res.status(200).json({ success: true, message: 'Face registered successfully!', registeredName: name });
          responseSent = true;

        } catch (dbErr) {
          console.error('❌ MongoDB insertion error:', dbErr);
          res.status(500).json({ success: false, message: `Database error during registration: ${dbErr.message}` });
          responseSent = true;
        }

      } else {
        console.warn('Python script reported failure:', pythonResult.message);
        res.status(400).json({ success: false, message: pythonResult.message });
        responseSent = true;
      }

    } catch (parseError) {
      console.error(`❌ Error parsing Python script output as JSON: ${parseError.message}`);
      console.error('Python stdout (raw):', pythonStdout);
      console.error('Python stderr (raw):', pythonStderr);
      res.status(500).json({ success: false, message: `Internal server error during processing: ${pythonStderr.trim() || 'Invalid Python output.'}` });
      responseSent = true;
    }
  });

  pythonProcess.on('error', (err) => {
    console.error('❌ Failed to start Python child process:', err);
    // Clean up uploaded file if python process fails to start
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (unlinkErr) => {
        if (unlinkErr) console.error(`❌ Error deleting temporary file ${imagePath} after Python process error:`, unlinkErr);
      });
    }
    if (!responseSent) {
      res.status(500).json({ success: false, message: `Failed to execute registration script: ${err.message}` });
      responseSent = true;
    }
  });
});

// --- END NEW: Face Registration Endpoint ---


// Start the Express server using the 'server' instance, not 'app'
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});