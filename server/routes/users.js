const express = require('express');
const RegisteredUser = require('../models/RegisteredUser');
const router = express.Router();

// Get all users (include _id)
router.get('/users', async (req, res) => {
  try {
    const users = await RegisteredUser.find({}, { name: 1, privilege: 1, fingerprint_id: 1, timestamp: 1, _id: 1, image_filename: 1 }).sort({ timestamp: -1 });

    // Map users to include static image_url
    const usersWithImage = users.map(user => {
      return {
        ...user.toObject(),
        image_url: user.image_filename
          ? `http://10.252.154.149:3000/uploads/${user.image_filename}`
          : null, // fallback if no image
      };
    });

    res.json({ success: true, users: usersWithImage });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error: " + err.message });
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
