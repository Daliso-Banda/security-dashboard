import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Grid,
  Divider,
  useTheme,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import Webcam from "react-webcam";

const Register = () => {
  const theme = useTheme();
  const webcamRef = useRef(null);

  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [capturedImageBlob, setCapturedImageBlob] = useState(null);

  const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: "user",
  };

  const handleCapture = () => {
    const screenshot = webcamRef.current.getScreenshot();
    if (screenshot) {
      const byteString = atob(screenshot.split(",")[1]);
      const mimeString = screenshot.split(",")[0].split(":")[1].split(";")[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      setCapturedImageBlob(blob);
    }
  };

  const handleSubmit = async () => {
    if (!name || !userId || !capturedImageBlob) {
      alert("Please provide all fields and capture a photo.");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("user_id", userId);
    formData.append("image", capturedImageBlob, "captured.png");

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        alert("✅ Registration successful!");
        setName("");
        setUserId("");
        setCapturedImageBlob(null);
      } else {
        alert("❌ Registration failed: " + data.error);
      }
    } catch (error) {
      alert("⚠️ Error: " + error.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Paper elevation={3} sx={{ p: 5 }}>
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          👤 Register New User
        </Typography>

        {/* Input Fields */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="User ID / Phone"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              fullWidth
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Webcam and Captured Image */}
        <Typography
          variant="h6"
          align="center"
          gutterBottom
          sx={{ fontWeight: 500 }}
        >
          Live Camera Feed
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "center",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Webcam
            audio={false}
            height={360}
            ref={webcamRef}
            screenshotFormat="image/png"
            width={480}
            videoConstraints={videoConstraints}
            style={{
              borderRadius: 12,
              boxShadow: theme.shadows[2],
            }}
          />

          {capturedImageBlob && (
            <img
              src={URL.createObjectURL(capturedImageBlob)}
              alt="Captured"
              style={{
                width: 240,
                height: 180,
                objectFit: "cover",
                borderRadius: 12,
                boxShadow: theme.shadows[3],
              }}
            />
          )}
        </Box>

        {/* Buttons */}
        <Box
          sx={{
            mt: 5,
            display: "flex",
            justifyContent: "center",
            gap: 3,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={handleCapture}
            sx={{ borderRadius: 2, px: 4 }}
          >
            📸 Capture Photo
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmit}
            sx={{ borderRadius: 2, px: 4 }}
          >
            💾 Register Face
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
