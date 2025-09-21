const express = require('express');
const RegisteredUser = require('../models/RegisteredUser');
const router = express.Router();

// Get all users (include _id)
router.get('/users', async (req, res) => {
  try {
    const users = await RegisteredUser.find({}, { name: 1, privilege: 1, fingerprint_id: 1, timestamp: 1, _id: 1 }).sort({ timestamp: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "not sure" + err.message });
  }
});

// Delete a user by ID
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await RegisteredUser.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get user encoding by fingerprint ID
router.get('/user-encoding/:fingerprint_id', async (req, res) => {
  const user = await RegisteredUser.findOne({ fingerprint_id: Number(req.params.fingerprint_id) });
  if (!user) return res.status(404).json({ encoding: null });
  res.json({ encoding: user.face_encoding });
});

module.exports = router;