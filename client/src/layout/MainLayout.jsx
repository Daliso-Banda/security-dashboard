import React from "react";
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
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
} from "@mui/material";
import { Link, Outlet, useLocation } from "react-router-dom";

import DashboardIcon from "@mui/icons-material/Dashboard";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ListAltIcon from "@mui/icons-material/ListAlt";
import FaceRetouchingNaturalIcon from "@mui/icons-material/FaceRetouchingNatural";
import VideocamIcon from "@mui/icons-material/Videocam";
import MenuIcon from "@mui/icons-material/Menu";

const drawerWidth = 264;
const collapsedWidth = 72;

const menuItems = [
  { text: "Dashboard", path: "/", icon: <DashboardIcon /> },
  { text: "Access Control", path: "/access", icon: <SecurityIcon /> },
  { text: "Alerts", path: "/alerts", icon: <NotificationsIcon /> },
  { text: "Logs", path: "/logs", icon: <ListAltIcon /> },
  { text: "Face Registration", path: "/registration", icon: <FaceRetouchingNaturalIcon /> },
  { text: "Live Stream", path: "/live", icon: <VideocamIcon /> },
];

export default function MainLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [hoverOpen, setHoverOpen] = React.useState(false); // mini-variant hover
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Sidebar content
  const drawer = (
    <div>
      <Toolbar />
      {hoverOpen && (
        <Box sx={{ textAlign: "left", px: 3, py: 2 }}>
          <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.2, color: "text.secondary" }}>
            MENU
          </Typography>
        </Box>
      )}
      <Divider />
      <List sx={{ px: hoverOpen ? 1 : 0 }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={index} disablePadding sx={{ mb: 0.5, justifyContent: hoverOpen ? 'initial' : 'center' }}>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  px: hoverOpen ? 2.5 : 1.5,
                  py: 1.4,
                  borderRadius: 2,
                  mx: hoverOpen ? 1 : 0.5,
                  color: isActive ? "primary.main" : "text.primary",
                  bgcolor: isActive ? "rgba(21, 101, 192, 0.10)" : "transparent",
                  boxShadow: isActive ? 2 : 'none',
                  transition: 'all .2s ease',
                  '&:hover': { bgcolor: "rgba(21, 101, 192, 0.08)" },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "primary.main" : "text.secondary", minWidth: hoverOpen ? 36 : 0, justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
                {hoverOpen && (
                  <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: "0.95rem", fontWeight: isActive ? 700 : 500 }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* Top Bar */}
      <AppBar position="fixed" color="inherit" elevation={0} sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        bgcolor: 'background.paper',
        ml: { sm: hoverOpen ? `${drawerWidth}px` : `${collapsedWidth}px` },
        width: { sm: `calc(100% - ${hoverOpen ? drawerWidth : collapsedWidth}px)` }
      }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          {/* Left section */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 800 }}>
              Security Dashboard
            </Typography>
          </Box>

          {/* Right: Notifications + Profile */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton color="inherit">
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <Avatar alt="Admin" src="/static/images/avatar/1.jpg" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
              <MenuItem onClick={handleMenuClose}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: { sm: hoverOpen ? drawerWidth : collapsedWidth },
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: { sm: hoverOpen ? drawerWidth : collapsedWidth },
            boxSizing: "border-box",
            borderRight: '1px solid rgba(255,255,255,0.06)'
          },
          display: { xs: "none", sm: "block" },
        }}
        open
        onMouseEnter={() => setHoverOpen(true)}
        onMouseLeave={() => setHoverOpen(false)}
      >
        {drawer}
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: "block", sm: "none" },
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{
        flexGrow: 1,
        p: 3,
        ml: { sm: hoverOpen ? `${drawerWidth}px` : `${collapsedWidth}px` },
        backgroundColor: 'background.default'
      }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
