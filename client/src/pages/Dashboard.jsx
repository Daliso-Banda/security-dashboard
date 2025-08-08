import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Typography, Box } from '@mui/material';
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
        background: 'linear-gradient(to right, #f5f7fa, #dfe6e9)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '48px 16px',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 1100,
          p: 4,
          borderRadius: 4,
        }}
      >
        <Typography variant="h3" gutterBottom fontWeight="bold" color="primary">
          Security Dashboard
        </Typography>

        <Typography variant="h5" gutterBottom mt={4}>
          Quick Navigation
        </Typography>

        <Grid container spacing={4} mt={1}>
          {pages.map((page) => (
            <Grid item xs={12} sm={6} md={4} key={page.title}>
              <Box
                onClick={() => navigate(page.path)}
                sx={{
                  backgroundColor: page.color,
                  color: '#fff',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 6,
                  },
                }}
              >
                <Box>{page.icon}</Box>
                <Typography variant="h6" mt={1.5}>
                  {page.title}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
