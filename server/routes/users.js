const express = require('express');
const RegisteredUser = require('../models/RegisteredUser');
const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await RegisteredUser.find().sort({ timestamp: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;