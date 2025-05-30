import React, { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VoiceProcessing from './components/VoiceProcessing';
import ClaimsManagement from './components/ClaimsManagement';
import OCRProcessing from './components/OCRProcessing';
import theme from './theme'; // Import the theme
import Layout from './components/Layout'; // Import the Layout component
import './App.css';

// Simple authentication check
const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  // Wrap children with Layout if authenticated
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider theme={theme}> {/* Apply the theme */}
      <CssBaseline /> {/* Normalize CSS */}
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={<PrivateRoute><Dashboard /></PrivateRoute>}
          />
          <Route
            path="/voice"
            element={<PrivateRoute><VoiceProcessing /></PrivateRoute>}
          />
          <Route
            path="/claims"
            element={<PrivateRoute><ClaimsManagement /></PrivateRoute>}
          />
          <Route
            path="/ocr"
            element={<PrivateRoute><OCRProcessing /></PrivateRoute>}
          />
          {/* Default route for authenticated users, can redirect to dashboard */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
