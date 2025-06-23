import React, { useState } from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button, Dropdown } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartLine, FaExchangeAlt, FaFileAlt, FaBell, FaUser, FaSignOutAlt, FaPlus, FaTags, FaRobot } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import AIAgentModal from './aiAgentModal';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, logout, isOnline } = useAuth();
  const { darkMode } = useTheme();
  const [showAIAgent, setShowAIAgent] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleAddTransaction = () => {
    navigate('/transactions', { state: { openForm: true } });
  };

  return (
    <BootstrapNavbar 
      bg={darkMode ? "dark" : "light"} 
      variant={darkMode ? "dark" : "light"} 
      expand="lg" 
      className="py-3 shadow-sm" 
      style={{ 
        backgroundColor: 'var(--navbar-bg)', 
        boxShadow: 'var(--navbar-shadow)'
      }}
    >
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <div className="me-2 d-flex align-items-center justify-content-center" 
               style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(94, 92, 230, 0.2)' }}>
            <span style={{ color: 'var(--primary-color)', fontSize: '1.2rem' }}>💰</span>
          </div>
          <span className="d-none d-md-inline">Panekkatt Money Tracker</span>
        </BootstrapNavbar.Brand>

        <div className="d-flex align-items-center me-2 d-lg-none">
          {!isOnline && (
            <div className="text-warning me-3">
              <small>Offline</small>
            </div>
          )}
          <Button 
            variant="outline-primary" 
            size="sm" 
            className="me-2"
            onClick={() => setShowAIAgent(true)}
            disabled={!isOnline}
          >
            <FaRobot />
          </Button>
          <ThemeToggle />
          <div className="notification-bell ms-2 me-3">
            <FaBell size={20} />
            <span className="notification-badge">3</span>
          </div>
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        </div>

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">
            <Nav.Link
              as={Link}
              to="/"
              className={`mx-1 px-3 ${location.pathname === '/' ? 'active fw-bold' : ''}`}
            >
              <FaChartLine className="me-2 d-none d-md-inline" /> Dashboard
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/transactions"
              className={`mx-1 px-3 ${location.pathname === '/transactions' ? 'active fw-bold' : ''}`}
            >
              <FaExchangeAlt className="me-2 d-none d-md-inline" /> Transactions
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/reports"
              className={`mx-1 px-3 ${location.pathname === '/reports' ? 'active fw-bold' : ''}`}
            >
              <FaFileAlt className="me-2 d-none d-md-inline" /> Reports
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/categories"
              className={`mx-1 px-3 ${location.pathname === '/categories' ? 'active fw-bold' : ''}`}
            >
              <FaTags className="me-2 d-none d-md-inline" /> Categories
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/ai-insights"
              className={`mx-1 px-3 ${location.pathname === '/ai-insights' ? 'active fw-bold' : ''}`}
            >
              <FaRobot className="me-2 d-none d-md-inline" /> AI Insights
            </Nav.Link>
            <Nav.Link as={Link} to="/ai-assistant" className={location.pathname === '/ai-assistant' ? 'active' : ''}>
              <FaRobot className="me-1" /> AI Assistant
            </Nav.Link>
          </Nav>

          <div className="d-none d-lg-flex align-items-center">
            {!isOnline && (
              <div className="text-warning me-3">
                <small>Offline Mode</small>
              </div>
            )}
            <ThemeToggle />
            <div className="notification-bell ms-2 me-3">
              <FaBell size={20} />
              <span className="notification-badge">3</span>
            </div>

            <Button 
              variant="primary" 
              size="sm" 
              className="rounded-pill px-3 py-2 me-2"
              onClick={handleAddTransaction}
              disabled={!isOnline}
            >
              <FaPlus className="me-1" /> Add Transaction
            </Button>

            <Button 
              variant="outline-primary" 
              size="sm" 
              className="rounded-pill px-3 py-2 me-3"
              onClick={() => setShowAIAgent(true)}
              disabled={!isOnline}
            >
              <FaRobot className="me-1" /> AI Assistant
            </Button>

            <Dropdown align="end">
              <Dropdown.Toggle variant={darkMode ? "dark" : "light"} id="dropdown-user" className="d-flex align-items-center border-0">
                <div className="d-flex align-items-center">
                  <div className="user-avatar me-2">
                    <FaUser />
                  </div>
                  <div className="d-none d-md-block">
                    <div className="small fw-bold">{userProfile?.displayName || currentUser?.displayName || 'User'}</div>
                    <div className="small text-muted">{userProfile?.role || 'User'}</div>
                  </div>
                </div>
              </Dropdown.Toggle>

              <Dropdown.Menu className={darkMode ? "dropdown-menu-dark" : ""}>
                <Dropdown.Item as={Link} to="/profile">
                  <FaUser className="me-2" /> My Profile
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={handleLogout}>
                  <FaSignOutAlt className="me-2" /> Sign Out
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </BootstrapNavbar.Collapse>
      </Container>

      {/* AI Agent Modal */}
      <AIAgentModal 
        show={showAIAgent} 
        onHide={() => setShowAIAgent(false)} 
      />
    </BootstrapNavbar>
  );
};

export default Navbar;