const express = require('express');
const LoginLog = require('../models/LoginLog');
const router = express.Router();

// Make sure Express serves the folder
// app.use('/access_logs', express.static(path.join(__dirname, '..', 'access_logs')));

router.get('/logs', async (req, res) => {
  try {
    const logs = await LoginLog.find().sort({ timestamp: -1 }).limit(100);

    const logsWithImages = logs.map(log => {
      let image_url = null;

      // Check that image_filename exists and is not empty
      if (log.image_filename && log.image_filename.trim() !== '') {
        image_url = `http://10.252.154.149:3000/access_logs/${log.image_filename}`;
      }

      return {
        _id: log._id,
        timestamp: log.timestamp,
        status: log.status,
        name: log.name,
        message: log.name,
        device: "Camera",
        image_url,
      };
    });

    res.json({ success: true, logs: logsWithImages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
