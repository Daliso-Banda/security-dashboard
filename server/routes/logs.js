const express = require('express');
const LoginLog = require('../models/LoginLog');
const router = express.Router();
const SERVERIP = import.meta.env.VITE_SERVER_IP;
router.get('/logs', async (req, res) => {
  try {
    const logs = await LoginLog.find().sort({ timestamp: -1 }).limit(100);

    const logsWithImages = logs.map(log => {
      let image_url = null;

      // Use the correct field from your schema
      if (log.image_filename && log.image_filename.trim() !== '') {
        image_url = `http://${SERVERIP}:3000/access_logs/${log.image_filename.trim()}`;
      }

      return {
        _id: log._id,
        timestamp: log.timestamp,
        status: log.status,
        name: log.name,
        message: log.name || 'Unknown',
        device: "Camera",
        image_url,
      };
    });

    res.json({ success: true, logs: logsWithImages });
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
