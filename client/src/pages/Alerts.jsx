import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { io } from 'socket.io-client';

export default function fetchAlerts() {
  const [alerts, setAlerts] = useState([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"; 

  useEffect(() => {
    // --- 1. Fetch existing alerts on component mount ---
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/alerts`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setAlerts(data.alerts);
        } else {
          console.error("Failed to fetch initial alerts:", data.error);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();

    // --- 2. Set up Socket.IO for real-time alerts ---
    const socket = io(BACKEND_URL); // Connect to the determined backend URL

    socket.on("connect", () => {
      console.log("Socket.IO connected!");
    });

    socket.on("alert", (data) => {
      console.log("New alert received via Socket.IO:", data);
      setAlerts(prev => [data, ...prev]); // Add new alerts to the top
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO disconnected.");
    });

    socket.on("connect_error", (err) => {
      console.error("Socket.IO connection error:", err.message);
    });

    return () => {
      socket.disconnect(); // Clean up on component unmount
    };
  }, [BACKEND_URL]); // Add BACKEND_URL to dependency array if it changes

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ebecf1ff' }}>
      <Box component={Paper} elevation={4} sx={{ p: 4, borderRadius: 4, maxWidth: 1100, width: 500, boxShadow: 3, mx: 'auto' }}>
        <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 600, color: '#c0392b', mb: 3 }}>
          🚨 Security Alerts
        </Typography>
        <Stack spacing={2}>
          {alerts.length === 0 ? (
            <Typography variant="body1" color="text.secondary">No alerts yet.</Typography>
          ) : (
            // Map alerts, ensure stable key if possible (e.g., alert._id)
            alerts.map((alert) => ( // Removed idx from here as we're using _id
              <Box key={alert._id || alert.timestamp} sx={{ p: 2, bgcolor: '#fff6f6', borderRadius: 2, boxShadow: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 500, color: '#d35400' }}>{alert.message}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(alert.timestamp).toLocaleString()}
                </Typography>
              </Box>
            ))
          )}
        </Stack>
      </Box>
    </Box>
  );
}