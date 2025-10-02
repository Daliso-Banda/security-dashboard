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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
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
    axios.get('http://10.252.154.149:3000/api/logs')
      .then((res) => {
        console.log(res);
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

  // Safe getSeverity function
  const getSeverity = (message) => {
    if (!message || typeof message !== 'string') return 'Low'; // default
    const msg = message.toLowerCase();
    if (msg.includes('unknown person')) return 'High';
    if (msg.includes('attempted')) return 'Medium';
    return 'Low';
  };

  const handleRowClick = (log) => {
    setSelectedLog(log);
  };

  const handleClose = () => {
    setSelectedLog(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f8f9fa',
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
            maxWidth: 1300,
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            boxShadow: '0px 6px 20px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, color: '#2c3e50', mb: 4, textAlign: 'center' }}
          >
            Security Activity Logs
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={50} />
            </Box>
          ) : error ? (
            <Fade in={true}>
              <Alert severity="error" sx={{ my: 4 }}>
                {error}
              </Alert>
            </Fade>
          ) : (
            <Fade in={true}>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader aria-label="logs table">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#ecf0f1' }}>
                      <TableCell><strong>Message</strong></TableCell>
                      <TableCell><strong>Device</strong></TableCell>
                      <TableCell><strong>Severity</strong></TableCell>
                      <TableCell><strong>Timestamp</strong></TableCell>
                      <TableCell><strong>Image</strong></TableCell>
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
                      logs.map((log) => {
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
                              transition: 'background 0.3s ease',
                              '&:hover': { backgroundColor: '#f4f6f8' },
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
                                sx={{ fontWeight: 500 }}
                              />
                            </TableCell>
                            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                            <TableCell>
                              {log.image_url ? (
                                <img
                                  src={log.image_url}
                                  alt="Log"
                                  style={{
                                    width: 80,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 8,
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

          {/* Modal dialog for detailed log */}
          <Dialog open={!!selectedLog} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Log Details</DialogTitle>
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
                        border: '1px solid #ccc',
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
