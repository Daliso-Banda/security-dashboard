import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AccessControl from './pages/AccessControl';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';                    // Capital L
import FaceRegistration from './pages/FaceRegistration'; // Capital F
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/access" element={<AccessControl />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/register" element={<FaceRegistration />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
