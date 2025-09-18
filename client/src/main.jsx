import React, { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layout/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Alerts from './pages/Alerts.jsx';
import AccessControl from './pages/AccessControl.jsx';
import Logs from './pages/Logs.jsx';
import FaceRegistration from './pages/FaceRegistration.jsx';
import UsersPage from './pages/UsersPage.jsx';
import LiveStream from './pages/LiveStream.jsx'; // ✅ Added LiveStream
import './index.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Optional: log errorInfo to a reporting service
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: 'center', color: '#c0392b', fontSize: 20 }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="access" element={<AccessControl />} />
            <Route path="logs" element={<Logs />} />
            <Route path="registration" element={<FaceRegistration />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="live" element={<LiveStream />} /> {/* ✅ LiveStream route */}
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
