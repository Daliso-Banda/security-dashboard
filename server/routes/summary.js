const express = require('express');
const RegisteredUser = require('../models/RegisteredUser');
const LoginLog = require('../models/LoginLog');
const Alert = require('../models/Alert');
const router = express.Router();

/**
 * PIE CHART: Access attempts summary
 * Frontend calls: GET /api/summary
 * Returns array -> [{ name, value, color }]
 */
router.get('/summary', async (req, res) => {
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

/**
 * EXTRA SUMMARY: general stats
 * Example: GET /api/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const userCount = await RegisteredUser.countDocuments();
    const logCount = await LoginLog.countDocuments();
    const alertCount = await Alert.countDocuments();

    res.json({
      userCount,
      logCount,
      alertCount
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * BAR CHART: access attempts trend by day
 * Frontend calls: GET /api/access-trend
 */
router.get('/access-trend', async (req, res) => {
  try {
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
