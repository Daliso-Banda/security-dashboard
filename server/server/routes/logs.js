const express = require('express');
const LoginLog = require('../models/LoginLog');
const router = express.Router();

// Get all logs
router.get('/logs', async (req, res) => {
  try {
    const logs = await LoginLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
