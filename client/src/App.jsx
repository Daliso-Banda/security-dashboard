import React from 'react';
import Dashboard from './pages/Dashboard';

// main.jsx or App.jsx
import { Buffer } from 'buffer';
window.Buffer = Buffer;


function App() {
  return <Dashboard />;
}

export default App;
