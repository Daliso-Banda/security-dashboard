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

const drawerWidth = 240;

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
      <Box sx={{ textAlign: "center", py: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.secondary" }}>
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
                  color: isActive ? "#1565c0" : "text.primary",
                  bgcolor: isActive ? "rgba(21, 101, 192, 0.1)" : "transparent",
                  "&:hover": {
                    bgcolor: "rgba(21, 101, 192, 0.08)",
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive ? "#1565c0" : "text.secondary" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: "0.95rem" }} />
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
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          bgcolor: "#1565c0",
        }}
      >
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
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 500 }}>
              Security Control Dashboard
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
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
          },
          display: { xs: "none", sm: "block" },
        }}
        open
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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: "#f9f9f9",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
