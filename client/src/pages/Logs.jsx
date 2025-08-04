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
  Stack,
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

  useEffect(() => {
    axios.get('http://localhost:3000/api/logs')
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
  }, []);

  const getSeverity = (message) => {
    const msg = message.toLowerCase();
    if (msg.includes('unknown person')) return 'High';
    if (msg.includes('attempted')) return 'Medium';
    return 'Low';
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
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: 1200,
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          boxShadow: '0px 6px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 600,
            color: '#2c3e50',
            mb: 4,
            textAlign: 'center',
          }}
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
            <TableContainer sx={{ maxHeight: 500 }}>
              <Table stickyHeader aria-label="logs table">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#ecf0f1' }}>
                    <TableCell><strong>Message</strong></TableCell>
                    <TableCell><strong>Device</strong></TableCell>
                    <TableCell><strong>Severity</strong></TableCell>
                    <TableCell><strong>Timestamp</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography variant="h6" color="text.secondary">
                          No logs available.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => {
                      const severity = getSeverity(log.message);
                      return (
                        <TableRow
                          key={log._id}
                          hover
                          sx={{
                            transition: 'background 0.3s ease',
                            '&:hover': {
                              backgroundColor: '#f4f6f8',
                            },
                          }}
                        >
                          <TableCell>{log.message}</TableCell>
                          <TableCell>{log.device}</TableCell>
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
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
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
      </Paper>
    </Box>
  );
}
