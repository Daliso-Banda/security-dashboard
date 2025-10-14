import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Chip,
  Stack,
  Snackbar,
  Alert,
} from "@mui/material";
import { Lock, LockOpen } from "@mui/icons-material";

const serverIP = import.meta.env.VITE_SERVER_IP;

/* ---------- Device Card ---------- */
function DeviceCard({ name, device, onCommand, status, loading }) {
  const isLocked = status === "locked";

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Chip
          size="small"
          label={isLocked ? "Locked" : "Unlocked"}
          color={isLocked ? "error" : "success"}
        />
      </Stack>

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="contained"
          color={isLocked ? "success" : "error"}
          startIcon={isLocked ? <LockOpen /> : <Lock />}
          disabled={loading}
          onClick={() => onCommand(isLocked ? "unlock" : "lock", device)}
          sx={{ borderRadius: 3, minWidth: 140 }}
        >
          {loading ? (
            <CircularProgress size={22} color="inherit" />
          ) : isLocked ? (
            "Unlock"
          ) : (
            "Lock"
          )}
        </Button>
      </Box>
    </Paper>
  );
}

/* ---------- Main Component ---------- */
export default function AccessControl() {
  const wsRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState({
    door1: "locked",
    door2: "locked",
    gate: "locked",
  });

  const [alert, setAlert] = useState({ open: false, message: "", severity: "info" });

  /* ---------- WebSocket Connection ---------- */
  useEffect(() => {
    const ws = new WebSocket(`ws://${serverIP}:3000`); // your backend WS server
    wsRef.current = ws;

    ws.onopen = () => console.log("✅ WS Connected");
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);

        // Example: { type: "status", name: "door1", message: "locked" }
        if (data.type === "status") {
          setStatuses((prev) => ({
            ...prev,
            [data.name]: data.message,
          }));
        }

        // Example: { type: "alert", message: "Unauthorized attempt" }
        if (data.type === "alert") {
          setAlert({ open: true, message: data.message, severity: "warning" });
        }
      } catch (err) {
        console.error("WS parse error:", err);
      }
    };

    ws.onclose = () => console.log("❌ WS Disconnected");
    return () => ws.close();
  }, []);

  /* ---------- Command Handler ---------- */
  const handleCommand = (command, device) => {
    setLoading(true);

    const payload = { type: "command", command, name: device };
    wsRef.current?.send(JSON.stringify(payload));

    // optimistic UI update
    setStatuses((prev) => ({
      ...prev,
      [device]: command === "lock" ? "locked" : "unlocked",
    }));

    setTimeout(() => setLoading(false), 500);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f4f6f9",
        py: 6,
        px: 3,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1000 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            textAlign: "center",
            mb: 5,
            color: "#2c3e50",
          }}
        >
          Access Control
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <DeviceCard
              name="Front Door"
              device="door1"
              status={statuses.door1}
              loading={loading}
              onCommand={handleCommand}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DeviceCard
              name="Back Door"
              device="door2"
              status={statuses.door2}
              loading={loading}
              onCommand={handleCommand}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <DeviceCard
              name="Main Gate"
              device="gate"
              status={statuses.gate}
              loading={loading}
              onCommand={handleCommand}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Snackbar for alerts */}
      <Snackbar
        open={alert.open}
        autoHideDuration={4000}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
      >
        <Alert severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
