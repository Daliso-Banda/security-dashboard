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

// Pie chart data: access attempts summary
router.get('/access-summary', async (req, res) => {
  try {
    const granted = await LoginLog.countDocuments({ status: 'granted' });
    const denied = await LoginLog.countDocuments({ status: 'denied' });
    res.json([
      { name: "Granted", value: granted, color: "#00b894" },
      { name: "Denied", value: denied, color: "#d63031" }
    ]);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bar chart data: access attempts trend by day
router.get('/access-trend', async (req, res) => {
  try {
    // Group by day, count attempts
    const trend = await LoginLog.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          Attempts: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);
    // Format for frontend
    const formatted = trend.map(item => ({
      day: item._id,
      Attempts: item.Attempts
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;