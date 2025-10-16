import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Typography,
  Box,
  Card,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stack,
} from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import FaceIcon from "@mui/icons-material/Face";
import ListAltIcon from "@mui/icons-material/ListAlt";
import PersonIcon from "@mui/icons-material/Person";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  const pages = [
    { title: "Access Control", path: "/access", icon: <LockOpenIcon />, color: "#1565c0" },
    { title: "Alerts", path: "/alerts", icon: <NotificationsActiveIcon />, color: "#e53935" },
    { title: "Face Registration", path: "/registration", icon: <FaceIcon />, color: "#6c5ce7" },
    { title: "Access Logs", path: "/logs", icon: <ListAltIcon />, color: "#26a69a" },
    { title: "Registered Users", path: "/users", icon: <PersonIcon />, color: "#546e7a" },
  ];

  const [accessData, setAccessData] = useState([
    { name: "Granted", value: 0, color: "#00b894" },
    { name: "Denied", value: 0, color: "#d63031" },
  ]);
  const [attemptsData, setAttemptsData] = useState([]);
  const [hourlyData, setHourlyData] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [totalAlerts, setTotalAlerts] = useState(0);
  const [recentLogs, setRecentLogs] = useState([]);
  const [privilegeData, setPrivilegeData] = useState([]);
  const serverIP = import.meta.env.VITE_SERVER_IP;
  useEffect(() => {
    const fetchCharts = async () => {
      try {
        // Fetch Pie data
        const resPie = await fetch(`http://${serverIP}:3000/api/summary`);
        const pieJson = await resPie.json();
        if (pieJson) setAccessData(pieJson);

        // Fetch Bar data
        const resBar = await fetch(`http://${serverIP}:3000/api/access-trend`);
        const barJson = await resBar.json();
        if (barJson) {
          const mappedData = barJson.map((item) => {
            const date = new Date(item.day);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            return { ...item, day: dayName };
          });

          const combinedData = mappedData.reduce((acc, curr) => {
            const existing = acc.find((a) => a.day === curr.day);
            if (existing) existing.Attempts += curr.Attempts;
            else acc.push({ day: curr.day, Attempts: curr.Attempts });
            return acc;
          }, []);

          const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          allDays.forEach((day) => {
            if (!combinedData.find((d) => d.day === day)) combinedData.push({ day, Attempts: 0 });
          });

          combinedData.sort((a, b) => allDays.indexOf(a.day) - allDays.indexOf(b.day));
          setAttemptsData(combinedData);
        }

        // Fetch hourly data
        const resHourly = await fetch(`http://${serverIP}:3000/api/hourly-trend`);
        const hourlyJson = await resHourly.json();
        if (hourlyJson) setHourlyData(hourlyJson);

        // Fetch total counts
        const resCounts = await fetch(`http://${serverIP}:3000/api/total-counts`);
        const countsJson = await resCounts.json();
        if (countsJson) {
          setTotalUsers(countsJson.totalUsers);
          setTotalAttempts(countsJson.totalAttempts);
          setTotalAlerts(countsJson.totalAlerts);
        }

        // Fetch recent access logs
        const resLogs = await fetch(`http://${serverIP}:3000/api/recent-logs`);
        const logsJson = await resLogs.json();
        if (logsJson) setRecentLogs(logsJson);

        // Fetch user privilege data
        const resPrivilege = await fetch(`http://${serverIP}:3000/api/privilege-distribution`);
        const privilegeJson = await resPrivilege.json();
        if (privilegeJson) setPrivilegeData(privilegeJson);
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchCharts();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`http://${serverIP}:3000/api/logs`);
        const data = await res.json();
        setRecentLogs(data.logs || []);
      } catch (err) {
        console.error("Error fetching logs:", err);
      }
    };

    fetchLogs();
  }, []);

  const renderCustomLabel = ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`;

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      padding: { xs: "24px 12px", md: "48px 16px" },
    }}>
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        <Typography variant="h3" fontWeight="800" color="text.primary" gutterBottom>
          Overview
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>System status and key metrics</Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* Quick Navigation */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              Quick Navigation
            </Typography>
            <Grid container spacing={2.5} mt={1}>
              {pages.map((page) => (
                <Grid item xs={12} sm={6} md={3} lg={3} key={page.title}>
                  <Card
                    onClick={() => navigate(page.path)}
                    sx={{
                      borderRadius: 3,
                      textAlign: "left",
                      cursor: "pointer",
                      p: 2.5,
                      height: 160,
                      border: '1px solid rgba(255,255,255,0.06)',
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      transition: "transform .2s ease, box-shadow .2s ease",
                      "&:hover": { transform: "translateY(-4px)", boxShadow: 10 },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          bgcolor: `${page.color}33`,
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                        }}
                      >
                        {React.cloneElement(page.icon, { sx: { fontSize: 28, color: page.color } })}
                      </Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {page.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Open {page.title}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Summary Cards */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6" fontWeight={600} color="#2d3436">
                  Total Users
                </Typography>
                <Typography variant="h4" fontWeight={800} color="primary.main">
                  {totalUsers}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6" fontWeight={600} color="#2d3436">
                  Total Access Attempts
                </Typography>
                <Typography variant="h4" fontWeight={800} color="secondary.main">
                  {totalAttempts}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: "center" }}>
                <Typography variant="h6" fontWeight={600} color="#2d3436">
                  Total Alerts
                </Typography>
                <Typography variant="h4" fontWeight={800} color="#e53935">
                  {totalAlerts}
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Access Attempts Pie Chart */}
            <Card sx={{ p: 3, borderRadius: 3, textAlign: "center" }}>
              <Typography variant="h6" mb={2} fontWeight={600}>
                Access Attempts
              </Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={accessData}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={100}
                    label={renderCustomLabel}
                    labelLine={false}
                    paddingAngle={5}
                  >
                    {accessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} attempts`} />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Access Trend Bar Chart */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2} fontWeight={600}>
                Access Trend
              </Typography>
              <Box sx={{ width: "100%", minHeight: 240 }}>
                <ResponsiveContainer width={700} height={240}>
                  <BarChart data={attemptsData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.9} />
                        <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0.3} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" tick={{ fontWeight: 600 }} />
                    <YAxis tick={{ fontWeight: 600 }} />
                    <Tooltip />
                    <Bar dataKey="Attempts" fill="url(#gradientColor)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Card>

            {/* Hourly Access Trend Line Chart */}
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2} fontWeight={600}>
                Hourly Access Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Attempts" stroke="#6c5ce7" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>

          {/* Recent Access Logs */}
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2} fontWeight={600}>
                Recent Access Logs
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Timestamp</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLogs.map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>{log.name}</TableCell>
                        <TableCell>{log.status}</TableCell>
                        <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          {/* User Privilege Distribution */}
          <Grid item xs={12}>
            <Card sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2} fontWeight={600}>
                User Privilege Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={privilegeData}
                    dataKey="value"
                    innerRadius={80}
                    outerRadius={120}
                    label
                    paddingAngle={5}
                  >
                    {privilegeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
