import React from 'react';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  Typography,
  ListItemButton,
  CssBaseline,
  Divider,
  ListItemIcon,
} from '@mui/material';
import { Link, Outlet, useLocation } from 'react-router-dom';

import DashboardIcon from '@mui/icons-material/Dashboard';
import SecurityIcon from '@mui/icons-material/Security';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ListAltIcon from '@mui/icons-material/ListAlt';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { text: 'Access Control', path: '/access', icon: <SecurityIcon /> },
  { text: 'Alerts', path: '/alerts', icon: <NotificationsIcon /> },
  { text: 'Logs', path: '/logs', icon: <ListAltIcon /> },
  { text: 'Face Registration', path: '/registration', icon: <FaceRetouchingNaturalIcon /> },
];

export default function MainLayout() {
  const location = useLocation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* Top Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: '#565c0',
        }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
            Security Control Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"

      >
        <Toolbar />
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            Navigation
          </Typography>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={index} disablePadding>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  sx={{
                    px: 3,
                    py: 1.8,
                    color: isActive ? '#1565c0' : 'text.primary',
                    bgcolor: isActive ? 'rgba(21, 101, 192, 0.1)' : 'transparent',
                    '&:hover': {
                      bgcolor: 'rgba(21, 101, 192, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#1565c0' : 'text.secondary' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.95rem' }} />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${drawerWidth}px`,
          backgroundColor: 'transparent', // ✅ Changed here
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
