const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');
const { spawn } = require('child_process');
const RegisteredUser = require('../models/RegisteredUser');
const { sendWSUpdate } = require('../ws');
const express = require('express');
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.post('/register-face', upload.single('image'), async (req, res) => {
  const { name } = req.body;
  const imagePath = req.file?.path;

  if (!name || !imagePath) {
    return res.status(400).json({ success: false, message: 'Name and image are required.' });
  }

  const fingerprint_id = Math.floor(Math.random() * 199) + 1;

  try {
    // --- Call Python FastAPI service for face registration ---
    sendWSUpdate('registration_status', name, 'Face registration started...');

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", fs.createReadStream(imagePath));

    const pyRes = await axios.post("http://localhost:5001/register-face", formData, {
      headers: formData.getHeaders(),
    });

    const faceResult = pyRes.data;
    if (!faceResult.success) {
      sendWSUpdate('registration_status', name, `❌ Face registration failed: ${faceResult.message}`);
      return res.status(200).json(faceResult);
    }

    sendWSUpdate('registration_status', name, '✅ Face registered successfully!');

    // --- Fingerprint enrollment (still using spawn for now) ---
    sendWSUpdate('registration_status', name, `Fingerprint enrollment started (ID: ${fingerprint_id})...`);
    const fpProcess = spawn('python3', [path.join(__dirname, '..', 'enroll_fingerprint.py'), fingerprint_id, name]);

    fpProcess.stdout.on('data', data => {
      sendWSUpdate('registration_status', name, `[Fingerprint] ${data.toString()}`);
    });
    fpProcess.stderr.on('data', data => {
      sendWSUpdate('registration_status', name, `[Fingerprint][ERR] ${data.toString()}`);
    });

    fpProcess.on('close', async (code) => {
      if (code !== 0) {
        sendWSUpdate('registration_status', name, `❌ Fingerprint enrollment failed`);
        return res.status(200).json({ success: false, message: "Fingerprint enrollment failed" });
      }

      sendWSUpdate('registration_status', name, '✅ Fingerprint enrolled successfully!');

      // --- Save to DB ---
      const userDoc = await RegisteredUser.create({
        name,
        face_encoding: faceResult.data.encoding,
        image_data: fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null,
        image_filename: path.basename(imagePath),
        fingerprint_id
      });

      sendWSUpdate('registration_status', name, '✅ User saved to DB successfully.');

      return res.status(200).json({
        success: true,
        message: 'Face and fingerprint registered successfully.',
        data: {
          name,
          embedding_length: faceResult.data.embedding_length,
          fingerprint_id,
          user_id: userDoc._id
        }
      });
    });

  } catch (err) {
    console.error("Registration route error:", err);
    sendWSUpdate('registration_status', name, `❌ Registration failed: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
});

module.exports = router;
