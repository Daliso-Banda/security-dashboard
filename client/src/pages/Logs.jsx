import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  CircularProgress,
  Chip,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
const serverIP = import.meta.env.VITE_SERVER_IP;
import axios from 'axios';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const severityColors = {
  High: 'error',
  Medium: 'warning',
  Low: 'info',
};

const severityIcons = {
  High: <ErrorOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />,
  Medium: <ReportProblemIcon fontSize="small" sx={{ mr: 0.5 }} />,
  Low: <InfoOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />,
};

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    axios.get(`http://${serverIP}:3000/api/logs`)
      .then((res) => {
        if (res.data && Array.isArray(res.data.logs)) {
          setLogs(res.data.logs);
        } else {
          setLogs([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("⚠️ Failed to fetch logs. Please check server connection.");
        setLoading(false);
        console.error("Error fetching logs:", err);
      });

    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getSeverity = (message) => {
    if (!message || typeof message !== 'string') return 'Low';
    const msg = message.toLowerCase();
    if (msg.includes('unknown person')) return 'High';
    if (msg.includes('attempted')) return 'Medium';
    return 'Low';
  };

  const handleRowClick = (log) => setSelectedLog(log);
  const handleClose = () => setSelectedLog(null);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
      }}
    >
      <Fade in={fadeIn} timeout={800}>
        <Paper
          elevation={6}
          sx={{
            width: '100%',
            maxWidth: 1400,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            boxShadow: '0 6px 25px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 700, color: '#34495e', mb: 4, textAlign: 'center' }}
          >
            Security Activity Logs
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={50} />
            </Box>
          ) : error ? (
            <Fade in={true}>
              <Paper sx={{ p: 2, bgcolor: '#fdecea', borderRadius: 2, mb: 4 }}>
                <Typography color="error">{error}</Typography>
              </Paper>
            </Fade>
          ) : (
            <Fade in={true}>
              <TableContainer sx={{ maxHeight: 600, borderRadius: 2, boxShadow: '0 3px 12px rgba(0,0,0,0.05)' }}>
                <Table stickyHeader aria-label="logs table">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'linear-gradient(90deg, #6c5ce7, #00b894)', color: '#fff' }}>
                      {['Message', 'Device', 'Severity', 'Timestamp', 'Image'].map((head) => (
                        <TableCell
                          key={head}
                          sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}
                        >
                          {head}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                          <Typography variant="h6" color="text.secondary">
                            No logs available.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log, index) => {
                        const messageText = log.message || 'Unknown user';
                        const deviceText = log.device || 'Unknown device';
                        const severity = getSeverity(messageText);
                        return (
                          <TableRow
                            key={log._id}
                            hover
                            onClick={() => handleRowClick(log)}
                            sx={{
                              cursor: 'pointer',
                              backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff',
                              transition: 'all 0.3s ease',
                              '&:hover': { backgroundColor: '#e9f1ff' },
                            }}
                          >
                            <TableCell>{messageText}</TableCell>
                            <TableCell>{deviceText}</TableCell>
                            <TableCell>
                              <Chip
                                icon={severityIcons[severity]}
                                label={severity}
                                color={severityColors[severity]}
                                variant="outlined"
                                size="small"
                                sx={{ fontWeight: 600, borderWidth: 1.5 }}
                              />
                            </TableCell>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell>
                              {log.image_url ? (
                                <Box
                                  component="img"
                                  src={log.image_url}
                                  alt="Log"
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 2,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    border: '1px solid #ccc',
                                  }}
                                />
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  No image
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Fade>
          )}

          <Dialog open={!!selectedLog} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ bgcolor: '#6c5ce7', color: '#fff', fontWeight: 700 }}>
              Log Details
            </DialogTitle>
            <DialogContent dividers>
              {selectedLog && (
                <>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Message:</strong> {selectedLog.message || 'Unknown user'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Device:</strong> {selectedLog.device || 'Unknown device'}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Severity:</strong> {getSeverity(selectedLog.message || '')}
                  </Typography>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}
                  </Typography>
                  {selectedLog.image_url ? (
                    <Box
                      component="img"
                      src={selectedLog.image_url}
                      alt="Log detail"
                      sx={{
                        width: '100%',
                        maxHeight: 400,
                        objectFit: 'contain',
                        mt: 2,
                        borderRadius: 2,
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                      }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" mt={2}>
                      No image available.
                    </Typography>
                  )}
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="primary" variant="contained">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Fade>
    </Box>
  );
}
