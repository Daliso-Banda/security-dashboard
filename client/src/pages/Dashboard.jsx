import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography } from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FaceIcon from '@mui/icons-material/Face';
import ListAltIcon from '@mui/icons-material/ListAlt';
import PersonIcon from '@mui/icons-material/Person';

export default function Dashboard() {
  const navigate = useNavigate();

  const pages = [
    {
      title: 'Access Control',
      path: '/access',
      icon: <LockOpenIcon fontSize="large" />,
      color: '#6c5ce7',
    },
    {
      title: 'Alerts',
      path: '/alerts',
      icon: <NotificationsActiveIcon fontSize="large" />,
      color: '#d63031',
    },
    {
      title: 'Face Registration',
      path: '/registration',
      icon: <FaceIcon fontSize="large" />,
      color: '#00b894',
    },
    {
      title: 'Access Logs',
      path: '/logs',
      icon: <ListAltIcon fontSize="large" />,
      color: '#0984e3',
    },
    {
      title: 'Registered Users',
      path: '/users',
      icon: <PersonIcon fontSize="large" />,
      color: '#636e72',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5f7fa', // light subtle background for the whole page
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        py: 6,
        px: 2,
      }}
    >
      {/* Container with background and padding fitting the content */}
      <Paper
        elevation={6}
        sx={{
          p: 5,
          maxWidth: 1100,
          width: '100%',
          borderRadius: 3,
          bgcolor: '#ffffff', // white background inside paper
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
      >
        <Typography variant="h3" gutterBottom>
          Security Dashboard
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Quick Navigation
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          {pages.map((page) => (
            <Grid item xs={12} sm={6} md={4} key={page.title}>
              <Paper
                onClick={() => navigate(page.path)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  backgroundColor: page.color,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  borderRadius: 2,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  },
                }}
                elevation={4}
              >
                {page.icon}
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {page.title}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}
