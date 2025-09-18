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
  Legend,
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

  // -------------------- State for dynamic charts --------------------
  const [accessData, setAccessData] = useState([
    { name: "Granted", value: 0, color: "#00b894" },
    { name: "Denied", value: 0, color: "#d63031" },
  ]);

  const [attemptsData, setAttemptsData] = useState([]);

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        // Pie chart
        const resPie = await fetch("http://10.24.91.149:5175/api/access-summary");
        const pieJson = await resPie.json();
        if (pieJson) setAccessData(pieJson);

        // Bar chart
        const resBar = await fetch("http://10.24.91.149:5175/api/access-trend");
        const barJson = await resBar.json();

        if (barJson) {
          // Map dates to weekday names
          const mappedData = barJson.map((item) => {
            const date = new Date(item.day);
            const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
            return { ...item, day: dayName };
          });

          // Combine duplicates for same weekday
          const combinedData = mappedData.reduce((acc, curr) => {
            const existing = acc.find((a) => a.day === curr.day);
            if (existing) {
              existing.Attempts += curr.Attempts;
            } else {
              acc.push({ day: curr.day, Attempts: curr.Attempts });
            }
            return acc;
          }, []);

          // Ensure all weekdays exist
          const allDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          allDays.forEach((day) => {
            if (!combinedData.find((d) => d.day === day)) {
              combinedData.push({ day, Attempts: 0 });
            }
          });

          // Sort weekdays
          combinedData.sort((a, b) => allDays.indexOf(a.day) - allDays.indexOf(b.day));

          setAttemptsData(combinedData);
        }
      } catch (err) {
        console.error("Error fetching chart data:", err);
      }
    };

    fetchCharts();
  }, []);

  // Custom label for Pie chart (name + percentage)
  const renderCustomLabel = ({ name, percent }) =>
    `${name}: ${(percent * 100).toFixed(0)}%`;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(to right, #f8f9fa, #e9ecef)",
        display: "flex",
        justifyContent: "center",
        padding: "48px 16px",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1200 }}>
        <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
          Security Dashboard
        </Typography>
        <Divider sx={{ mb: 3 }} />

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
                      borderRadius: 3,
                      textAlign: "center",
                      cursor: "pointer",
                      p: 3,
                      height: 180,
                      boxShadow: 3,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: 6,
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "center" }}>
                      {React.cloneElement(page.icon, { sx: { fontSize: 60 } })}
                    </Box>
                    <Typography variant="h6" mt={1.5}>
                      {page.title}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid item xs={12} md={4} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Pie Chart */}
            <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
              <Typography variant="h6" mb={2}>
                Access Attempts
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={accessData}
                    dataKey="value"
                    outerRadius={110} // Bigger circle
                    label={renderCustomLabel} // Custom labels
                    labelLine={false}
                  >
                    {accessData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* Bar Chart */}
            <Card sx={{ p: 2, borderRadius: 3, boxShadow: 3, width: 800 }}>
              <Typography variant="h6" mb={2}>
                Access Trend
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attemptsData}>
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Attempts" fill="#6c5ce7" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
