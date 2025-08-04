import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Grid, Typography } from '@mui/material';
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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '48px 16px',
      }}
    >
      <main
        style={{
          maxWidth: 1100,
          width: '100%',
          padding: 40,
          borderRadius: 12,
          // no background or shadow, fully transparent
        }}
      >
        <Typography variant="h3" gutterBottom>
          Security Dashboard
        </Typography>

        <Typography variant="h5" gutterBottom style={{ marginTop: 32 }}>
          Quick Navigation
        </Typography>

        <Grid container spacing={3} style={{ marginTop: 16 }}>
          {pages.map((page) => (
            <Grid item xs={12} sm={6} md={4} key={page.title}>
              <div
                onClick={() => navigate(page.path)}
                style={{
                  padding: 24,
                  cursor: 'pointer',
                  backgroundColor: page.color,
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  borderRadius: 8,
                  transition: 'transform 0.3s ease',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {page.icon}
                <Typography variant="h6" style={{ marginTop: 8 }}>
                  {page.title}
                </Typography>
              </div>
            </Grid>
          ))}
        </Grid>
      </main>
    </div>
  );
}
