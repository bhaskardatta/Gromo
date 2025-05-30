import React, { ReactElement } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VoiceProcessing from './components/VoiceProcessing';
import ClaimsManagement from './components/ClaimsManagement';
import OCRProcessing from './components/OCRProcessing';
import './App.css';

// Simple authentication check
const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const isAuthenticated = localStorage.getItem('authToken') !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/voice"
          element={
            <PrivateRoute>
              <VoiceProcessing />
            </PrivateRoute>
          }
        />
        <Route
          path="/claims"
          element={
            <PrivateRoute>
              <ClaimsManagement />
            </PrivateRoute>
          }
        />
        <Route
          path="/ocr"
          element={
            <PrivateRoute>
              <OCRProcessing />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
