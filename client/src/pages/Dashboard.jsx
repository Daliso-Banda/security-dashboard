import React from 'react';
import { Box, Grid, Paper, Typography } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import SensorsIcon from '@mui/icons-material/Sensors';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const stats = [
  {
    title: 'Active Devices',
    value: 6, // Replace with real-time value from backend later
    icon: <SensorsIcon fontSize="large" />,
    color: '#4caf50',
  },
  {
    title: 'Current Alerts',
    value: 2,
    icon: <SecurityIcon fontSize="large" />,
    color: '#f44336',
  },
  {
    title: 'Total Users',
    value: 12,
    icon: <PersonIcon fontSize="large" />,
    color: '#2196f3',
  },
  {
    title: 'Last Sync',
    value: '23:34:12',
    icon: <AccessTimeIcon fontSize="large" />,
    color: '#ff9800',
  },
];

export default function Dashboard() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#ebecf1ff'}}>
      <Box component={Paper} elevation={4} sx={{ p: 4, borderRadius: 4, maxWidth: 1100, width: 700, boxShadow: 3, mx: 'auto' }}>
        <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 700, color: '#2d3436', mb: 3 }}>
          System Overview
        </Typography>
        <Grid container spacing={3}>
          {stats.map((item, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Paper elevation={2} sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, borderRadius: 3, bgcolor: '#f9fafb' }}>
                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                  {item.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
