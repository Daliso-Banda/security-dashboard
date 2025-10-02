const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const { spawn } = require("child_process");
const { sendWSUpdate } = require("../ws"); // WebSocket helper
const RegisteredUser = require("../models/RegisteredUser");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/register-face", upload.single("image"), async (req, res) => {
  const { name, userId } = req.body;
  const imagePath = req.file?.path;

  if (!name || !imagePath || !userId) {
    return res.status(400).json({ success: false, message: "Name, UserId, and image required" });
  }

  const fingerprint_id = Math.floor(Math.random() * 199) + 1;

  try {
    sendWSUpdate("registration_status", name, "🟡 Starting face recognition...", "status");

    // ---------------- Face registration ----------------
    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", fs.createReadStream(imagePath));

    const pyRes = await axios.post("http://127.0.0.1:5001/register-face", formData, {
      headers: formData.getHeaders(),
    });

    if (!pyRes.data.success) {
      sendWSUpdate("registration_status", name, `❌ Face registration failed: ${pyRes.data.message}`, "error");
      return res.status(200).json(pyRes.data);
    }

    sendWSUpdate(
      "registration_status",
      name,
      "✅ Face registered successfully! Place your finger on the scanner...",
      "prompt"
    );

    // ---------------- Fingerprint enrollment ----------------
    const fpProcess = spawn("python3", ["./enroll_fingerprint.py", fingerprint_id, name]);

    fpProcess.stdout.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line) => {
        try {
          const event = JSON.parse(line);
          // Map Python event to frontend step
          const step = event.event || "registration_status";
          sendWSUpdate(step, name, event.message, step, event.success);
        } catch {
          // Fallback for non-JSON lines
          sendWSUpdate("registration_status", name, `[Fingerprint] ${line}`, "status");
        }
      });
    });

    fpProcess.stderr.on("data", (data) => {
      const lines = data.toString().trim().split("\n");
      lines.forEach((line) => {
        sendWSUpdate("registration_status", name, `[Fingerprint][ERR] ${line}`, "error");
      });
    });

    fpProcess.on("close", async (code) => {
      if (code !== 0) {
        sendWSUpdate("registration_status", name, `❌ Fingerprint enrollment failed`, "error");
        return res.status(200).json({ success: false, message: "Fingerprint failed" });
      }

      sendWSUpdate("registration_status", name, "✅ Fingerprint enrolled successfully!", "done");

      // ---------------- Save user to DB ----------------
      const userDoc = await RegisteredUser.create({
        name,
        userId,
        face_encoding: pyRes.data.data.encoding,
        image_data: fs.readFileSync(imagePath),
        image_filename: path.basename(imagePath),
        fingerprint_id,
      });

      sendWSUpdate("registration_status", name, "✅ User saved successfully.", "done");

      return res.status(200).json({
        success: true,
        message: "Face and fingerprint registered successfully.",
        data: { name, fingerprint_id, user_id: userDoc._id },
      });
    });
  } catch (err) {
    sendWSUpdate("registration_status", name, `❌ Registration error: ${err.message}`, "error");
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
