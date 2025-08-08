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
  Divider,
  Grid,
  CircularProgress,
  Fade,
  Slide
} from '@mui/material';

const client = mqtt.connect('ws://10.251.211.92:9001');
client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
});

export default function AccessControl() {
  const [device, setDevice] = useState('door1');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCommand = (command) => {
    setLoading(true);
    const payload = JSON.stringify({ command, device });
    client.publish('security/control', payload, {}, () => {
      setStatus(`✅ ${command.toUpperCase()} command sent to ${device.toUpperCase()}`);
      setLoading(false);
    });
  };

  return (
    <Fade in timeout={700}>
      <Box sx={{
        minHeight: '100vh',
        bgcolor: '#f0f2f5',
        py: 8,
        px: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Slide direction="up" in timeout={600}>
          <Paper elevation={8} sx={{ p: 5, borderRadius: 4, width: '100%', maxWidth: 800 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#2c3e50', textAlign: 'center' }}>
              🚪 Access Control Panel
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={4} alignItems="flex-start">
              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#34495e' }}>
                  Select Device
                </Typography>
                <RadioGroup
                  value={device}
                  onChange={(e) => setDevice(e.target.value)}
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                  <FormControlLabel value="door1" control={<Radio />} label="Door 1" />
                  <FormControlLabel value="door2" control={<Radio />} label="Door 2" />
                  <FormControlLabel value="gate" control={<Radio />} label="Main Gate" />
                </RadioGroup>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#34495e' }}>
                  Send Command
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={() => handleCommand('unlock')}
                    disabled={loading}
                    sx={{
                      minWidth: 120,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Unlock'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="large"
                    onClick={() => handleCommand('lock')}
                    disabled={loading}
                    sx={{
                      minWidth: 120,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Lock'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {status && (
              <Alert severity="info" sx={{ mt: 4, fontWeight: 500, borderRadius: 2 }}>
                {status}
              </Alert>
            )}
          </Paper>
        </Slide>
      </Box>
    </Fade>
  );
}
