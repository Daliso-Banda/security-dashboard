import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AccessControl from './pages/AccessControl';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';                    // Capital L
import FaceRegistration from './pages/FaceRegistration'; // Capital F
import UsersPage from './pages/UsersPage';
import LiveStream from './pages/LiveStream';        // ✅ New LiveStream page

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/access" element={<AccessControl />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/registration" element={<FaceRegistration />} />
        <Route path="/live" element={<LiveStream />} />   {/* ✅ New route */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
