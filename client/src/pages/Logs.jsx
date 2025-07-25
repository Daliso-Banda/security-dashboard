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
  const [error, setError] = useState(null); // Added state for error handling

  useEffect(() => {
    // Correct the API endpoint to match your Node.js server's port
    axios.get('http://localhost:3000/api/logs')
      .then((res) => {
        // Access res.data.logs as per your Node.js API response structure
        if (res.data && Array.isArray(res.data.logs)) {
          setLogs(res.data.logs);
        } else {
          console.warn("Unexpected data format for logs:", res.data);
          setLogs([]); // Ensure logs is an empty array if data format is unexpected
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching logs:", err);
        setError("Failed to fetch logs. Please try again later."); // Set an error message
        setLoading(false);
      });
  }, []);

  // Function to determine severity based on the log message
  const getSeverity = (message) => {
    if (message.toLowerCase().includes('unknown person')) {
      return 'High'; // Or a specific warning color
    }
    return 'Low'; // Or a default color for known entries
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#232946', backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', backgroundSize: 'cover' }}>
      <Box component={Paper} elevation={4} sx={{ p: 4, borderRadius: 4, maxWidth: 1100, width: '90%', boxShadow: 3, mx: 'auto' }}>
        <Typography variant="h4" align="left" gutterBottom sx={{ fontWeight: 600, color: '#2d3436', mb: 3 }}>
          Historical Security Logs
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : error ? ( // Display error message if there's an error
            <Typography color="error" align="center" variant="h6">
              {error}
            </Typography>
        ) : (
          <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 600, overflow: 'auto' }}> {/* Added Paper component and max height for scroll */}
            <Table stickyHeader aria-label="logs table"> {/* stickyHeader for better UX with scrolling */}
              <TableHead>
                <TableRow>
                  <TableCell><strong>Message</strong></TableCell>
                  <TableCell><strong>Device</strong></TableCell>
                  <TableCell><strong>Severity</strong></TableCell> {/* Severity column remains */}
                  <TableCell><strong>Timestamp</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">No logs found.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}> {/* Changed key to log._id */}
                      <TableCell>{log.message}</TableCell>
                      <TableCell>{log.device}</TableCell>
                      <TableCell>{getSeverity(log.message)}</TableCell> {/* Dynamically determine severity */}
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