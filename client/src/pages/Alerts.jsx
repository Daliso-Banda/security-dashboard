import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, Divider } from '@mui/material';
import { io } from 'socket.io-client';
import { styled, keyframes } from '@mui/system';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

// Fade in animation for new alerts
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
`;

// Fade out animation (for optional future use)
const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

// Styled alert box with fade-in and hover effect
const AlertBox = styled(Box)(({ theme }) => ({
  backgroundColor: '#fff3f3',
  borderRadius: 10,
  padding: theme.spacing(2.5),
  boxShadow: '0 4px 10px rgba(195, 57, 43, 0.15)',
  cursor: 'default',
  animation: `${fadeIn} 0.4s ease forwards`,
  display: 'flex',
  flexDirection: 'column',
  transition: 'box-shadow 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 20px rgba(195, 57, 43, 0.3)',
  },
}));

// Colored dot that can change color dynamically (e.g., severity)
const SeverityDot = styled('span')(({ severity = 'high', theme }) => ({
  width: 14,
  height: 14,
  borderRadius: '50%',
  backgroundColor:
    severity === 'high'
      ? '#c0392b'
      : severity === 'medium'
        ? '#d67d0e'
        : '#3498db',
  display: 'inline-block',
  marginRight: theme.spacing(1.5),
  marginTop: 5,
}));

export default function FetchAlerts() {
  const [alerts, setAlerts] = useState([]);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/alerts`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        if (data.success) setAlerts(data.alerts);
        else console.error('Failed to fetch initial alerts:', data.error);
      } catch (error) {
        console.error('Error fetching alerts:', error);
      }
    };

    fetchAlerts();

    const socket = io(BACKEND_URL);

    socket.on('connect', () => console.log('Socket.IO connected!'));
    socket.on('alert', (data) => setAlerts((prev) => [data, ...prev]));
    socket.on('disconnect', () => console.log('Socket.IO disconnected.'));
    socket.on('connect_error', (err) => console.error('Socket.IO connection error:', err.message));

    return () => socket.disconnect();
  }, [BACKEND_URL]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: { xs: '95%', sm: 520, md: 620, lg: 720 },
          maxHeight: '80vh',
          overflowY: 'auto',
          borderRadius: 5,
          p: 4,
          boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(195, 57, 43, 0.4)',
            borderRadius: 4,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f0f0f0',
          },
        }}
      >
        <Typography
          variant="h4"
          color="#b8322e"
          fontWeight={800}
          gutterBottom
          sx={{ mb: 4, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <NotificationsActiveIcon fontSize="large" /> Security Alerts
        </Typography>

        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Typography variant="body1" color="text.secondary" mb={2}>
              No alerts yet.
            </Typography>
            <NotificationsActiveIcon sx={{ fontSize: 48, color: '#ccc' }} />
          </Box>
        ) : (
          <Stack spacing={3}>
            {alerts.map((alert) => (
              <AlertBox key={alert._id || alert.timestamp}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.7 }}>
                  <SeverityDot severity={alert.severity || 'high'} />
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    color="#a82d28"
                    sx={{ flexGrow: 1 }}
                  >
                    {alert.message}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontStyle: 'italic', letterSpacing: 0.3 }}
                >
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
