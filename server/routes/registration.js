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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// --- Helper: Stream Python stdout/stderr to WS ---
function streamPythonProcess(process, name, prefix) {
  return new Promise((resolve, reject) => {
    let stdout = '', stderr = '', buffer = '';

    process.stdout.on('data', data => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep incomplete line

      lines.forEach(line => {
        if (!line.trim()) return;
        try {
          const msg = JSON.parse(line);
          sendWSUpdate('registration_status', name, `[${prefix}][${msg.success ? 'SUCCESS' : msg.status?.toUpperCase() || 'INFO'}] ${msg.message || msg.milestone || line}`);
        } catch {
          sendWSUpdate('registration_status', name, `[${prefix}] ${line}`);
        }
        stdout += line + '\n';
      });
    });

    process.stderr.on('data', data => {
      const text = data.toString();
      stderr += text;
      sendWSUpdate('registration_status', name, `[${prefix}][ERR] ${text}`);
    });

    process.on('close', () => {
      if (buffer.trim()) {
        try {
          const msg = JSON.parse(buffer);
          sendWSUpdate('registration_status', name, `[${prefix}][${msg.success ? 'SUCCESS' : msg.status?.toUpperCase() || 'INFO'}] ${msg.message || msg.milestone || buffer}`);
        } catch {
          sendWSUpdate('registration_status', name, `[${prefix}] ${buffer}`);
        }
      }

      try {
        const resultJsonLine = stdout.trim().split('\n').reverse().find(line => {
          try { JSON.parse(line); return true; } catch { return false; }
        });
        const result = JSON.parse(resultJsonLine);
        resolve({ ...result, stderr });
      } catch (err) {
        reject(new Error(`Failed to parse ${prefix} result: ${err.message}\nStdout: ${stdout}\nStderr: ${stderr}`));
      }
    });

    process.on('error', err => reject(err));
  });
}

router.post('/register-face', upload.single('image'), async (req, res) => {
  const { name } = req.body;
  const imagePath = req.file?.path;
  if (!name || !imagePath) return res.status(400).json({ success: false, message: 'Name and image are required.' });

  const fingerprint_id = Math.floor(Math.random() * 199) + 1;

  try {
    // --- Face registration ---
    sendWSUpdate('registration_status', name, 'Face registration started...');
    const faceProcess = spawn('python3', [path.join(__dirname, '..', 'register_user.py'), imagePath, name]);
    const faceResult = await streamPythonProcess(faceProcess, name, 'Face');

    if (!faceResult.success) {
      sendWSUpdate('registration_status', name, `❌ Face registration failed: ${faceResult.message}`);
      return res.status(200).json({ success: false, message: faceResult.message, details: faceResult.stderr });
    }
    sendWSUpdate('registration_status', name, '✅ Face registered successfully!');

    // --- Fingerprint enrollment ---
    sendWSUpdate('registration_status', name, `Fingerprint enrollment started (ID: ${fingerprint_id})...`);
    const fpProcess = spawn('python3', [path.join(__dirname, '..', 'enroll_fingerprint.py'), fingerprint_id, name]);
    const fpResult = await streamPythonProcess(fpProcess, name, 'Fingerprint');

    if (!fpResult.success) {
      sendWSUpdate('registration_status', name, `❌ Fingerprint enrollment failed: ${fpResult.message}`);
      return res.status(200).json({ success: false, message: fpResult.message, details: fpResult.stderr });
    }
    sendWSUpdate('registration_status', name, '✅ Fingerprint enrolled successfully!');

    // --- Save to DB ---
    const userDoc = await RegisteredUser.create({
      name,
      face_encoding: faceResult.data.encoding,
      image_data: fs.existsSync(imagePath) ? fs.readFileSync(imagePath) : null,
      image_path: path.basename(imagePath),
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

  } catch (err) {
    console.error("Registration route error:", err);
    sendWSUpdate('registration_status', name, `❌ Registration failed: ${err.message}`);
    return res.status(500).json({ success: false, message: 'Server error during registration.', error: err.message });
  }
});

module.exports = router;
