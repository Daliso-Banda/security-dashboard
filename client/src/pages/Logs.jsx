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
} from '@mui/material';
import axios from 'axios';

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/logs')
      .then((res) => {
        setLogs(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#232946', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundSize: 'cover' }}>
      <Box component={Paper} elevation={4} sx={{ p: 4, borderRadius: 4, maxWidth: 1100, width: 500, boxShadow: 3, mx: 'auto' }}>
        <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 600, color: '#2d3436', mb: 3 }}>
          Historical Security Logs
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Message</strong></TableCell>
                  <TableCell><strong>Device</strong></TableCell>
                  <TableCell><strong>Severity</strong></TableCell>
                  <TableCell><strong>Timestamp</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No logs found.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell>{log.message}</TableCell>
                      <TableCell>{log.device}</TableCell>
                      <TableCell>{log.severity}</TableCell>
                      <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
}
