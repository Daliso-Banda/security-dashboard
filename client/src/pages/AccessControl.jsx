import React, { useState } from 'react';
import mqtt from 'mqtt';

import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';

const client = mqtt.connect('ws://10.251.211.92:9001'); // Make sure Mosquitto exposes WebSocket
client.on('connect', () => {
  console.log('Connected to MQTT broker');
});
export default function AccessControl() {
  const [device, setDevice] = useState('door1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCommand = (command) => {
    setLoading(true);
    const payload = JSON.stringify({ command, device });
    client.publish('security/control', payload, {}, () => {
      setStatus(`${command.toUpperCase()} command sent to ${device}`);
      setLoading(false);
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ebecf1ff' }}>
      <Box component={Paper} elevation={4} sx={{ p: 4, borderRadius: 4, maxWidth: 1100, width: 700, boxShadow: 3, mx: 'auto' }}>
        <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 600, color: '#2d3436', mb: 3 }}>
          Access Control Panel
        </Typography>

        <Stack direction="row" spacing={4} alignItems="center" justifyContent="flex-start">
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 500 }}>Select Device:</Typography>
            <RadioGroup row value={device} onChange={(e) => setDevice(e.target.value)}>
              <FormControlLabel value="door1" control={<Radio />} label="Door 1" />
              <FormControlLabel value="door2" control={<Radio />} label="Door 2" />
              <FormControlLabel value="gate" control={<Radio />} label="Main Gate" />
            </RadioGroup>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              color="success"
              disabled={loading}
              size="large"
              onClick={() => handleCommand('unlock')}
              sx={{ minWidth: 120 }}
            >
              Unlock
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={loading}
              size="large"
              onClick={() => handleCommand('lock')}
              sx={{ minWidth: 120 }}
            >
              Lock
            </Button>
          </Stack>

          {status && <Alert severity="info" sx={{ ml: 4 }}>{status}</Alert>}
        </Stack>
      </Box>
    </Box>
  );
}
