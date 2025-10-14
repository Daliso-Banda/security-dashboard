const express = require("express");
const { sendWSUpdate } = require("../ws");
const router = express.Router();

/**
 * POST /api/access/command
 * Send lock/unlock command to a device
 */
router.post("/access/command", async (req, res) => {
  try {
    const { device, command } = req.body;

    if (!device || !command) {
      return res.status(400).json({
        success: false,
        message: "Device and command are required",
      });
    }

    // Broadcast via WebSocket
    sendWSUpdate("accessCommand", device, command);

    // Respond to REST client
    res.json({
      success: true,
      message: `Command '${command}' sent to ${device}`,
    });
  } catch (err) {
    console.error("Access command error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/access/devices
 * List devices (static for now)
 */
router.get("/access/devices", async (req, res) => {
  try {
    const devices = [
      { id: "door1", name: "Front Door", status: "locked" },
      { id: "door2", name: "Back Door", status: "locked" },
      { id: "gate", name: "Main Gate", status: "locked" },
    ];
    res.json({ success: true, devices });
  } catch (err) {
    console.error("Devices fetch error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
