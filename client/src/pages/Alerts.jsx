import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack, Divider } from '@mui/material';
import { styled, keyframes } from '@mui/system';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

// Fade in animation for new alerts
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-15px); }
  to { opacity: 1; transform: translateY(0); }
`;

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
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://10.24.91.149:3000';
  const WS_URL = BACKEND_URL.replace(/^http/, 'ws'); // ws://10.24.91.149:3000

  useEffect(() => {
    // Fetch initial alerts via REST
    fetch(`${BACKEND_URL}/api/alerts`)
      .then(res => res.json())
      .then(data => setAlerts(data.alerts || []));

    // Native WebSocket connection
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'alert') {
          setAlerts(prev => [data, ...prev]);
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
    };

    return () => ws.close();
  }, [BACKEND_URL, WS_URL]);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
      <Paper elevation={8} sx={{
        width: { xs: '95%', sm: 520, md: 620, lg: 720 },
        maxHeight: '80vh',
        overflowY: 'auto',
        borderRadius: 5,
        p: 4,
        boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
        '&::-webkit-scrollbar': { width: 8 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(195, 57, 43, 0.4)', borderRadius: 4 },
        '&::-webkit-scrollbar-track': { backgroundColor: '#f0f0f0' },
      }}>
        <Typography variant="h4" color="#b8322e" fontWeight={800} gutterBottom sx={{ mb: 4, userSelect: 'none', display: 'flex', alignItems: 'center', gap: 1 }}>
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
                  <Typography variant="subtitle1" fontWeight={700} color="#a82d28" sx={{ flexGrow: 1 }}>
                    {alert.message}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', letterSpacing: 0.3 }}>
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
