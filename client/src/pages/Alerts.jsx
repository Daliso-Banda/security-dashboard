import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, Divider } from '@mui/material';
import { io } from 'socket.io-client';
import { styled, keyframes } from '@mui/system';

// Fade in animation for new alerts
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Styled alert box with fade-in and hover effect
const AlertBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#fff6f6',
  borderRadius: 8,
  padding: theme.spacing(2),
  boxShadow: '0 2px 6px rgba(195, 57, 43, 0.15)',
  cursor: 'default',
  animation: `${fadeIn} 0.4s ease forwards`,
  display: 'flex',
  flexDirection: 'column',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 12px rgba(195, 57, 43, 0.3)',
  }
}));

// Small colored dot to indicate alert severity
const SeverityDot = styled('span')(({ theme }) => ({
  width: 12,
  height: 12,
  borderRadius: '50%',
  backgroundColor: '#c0392b',
  display: 'inline-block',
  marginRight: theme.spacing(1.5),
  marginTop: 4,
}));

export default function FetchAlerts() {
  const [alerts, setAlerts] = useState([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/alerts`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) setAlerts(data.alerts);
        else console.error("Failed to fetch initial alerts:", data.error);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();

    const socket = io(BACKEND_URL);

    socket.on("connect", () => console.log("Socket.IO connected!"));
    socket.on("alert", (data) => setAlerts(prev => [data, ...prev]));
    socket.on("disconnect", () => console.log("Socket.IO disconnected."));
    socket.on("connect_error", (err) => console.error("Socket.IO connection error:", err.message));

    return () => socket.disconnect();
  }, [BACKEND_URL]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f7f8fa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: { xs: '90%', sm: 480, md: 600, lg: 700 },
          maxHeight: '80vh',
          overflowY: 'auto',
          borderRadius: 4,
          p: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        }}
      >
        <Typography
          variant="h4"
          color="#c0392b"
          fontWeight={700}
          gutterBottom
          sx={{ mb: 3, userSelect: 'none' }}
        >
          🚨 Security Alerts
        </Typography>

        {alerts.length === 0 ? (
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mt: 4 }}>
            No alerts yet.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {alerts.map((alert) => (
              <AlertBox key={alert._id || alert.timestamp}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <SeverityDot />
                  <Typography variant="subtitle1" fontWeight={600} color="#b03a2e" sx={{ flexGrow: 1 }}>
                    {alert.message}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  {new Date(alert.timestamp).toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </Typography>
              </AlertBox>
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
