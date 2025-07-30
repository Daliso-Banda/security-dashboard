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
} from '@mui/material';
import axios from 'axios';

// Severity chip colors
const severityColors = {
  High: 'error',
  Medium: 'warning',
  Low: 'success',
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
          console.warn("Unexpected data format for logs:", res.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch logs. Please try again later.");
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
        bgcolor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          maxWidth: 1100,
          width: '95%',
          borderRadius: 4,
          p: 4,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: '#34495e', mb: 4 }}
          align="left"
        >
          Historical Security Logs
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" variant="h6">
            {error}
          </Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="logs table" sx={{ minWidth: 650 }}>
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
                    <TableCell colSpan={4} align="center" sx={{ py: 5 }}>
                      No logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const severity = getSeverity(log.message);
                    return (
                      <TableRow
                        key={log._id}
                        hover
                        sx={{ cursor: 'default' }}
                      >
                        <TableCell>{log.message}</TableCell>
                        <TableCell>{log.device}</TableCell>
                        <TableCell>
                          <Chip
                            label={severity}
                            color={severityColors[severity]}
                            size="small"
                            sx={{ fontWeight: 'bold' }}
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
        )}
      </Paper>
    </Box>
  );
}
