import React, { useState, useEffect, useRef } from 'react';
import {
  Typography,
  Box,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { PlayArrow, CameraAlt } from '@mui/icons-material';
import axios from 'axios';

export default function FaceRegistration() {
  const [name, setName] = useState('');
  const [capturedImageBlob, setCapturedImageBlob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const startWebcam = async () => {
    setCapturedImageBlob(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      showSnackbar("Could not access webcam. Please check permissions.", "error");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam();
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const capturedFile = new File([blob], `webcam_capture_${Date.now()}.jpeg`, { type: 'image/jpeg' });
          setCapturedImageBlob(capturedFile);
          showSnackbar("Image captured successfully!", "success");
          stopWebcam();
        } else {
          showSnackbar("Failed to capture image.", "error");
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setSnackbarOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      showSnackbar("Please enter a name.", "warning");
      return;
    }
    if (!capturedImageBlob) {
      showSnackbar("Please capture an image from the webcam.", "warning");
      return;
    }

    setLoading(true);
    showSnackbar("Registering face...", "info");

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', capturedImageBlob);

    try {
      const response = await axios.post('http://localhost:3000/api/register-face', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        showSnackbar(`Successfully registered: ${response.data.registeredName}`, "success");
        setName('');
        setCapturedImageBlob(null);
        startWebcam();
      } else {
        showSnackbar(response.data.message || "Registration failed.", "error");
      }
    } catch (error) {
      console.error("Error during face registration:", error);
      const errorMessage = error.response?.data?.message || "An unexpected error occurred during registration.";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#232946',
        backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
        backgroundSize: 'cover',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={5}
        sx={{
          maxWidth: 600,
          width: '90%',
          p: 4,
          borderRadius: 4,
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, color: 'blue' }}
        >
          Face Registration
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            helperText="Enter the full name of the person to register."
            sx={{
              bgcolor: '#fff',
              borderRadius: 1,
            }}
          />

          <Box
            sx={{
              mt: 2,
              borderRadius: 3,
              overflow: 'hidden',
              border: '2px solid #4c5c68',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              maxHeight: 360,
              position: 'relative',
            }}
          >
            {capturedImageBlob ? (
              <Box
                component="img"
                src={URL.createObjectURL(capturedImageBlob)}
                alt={`Captured image of ${name || 'user'}`}
                sx={{ width: '100%', height: 'auto', display: 'block' }}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: 'auto', backgroundColor: 'black' }}
              />
            )}
          </Box>

          <Box
            sx={{
              mt: 2,
              display: 'flex',
              justifyContent: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            {!stream && !capturedImageBlob && (
              <Button
                variant="contained"
                color="primary"
                onClick={startWebcam}
                startIcon={<PlayArrow />}
                disabled={loading}
                sx={{
                  px: 4,
                  fontWeight: 600,
                  ':hover': { bgcolor: '#1e88e5' },
                }}
              >
                Start Webcam
              </Button>
            )}

            {stream && !capturedImageBlob && (
              <Button
                variant="contained"
                color="secondary"
                onClick={handleCapture}
                startIcon={<CameraAlt />}
                disabled={loading}
                sx={{
                  px: 4,
                  fontWeight: 600,
                  ':hover': { bgcolor: '#d32f2f' },
                }}
              >
                Capture Image
              </Button>
            )}

            {capturedImageBlob && (
              <Button
                variant="outlined"
                onClick={() => {
                  setCapturedImageBlob(null);
                  startWebcam();
                }}
                startIcon={<PlayArrow />}
                disabled={loading}
                sx={{
                  px: 4,
                  fontWeight: 600,
                  color: '#f5f6fa',
                  borderColor: '#7f8c8d',
                  ':hover': { borderColor: '#95a5a6', color: '#ecf0f1' },
                }}
              >
                Retake
              </Button>
            )}
          </Box>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          <Button
            type="submit"
            variant="contained"
            color="success"
            fullWidth
            disabled={loading || !capturedImageBlob || !name.trim()}
            sx={{ mt: 3, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Register Face"}
          </Button>
        </form>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
