const express = require('express');
const RegisteredUser = require('../models/RegisteredUser');
const LoginLog = require('../models/LoginLog');
const Alert = require('../models/Alert');
const router = express.Router();

// Get summary stats
router.get('/summary', async (req, res) => {
  try {
    const userCount = await RegisteredUser.countDocuments();
    const logCount = await LoginLog.countDocuments();
    const alertCount = await Alert.countDocuments();
    res.json({
      success: true,
      summary: { userCount, logCount, alertCount }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;