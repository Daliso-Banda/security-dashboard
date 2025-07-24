const mongoose = require('mongoose');
const express = require('express');
const app = express();
app.use(express.json()); // For parsing JSON bodies

// --- Alert Model ---
const alertSchema = new mongoose.Schema({
  message: String,
  device: String,
  command: String,
  timestamp: { type: Date, default: Date.now }
});
const Alert = mongoose.model('Alert', alertSchema);

// --- MongoDB Connection ---
const MONGO_URI = 'mongodb://10.251.211.92:27017/face_system';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB at 10.251.211.92'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// --- MQTT Broker Connection ---
const mqtt = require('mqtt');
const mqttClient = mqtt.connect('mqtt://10.251.211.92:1883'); // Broker IP and port

console.log("🚀 Script running...");

mqttClient.on('connect', () => {
  console.log('✅ Connected to external MQTT broker at 10.251.211.92');
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

// --- API Endpoints (CRUD) ---

// CREATE Alert
app.post('/api/alerts', async (req, res) => {
  try {
    const { message, device, command } = req.body;
    const alert = new Alert({ message, device, command });
    await alert.save();
    // Publish to MQTT
    mqttClient.publish('security/alerts', JSON.stringify({ message, device, command, timestamp: alert.timestamp }));
    res.status(201).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// READ All Alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ timestamp: -1 });
    res.status(200).json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// READ Single Alert by ID
app.get('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.status(200).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE Alert by ID
app.put('/api/alerts/:id', async (req, res) => {
  try {
    const { message, device, command } = req.body;
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { message, device, command },
      { new: true, runValidators: true }
    );
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.status(200).json({ success: true, alert });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE Alert by ID
app.delete('/api/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    res.status(200).json({ success: true, message: 'Alert deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});