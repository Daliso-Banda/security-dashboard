import { useEffect, useRef, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Chip,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

export default function LiveStream() {
  const [status, setStatus] = useState("offline");
  const [logs, setLogs] = useState([]);
  const imgRef = useRef(null);
  const wsRef = useRef(null);
  const frameQueue = useRef([]);
  const processingRef = useRef(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "ws://10.24.91.149:5175";

  useEffect(() => {
    if (wsRef.current) return;

    const ws = new WebSocket(BACKEND_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("online");
    };

    ws.onmessage = (event) => {
      try {
        const msg = typeof event.data === "string" ? JSON.parse(event.data) : null;
        if (msg && msg.type === "frame") {
          frameQueue.current.push(msg.data);
          requestAnimationFrame(processFrameQueue);
        }
        if (msg && msg.type === "event") {
          setLogs((prev) => [
            {
              time: new Date().toLocaleTimeString(),
              user: msg.user || "Unknown",
              access: msg.access || "unknown",
            },
            ...prev,
          ]);
        }
      } catch (err) {
        setStatus("error");
      }
    };

    ws.onclose = () => {
      setStatus("offline");
      setTimeout(() => {
        wsRef.current = null;
        setStatus("reconnecting...");
      }, 2000);
    };

    ws.onerror = () => setStatus("error");

    const processFrameQueue = () => {
      if (processingRef.current) return;
      processingRef.current = true;

      if (frameQueue.current.length > 0 && imgRef.current) {
        const frameData = frameQueue.current.pop();
        imgRef.current.src = `data:image/jpeg;base64,${frameData}`;
        frameQueue.current = [];
      }

      processingRef.current = false;
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [BACKEND_URL]);

  const statusChip = () => {
    if (status === "online") return <Chip color="success" icon={<CheckCircleIcon />} label="Online" />;
    if (status === "error") return <Chip color="error" icon={<ErrorIcon />} label="Error" />;
    if (status === "reconnecting...") return <Chip color="warning" icon={<HourglassEmptyIcon />} label="Reconnecting" />;
    return <Chip color="default" label="Offline" />;
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4, px: 2 }}>
      <Grid container spacing={3} maxWidth={1400} sx={{ mx: "auto" }}>
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h4" fontWeight={700}>Live Stream</Typography>
            {statusChip()}
          </Stack>
          {status === "reconnecting..." && <LinearProgress sx={{ mt: 2, maxWidth: 300 }} />}
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={6} sx={{ p: 2, borderRadius: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                bgcolor: "#000",
                borderRadius: 2,
                overflow: "hidden",
                minHeight: 420,
              }}
            >
              <img ref={imgRef} alt="live feed" style={{ width: "100%", maxHeight: 560, objectFit: "contain" }} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: "100%" }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Access Events
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense sx={{ maxHeight: 560, overflowY: "auto" }}>
              {logs.length === 0 ? (
                <Typography color="text.secondary">No events yet.</Typography>
              ) : (
                logs.map((log, i) => (
                  <ListItem key={i} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {log.access === "granted" ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : log.access === "denied" ? (
                        <ErrorIcon color="error" fontSize="small" />
                      ) : (
                        <HourglassEmptyIcon color="action" fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${log.user} → ${log.access}`}
                      secondary={log.time}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
