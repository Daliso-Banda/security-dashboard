import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Typography,
  Box,
  Card,
  Divider,
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
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();

  const pages = [
    { title: "Access Control", path: "/access", icon: <LockOpenIcon />, color: "#6c5ce7" },
    { title: "Alerts", path: "/alerts", icon: <NotificationsActiveIcon />, color: "#d63031" },
    { title: "Face Registration", path: "/registration", icon: <FaceIcon />, color: "#00b894" },
    { title: "Access Logs", path: "/logs", icon: <ListAltIcon />, color: "#0984e3" },
    { title: "Registered Users", path: "/users", icon: <PersonIcon />, color: "#636e72" },
  ];

  const [accessData, setAccessData] = useState([
    { name: "Granted", value: 0, color: "#00b894" },
    { name: "Denied", value: 0, color: "#d63031" },
  ]);
  const [attemptsData, setAttemptsData] = useState([]);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        // Fetch Pie data
        const resPie = await fetch("http://10.252.154.149:3000/api/summary");
        const pieJson = await resPie.json();
        if (pieJson) setAccessData(pieJson);

        // Fetch Bar data
        const resBar = await fetch("http://10.252.154.149:3000/api/access-trend");
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
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchCharts();
  }, []);

  const renderCustomLabel = ({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #f0f3f7, #e1e6eb)",
        display: "flex",
        justifyContent: "center",
        padding: { xs: "24px 12px", md: "48px 16px" },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        <Typography variant="h3" fontWeight="bold" color="#2d3436" gutterBottom>
          Security Dashboard
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Grid container spacing={4}>
          {/* Quick Navigation */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" gutterBottom>
              Quick Navigation
            </Typography>
            <Grid container spacing={3} mt={1}>
              {pages.map((page) => (
                <Grid item xs={12} sm={6} md={4} key={page.title}>
                  <Card
                    onClick={() => navigate(page.path)}
                    sx={{
                      backgroundColor: page.color,
                      color: "#fff",
                      borderRadius: 4,
                      textAlign: "center",
                      cursor: "pointer",
                      p: 3,
                      height: 180,
                      boxShadow: 4,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05) rotateX(2deg)",
                        boxShadow: 8,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "rgba(255,255,255,0.2)",
                        width: 70,
                        height: 70,
                        borderRadius: "50%",
                        mx: "auto",
                        mb: 2,
                      }}
                    >
                      {React.cloneElement(page.icon, { sx: { fontSize: 40, color: "#fff" } })}
                    </Box>
                    <Typography variant="h6" fontWeight={600} sx={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                      {page.title}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Access Attempts Pie Chart */}
            <Card sx={{ p: 3, borderRadius: 4, boxShadow: 4, textAlign: "center" }}>
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
            <Card sx={{ p: 3, borderRadius: 4, boxShadow: 4 }}>
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
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
