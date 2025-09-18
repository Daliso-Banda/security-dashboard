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
} from "@mui/material";
import axios from "axios";

const videoConstraints = {
  width: 480,
  height: 360,
  facingMode: "user",
};

export default function RegisterUser() {
  const webcamRef = useRef(null);
  const theme = useTheme();
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [capturedImageBlob, setCapturedImageBlob] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [pendingFingerprintName, setPendingFingerprintName] = useState(null);

  useEffect(() => {
    const ws = new WebSocket("ws://10.24.91.149:5175/ws");
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "fingerprint_result" && data.name === pendingFingerprintName) {
        showSnackbar(data.success
          ? `✅ Registration completed for ${data.name}`
          : `❌ Registration failed for ${data.name}`, data.success ? "success" : "error");
        setPendingFingerprintName(null);
      }
    };
    ws.onerror = (err) => console.error("WebSocket error:", err);
    return () => ws.close();
  }, [pendingFingerprintName]);

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    setCapturedImageBlob(blob);
    showSnackbar("📸 Image captured successfully.", "success");
  }, []);

  const handleSubmit = async () => {
    if (!name || !userId || !capturedImageBlob) {
      showSnackbar("⚠️ Please fill all fields and capture a photo.", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("userId", userId);
    formData.append("image", capturedImageBlob, `${name}.jpg`);

    try {
      const res = await axios.post("http://localhost:3000/api/register-face", formData);
      if (res.data.success) {
        showSnackbar("✅ Face registered. Awaiting fingerprint...", "info");
        setPendingFingerprintName(name);
        setName("");
        setUserId("");
        setCapturedImageBlob(null);
      } else {
        showSnackbar(res.data.message || "Face registration failed.", "error");
      }
    } catch (err) {
      console.error("Face registration error:", err);
      showSnackbar("❌ Server error during registration.", "error");
    }
  };

  const handleRetake = () => {
    setCapturedImageBlob(null);
    showSnackbar("🔁 Webcam reactivated. Retake your photo.", "info");
  };

  return (
    <Box sx={{ backgroundColor: "#f4f6f8", minHeight: "100vh", py: 6, px: 2 }}>
      <Paper
        elevation={5}
        sx={{
          maxWidth: 700,
          mx: "auto",
          p: 5,
          borderRadius: 4,
          backgroundColor: "#ffffff",
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight={700}>
          👤 New User Registration
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          Capture user details and face to register securely.
        </Typography>

        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="User ID / Phone"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              fullWidth
              variant="outlined"
            />
          </Stack>

          <Divider />

          {capturedImageBlob ? (
            <>
              <img
                src={URL.createObjectURL(capturedImageBlob)}
                alt="Captured"
                style={{
                  width: "100%",
                  maxWidth: 480,
                  height: 360,
                  objectFit: "cover",
                  borderRadius: 6,
                  margin: "0 auto",
                }}
              />
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button variant="outlined" color="secondary" onClick={handleRetake}>
                  Retake
                </Button>
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                  Submit
                </Button>
              </Stack>
            </>
          ) : (
            <Box textAlign="center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={480}
                height={360}
                videoConstraints={videoConstraints}
                style={{ borderRadius: 6, boxShadow: theme.shadows[2] }}
              />
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                size="large"
                onClick={handleCapture}
              >
                📸 Capture Photo
              </Button>
            </Box>
          )}

          {pendingFingerprintName && (
            <Alert severity="info" sx={{ mt: 3 }}>
              Face registered for <strong>{pendingFingerprintName}</strong>. Please scan the fingerprint to complete registration.
            </Alert>
          )}
        </Stack>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{
            width: "100%",
            fontWeight: 500,
            fontSize: "1rem",
            boxShadow: 3,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
