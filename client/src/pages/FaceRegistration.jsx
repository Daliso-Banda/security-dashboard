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
  List,
  ListItem,
  ListItemText,
  Fade,
} from "@mui/material";
import axios from "axios";

const serverIP = import.meta.env.VITE_SERVER_IP;
const videoConstraints = { width: 480, height: 360, facingMode: "user" };

export default function RegisterUser() {
  const webcamRef = useRef(null);
  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [capturedImageBlob, setCapturedImageBlob] = useState(null);
  const [snackbarQueue, setSnackbarQueue] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [progressLog, setProgressLog] = useState([]);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Snackbar queue logic
  useEffect(() => {
    if (snackbarQueue.length === 0 || snackbar.open) return;
    const next = snackbarQueue[0];
    setSnackbar({ open: true, message: next.message, severity: next.severity });
    setSnackbarQueue((prev) => prev.slice(1));
  }, [snackbarQueue, snackbar.open]);

  const handleSnackbarClose = () => setSnackbar({ ...snackbar, open: false });

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    console.log("📸 Capturing image from webcam");

    const byteString = atob(imageSrc.split(",")[1]);
    const mimeString = imageSrc.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);

    const blob = new Blob([ab], { type: mimeString });
    setCapturedImageBlob(blob);

    console.log("Captured Blob:", blob);

    setSnackbarQueue((prev) => [
      ...prev,
      { message: "📸 Image captured successfully.", severity: "success" },
    ]);
  }, []);

  const handleSubmit = async () => {
    if (!name || !userId || !capturedImageBlob) {
      setSnackbarQueue((prev) => [
        ...prev,
        { message: "⚠️ Fill all fields and capture a photo.", severity: "warning" },
      ]);
      return;
    }

    setProgressLog([]);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("userId", userId);
    formData.append("image", capturedImageBlob, `${name}.jpg`);

    // Log what is being sent
    console.log("Submitting registration:");
    console.log("Name:", name);
    console.log("User ID:", userId);
    console.log("Image Blob:", capturedImageBlob);

    try {
      setSnackbarQueue((prev) => [
        ...prev,
        { message: "🟡 Starting face registration...", severity: "info" },
      ]);
      const response = await axios.post(
        `http://${serverIP}:3000/api/register-face`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Server response:", response.data);

      setSnackbarQueue((prev) => [
        ...prev,
        {
          message: response.data.success
            ? `✅ User "${name}" registered successfully!`
            : `❌ Registration failed: ${response.data.message || "Unknown error"}`,
          severity: response.data.success ? "success" : "error",
        },
      ]);

      setName("");
      setUserId("");
      setCapturedImageBlob(null);
    } catch (err) {
      console.error("Registration error:", err);
      setSnackbarQueue((prev) => [
        ...prev,
        { message: "❌ Server error during registration.", severity: "error" },
      ]);
    }
  };

  const handleRetake = () => {
    setCapturedImageBlob(null);
    console.log("🔁 Retake photo triggered");
    setSnackbarQueue((prev) => [
      ...prev,
      { message: "🔁 Webcam reactivated. Retake your photo.", severity: "info" },
    ]);
  };

  return (
    <Box sx={{ backgroundColor: "#f0f2f5", minHeight: "100vh", py: 6, px: 2 }}>
      <Fade in={fadeIn} timeout={800}>
        <Paper
          elevation={6}
          sx={{
            maxWidth: 720,
            mx: "auto",
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            boxShadow: "0 6px 25px rgba(0,0,0,0.1)",
            backgroundColor: "#fff",
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom textAlign="center">
            👤 New User Registration
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4} textAlign="center">
            Capture user details and face for secure registration.
          </Typography>

          <Stack spacing={4}>
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
                <Box
                  component="img"
                  src={URL.createObjectURL(capturedImageBlob)}
                  alt="Captured"
                  sx={{
                    width: "100%",
                    maxWidth: 480,
                    height: 360,
                    objectFit: "cover",
                    borderRadius: 3,
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    mx: "auto",
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
                  style={{
                    borderRadius: 6,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  }}
                />
                <Button
                  variant="contained"
                  size="large"
                  sx={{ mt: 3, px: 4 }}
                  onClick={handleCapture}
                >
                  📸 Capture Photo
                </Button>
              </Box>
            )}

            {progressLog.length > 0 && (
              <Paper elevation={3} sx={{ maxHeight: 250, overflowY: "auto", p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>
                  📋 Registration Progress:
                </Typography>
                <List dense>
                  {progressLog.map((msg, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={msg} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Stack>
        </Paper>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%", fontWeight: 500, fontSize: "1rem", boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
