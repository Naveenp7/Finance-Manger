import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import NetworkStatus from './components/NetworkStatus';
import AIAgentModal from './components/aiAgentModal';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import AiInsights from './pages/AiInsights';
import AIAssistant from './pages/AIAssistant';

// Icons for mobile navigation
import { FaHome, FaExchangeAlt, FaTags, FaRobot, FaUser } from 'react-icons/fa';

// Capacitor imports
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import './styles/theme.css';
import './styles/components.css';

// Create mobile navigation component with access to location
const MobileNavigation = () => {
  const location = useLocation();
  const [showAIModal, setShowAIModal] = useState(false);

  const openAIModal = () => {
    setShowAIModal(true);
  };

  const closeAIModal = () => {
    setShowAIModal(false);
  };


  return (
    <div className="d-md-none fixed-bottom mobile-navigation">
      <div className="d-flex justify-content-around">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <FaHome size={20} />
          <span>Home</span>
        </Link>
        <Link to="/transactions" className={location.pathname === '/transactions' ? 'active' : ''}>
          <FaExchangeAlt size={20} />
          <span>Trans</span>
        </Link>
        <Link to="/categories" className={location.pathname === '/categories' ? 'active' : ''}>
          <FaTags size={20} />
          <span>Categ</span>
        </Link>
        <div onClick={openAIModal} style={{cursor: 'pointer'}}>
          <FaRobot size={20} />
          <span>AI</span>
        </div>
        <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>
          <FaUser size={20} />
          <span>Profile</span>
        </Link>
      </div>

      <AIAgentModal show={showAIModal} onHide={closeAIModal} />
    </div>
  );
};

// Initialize Capacitor plugins if running on native platforms
if (Capacitor.isNativePlatform()) {
  // Initialize speech recognition
  try {
    SpeechRecognition.available().then(result => {
      console.log('Speech recognition availability checked:', result);
    }).catch(err => {
      console.error('Error checking speech recognition:', err);
    });
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
  }
}

function App() {
  const isAuthRoute = () => {
    return window.location.pathname === '/login' || window.location.pathname === '/signup';
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <div className="app-container">
            {!isAuthRoute() && <Navbar />}
            <NetworkStatus />
            <Container fluid className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route 
                  path="/" 
                  element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/transactions" 
                  element={
                    <PrivateRoute>
                      <Transactions />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <PrivateRoute>
                      <Reports />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/categories" 
                  element={
                    <PrivateRoute>
                      <Categories />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/ai-insights" 
                  element={
                    <PrivateRoute>
                      <AiInsights />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  } 
                />
                <Route 
                  path="/ai-assistant" 
                  element={
                    <PrivateRoute>
                      <AIAssistant />
                    </PrivateRoute>
                  } 
                />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Container>

            {/* Desktop Footer */}
            {!isAuthRoute() && (
              <footer className="d-none d-md-block text-center py-3 mt-4">
                <Container>
                  <p>© {new Date().getFullYear()} Panekkatt Oil Mill | Money Tracker</p>
                </Container>
              </footer>
            )}

            {/* Mobile Navigation */}
            {!isAuthRoute() && <MobileNavigation />}
          </div>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;