const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { spawn } = require('child_process');
const RegisteredUser = require('../models/RegisteredUser');
const { sendWSUpdate } = require('../ws');

const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/register-face', upload.single('image'), async (req, res) => {
  const { name } = req.body;
  const imagePath = req.file?.path;
  if (!name || !imagePath) return res.status(400).json({ success: false, message: 'Name and image are required.' });

  const fingerprint_id = Math.floor(Math.random() * 199) + 1;
  try {
    sendWSUpdate('registration_status', name, 'Face registration started...');
    const faceResult = await new Promise((resolve, reject) => {
      const faceProcess = spawn('python3', [path.join(__dirname, '..', 'register_user.py'), imagePath, name]);
      let stdout = '', stderr = '';
      faceProcess.stdout.on('data', data => stdout += data.toString());
      faceProcess.stderr.on('data', data => stderr += data.toString());
      faceProcess.on('close', code => {
        try {
          const jsonLine = stdout.trim().split('\n').pop();
          const result = JSON.parse(jsonLine);
          if (!result.success) reject(new Error(result.message));
          else resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse face registration result.'));
        }
      });
      faceProcess.on('error', err => reject(err));
    });
    sendWSUpdate('registration_status', name, '✅ Face registered successfully!');

    sendWSUpdate('registration_status', name, `Fingerprint enrollment started (ID: ${fingerprint_id})...`);
    const fpResult = await new Promise((resolve, reject) => {
      const fpProcess = spawn('python3', [path.join(__dirname, '..', 'enroll_fingerprint.py'), fingerprint_id, name]);
      let stdout = '', stderr = '';
      fpProcess.stdout.on('data', data => stdout += data.toString());
      fpProcess.stderr.on('data', data => stderr += data.toString());
      fpProcess.on('close', code => {
        try {
          const jsonLine = stdout.trim().split('\n').pop();
          const result = JSON.parse(jsonLine);
          if (!result.success) reject(new Error(result.message));
          else resolve(result);
        } catch (err) {
          reject(new Error('Failed to parse fingerprint enrollment result.'));
        }
      });
      fpProcess.on('error', err => reject(err));
    });
    sendWSUpdate('registration_status', name, '✅ Fingerprint enrolled successfully!');

    const userDoc = await RegisteredUser.create({
      name,
      face_encoding: faceResult.data.encoding,
      image_data: fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null,
      image_path: path.basename(imagePath),
      fingerprint_id
    });
    sendWSUpdate('registration_status', name, '✅ User saved to DB successfully.');

    res.status(200).json({
      success: true,
      message: 'Face and fingerprint registered successfully.',
      data: {
        name,
        embedding_length: faceResult.data.embedding_length,
        fingerprint_id,
        user_id: userDoc._id
      }
    });

  } catch (err) {
    sendWSUpdate('registration_status', name, `❌ Registration failed: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Registration failed.', error: err.message });
  }
});

module.exports = router;