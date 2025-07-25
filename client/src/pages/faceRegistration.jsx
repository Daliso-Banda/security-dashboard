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
  IconButton,
} from '@mui/material';
import { PhotoCamera, PlayArrow, CameraAlt } from '@mui/icons-material'; // Added PlayArrow, CameraAlt icons
import axios from 'axios';

export default function FaceRegistration() {
  const [name, setName] = useState('');
  const [capturedImageBlob, setCapturedImageBlob] = useState(null); // Stores the captured image as a Blob
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');

  const videoRef = useRef(null); // Ref for the video element to display webcam feed
  const canvasRef = useRef(null); // Ref for the canvas element to capture image
  const [stream, setStream] = useState(null); // Stores the MediaStream from the webcam

  // --- Webcam Control Functions ---

  // Function to start the webcam feed
  const startWebcam = async () => {
    setCapturedImageBlob(null); // Clear any previously captured image
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

  // Function to stop the webcam feed
  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  // Effect hook to start webcam on mount and stop on unmount
  useEffect(() => {
    startWebcam();
    return () => {
      stopWebcam(); // Cleanup on unmount
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount


  // Function to capture image from webcam
  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      // Set canvas dimensions to match video feed
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame onto canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data as a Blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a File object from the Blob (needed for FormData)
          const capturedFile = new File([blob], `webcam_capture_${Date.now()}.jpeg`, { type: 'image/jpeg' });
          setCapturedImageBlob(capturedFile);
          showSnackbar("Image captured successfully!", "success");
        } else {
          showSnackbar("Failed to capture image.", "error");
        }
      }, 'image/jpeg', 0.9); // Image format and quality
    }
  };

  // --- Snackbar Control Functions ---
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // --- Form Submission Function ---
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      showSnackbar("Please enter a name.", "warning");
      return;
    }
    if (!capturedImageBlob) { // Check for captured image blob
      showSnackbar("Please capture an image from the webcam.", "warning");
      return;
    }

    setLoading(true);
    showSnackbar("Registering face...", "info");

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', capturedImageBlob); // Use the captured image blob

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
        // Restart webcam for next registration
        stopWebcam();
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
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#232946',
      backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")',
      backgroundSize: 'cover'
    }}>
      <Box component={Paper} elevation={4} sx={{
        p: 4,
        borderRadius: 4,
        maxWidth: 550, // Slightly wider for video
        width: '90%',
        boxShadow: 3,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600, color: '#2d3436', mb: 3 }}>
          Face Registration
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Full Name"
              variant="outlined"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />

            <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', mb: 2 }}>
              {capturedImageBlob ? (
                // Display captured image preview
                <Box
                  component="img"
                  src={URL.createObjectURL(capturedImageBlob)}
                  alt="Captured"
                  sx={{ width: '100%', height: 'auto', display: 'block' }}
                />
              ) : (
                // Display webcam feed
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted // Mute for no echo
                  style={{ width: '100%', height: 'auto', display: 'block', backgroundColor: 'black' }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                {!stream && !capturedImageBlob && ( // Show start button if no stream and no captured image
                    <Button
                        variant="contained"
                        onClick={startWebcam}
                        startIcon={<PlayArrow />}
                        disabled={loading}
                    >
                        Start Webcam
                    </Button>
                )}
                {stream && !capturedImageBlob && ( // Show capture button if stream is active and no image captured
                    <Button
                        variant="contained"
                        onClick={handleCapture}
                        startIcon={<CameraAlt />}
                        disabled={loading}
                    >
                        Capture Image
                    </Button>
                )}
                {capturedImageBlob && ( // Show retake button if image is captured
                    <Button
                        variant="outlined"
                        onClick={startWebcam} // Restart webcam to retake
                        startIcon={<PlayArrow />}
                        disabled={loading}
                    >
                        Retake
                    </Button>
                )}
            </Box>

            {/* Hidden canvas for image capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading || !capturedImageBlob} // Disable if no image captured
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Register Face"}
            </Button>
          </Box>
        </form>
      </Box>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}