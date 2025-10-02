import React, { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import {
  Button,
  TextField,
  Snackbar,
  Alert,
  Typography,
  Box,
  Paper,
  Stack,
  Divider,
  useTheme,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import axios from "axios";

const videoConstraints = { width: 480, height: 360, facingMode: "user" };

export default function RegisterUser() {
  const webcamRef = useRef(null);
  const wsRef = useRef(null);
  const theme = useTheme();
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [capturedImageBlob, setCapturedImageBlob] = useState(null);

  const [persistentSnackbar, setPersistentSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [snackbarQueue, setSnackbarQueue] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const [progressLog, setProgressLog] = useState([]);
  const [pendingRegistrationName, setPendingRegistrationName] = useState(null);

  // ---------------- WebSocket ----------------
  useEffect(() => {
    wsRef.current = new WebSocket("ws://10.252.154.149:3000/ws");

    wsRef.current.onopen = () => console.log("WebSocket connected");

    wsRef.current.onmessage = (event) => {
      const rawMessages = event.data.split(/(?<=})\s*(?={)/);

      rawMessages.forEach((msg) => {
        let isFingerprint = false;
        if (msg.startsWith("[Fingerprint]")) {
          isFingerprint = true;
          msg = msg.replace(/^\[Fingerprint\]\s*/, "");
        }

        let data;
        try {
          data = JSON.parse(msg);
        } catch {
          return; // Ignore non-JSON messages
        }

        if (data.name && data.name !== pendingRegistrationName) return;

        // Persistent popup for prompts/start
        if (["prompt", "start"].includes(data.type)) {
          setPersistentSnackbar({ open: true, message: data.message, severity: "info" });
        }

        // Close persistent popup on done
        if (data.type === "done") {
          setPersistentSnackbar({ open: false, message: "", severity: "info" });
        }

        // ---------------- Transient popups ----------------
        if (data.type === "face_result") {
          // Face registration result popup
          setSnackbarQueue((prev) => [
            ...prev,
            { message: data.message, severity: data.success === false ? "error" : "success" },
          ]);
        }

        // Add progress log for important messages
        if (["prompt", "start", "status", "done"].includes(data.type) || isFingerprint) {
          setProgressLog((prev) => [...prev, data.message]);
        }
      });
    };

    wsRef.current.onerror = (err) => console.error("WebSocket error:", err);

    return () => wsRef.current.close();
  }, [pendingRegistrationName]);

  // ---------------- Snackbar queue ----------------
  useEffect(() => {
    if (snackbarQueue.length === 0 || snackbar.open) return;
    const next = snackbarQueue[0];
    setSnackbar({ open: true, message: next.message, severity: next.severity });
    setSnackbarQueue((prev) => prev.slice(1));
  }, [snackbarQueue, snackbar.open]);

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  // ---------------- Webcam ----------------
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

    const blob = new Blob([ab], { type: mimeString });
    setCapturedImageBlob(blob);

    setSnackbarQueue((prev) => [...prev, { message: "📸 Image captured successfully.", severity: "success" }]);
  }, []);

  // ---------------- Submit Registration ----------------
  const handleSubmit = async () => {
    if (!name || !userId || !capturedImageBlob) {
      setSnackbarQueue((prev) => [...prev, { message: "⚠️ Fill all fields and capture a photo.", severity: "warning" }]);
      return;
    }

    setProgressLog([]);
    setPendingRegistrationName(name);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("userId", userId);
    formData.append("image", capturedImageBlob, `${name}.jpg`);

    try {
      setSnackbarQueue((prev) => [...prev, { message: "🟡 Starting face registration...", severity: "info" }]);
      const response = await axios.post("http://10.252.154.149:3000/api/register-face", formData);

      // Overall registration result popup
      const resultMessage = response.data.success
        ? `✅ User "${name}" registered successfully!`
        : `❌ User registration failed: ${response.data.message || "Unknown error"}`;
      setSnackbarQueue((prev) => [...prev, { message: resultMessage, severity: response.data.success ? "success" : "error" }]);

      setName("");
      setUserId("");
      setCapturedImageBlob(null);
    } catch (err) {
      console.error("Registration error:", err);
      setSnackbarQueue((prev) => [...prev, { message: "❌ Server error during registration.", severity: "error" }]);
    }
  };

  const handleRetake = () => {
    setCapturedImageBlob(null);
    setSnackbarQueue((prev) => [...prev, { message: "🔁 Webcam reactivated. Retake your photo.", severity: "info" }]);
  };

  // ---------------- Render ----------------
  return (
    <Box sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh", py: 6, px: 2 }}>
      <Paper elevation={5} sx={{ maxWidth: 700, mx: "auto", p: 5, borderRadius: 4, backgroundColor: "#fff" }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>👤 New User Registration</Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>Capture user details and face to register securely.</Typography>

        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth variant="outlined" />
            <TextField label="User ID / Phone" value={userId} onChange={(e) => setUserId(e.target.value)} fullWidth variant="outlined" />
          </Stack>

          <Divider />

          {capturedImageBlob ? (
            <>
              <img src={URL.createObjectURL(capturedImageBlob)} alt="Captured" style={{ width: "100%", maxWidth: 480, height: 360, objectFit: "cover", borderRadius: 6, margin: "0 auto" }} />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="outlined" color="secondary" onClick={handleRetake}>Retake</Button>
                <Button variant="contained" color="primary" onClick={handleSubmit}>Submit</Button>
              </Stack>
            </>
          ) : (
            <Box textAlign="center">
              <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" width={480} height={360} videoConstraints={videoConstraints} style={{ borderRadius: 6, boxShadow: theme.shadows[2] }} />
              <Button variant="contained" sx={{ mt: 2 }} size="large" onClick={handleCapture}>📸 Capture Photo</Button>
            </Box>
          )}

          {progressLog.length > 0 && (
            <Paper elevation={3} sx={{ maxHeight: 250, overflowY: "auto", p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>📋 Registration Progress:</Typography>
              <List dense>{progressLog.map((msg, index) => <ListItem key={index}><ListItemText primary={msg} /></ListItem>)}</List>
            </Paper>
          )}
        </Stack>
      </Paper>

      {/* Persistent popup */}
      <Snackbar open={persistentSnackbar.open} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
        <Alert severity={persistentSnackbar.severity} variant="filled" sx={{ width: "100%", fontWeight: 500, fontSize: "1rem", boxShadow: 3 }}>
          {persistentSnackbar.message}
        </Alert>
      </Snackbar>

      {/* Transient snackbars */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} variant="filled" sx={{ width: "100%", fontWeight: 500, fontSize: "1rem", boxShadow: 3 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
