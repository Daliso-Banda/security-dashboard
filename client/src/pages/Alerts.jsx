import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { io } from 'socket.io-client';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const socket = io("http://localhost:3000");

    socket.on("alert", (data) => {
      setAlerts(prev => [...prev, data]);
    });

    return () => socket.disconnect();
  }, []);

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
            alerts.map((alert, idx) => (
              <Box key={idx} sx={{ p: 2, bgcolor: '#fff6f6', borderRadius: 2, boxShadow: 1 }}>
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
