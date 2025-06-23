import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Row, Col, Tab, Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { updateUserProfile } from '../services/api';
import { FaUser, FaSave, FaSignOutAlt, FaAdjust, FaMoon, FaSun, FaPalette } from 'react-icons/fa';
import ThemeToggle from '../components/ThemeToggle';

const Profile = () => {
  const { currentUser, userProfile, logout, refreshProfile } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: '',
    companyName: 'Panekkatt Oil Mill'
  });

  // Load user profile data
  useEffect(() => {
    if (userProfile) {
      setFormData({
        displayName: userProfile.displayName || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        role: userProfile.role || '',
        companyName: userProfile.companyName || 'Panekkatt Oil Mill'
      });
    }
  }, [userProfile]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      // Update profile in Firestore
      await updateUserProfile(currentUser.uid, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
        companyName: formData.companyName,
        updatedAt: new Date().toISOString()
      });
      
      // Refresh profile in context
      await refreshProfile();
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      setError('Failed to log out: ' + err.message);
    }
  };

  return (
    <Container className="my-4">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="card-3d shadow">
            <Card.Header className="bg-primary text-white">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <FaUser className="me-2" size={24} />
                  <h4 className="mb-0">User Profile</h4>
                </div>
                <ThemeToggle />
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              <Tab.Container defaultActiveKey="profile">
                <Row className="g-0">
                  <Col md={3}>
                    <Nav variant="pills" className="flex-column p-3 h-100">
                      <Nav.Item>
                        <Nav.Link eventKey="profile" className="mb-2">
                          <FaUser className="me-2" /> Profile
                        </Nav.Link>
                      </Nav.Item>
                      <Nav.Item>
                        <Nav.Link eventKey="appearance" className="mb-2">
                          <FaPalette className="me-2" /> Appearance
                        </Nav.Link>
                      </Nav.Item>
                    </Nav>
                  </Col>
                  <Col md={9}>
                    <Tab.Content className="p-4">
                      <Tab.Pane eventKey="profile">
                        {error && <Alert variant="danger">{error}</Alert>}
                        {success && <Alert variant="success">{success}</Alert>}
                        
                        <Form onSubmit={handleSubmit}>
                          <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control 
                              type="text" 
                              name="displayName"
                              value={formData.displayName}
                              onChange={handleChange}
                              required
                            />
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control 
                              type="email" 
                              name="email"
                              value={formData.email}
                              disabled
                            />
                            <Form.Text className="text-muted">
                              Email cannot be changed
                            </Form.Text>
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Phone Number</Form.Label>
                            <Form.Control 
                              type="tel" 
                              name="phoneNumber"
                              value={formData.phoneNumber}
                              onChange={handleChange}
                            />
                          </Form.Group>
                          
                          <Form.Group className="mb-3">
                            <Form.Label>Role</Form.Label>
                            <Form.Control 
                              type="text" 
                              name="role"
                              value={formData.role}
                              onChange={handleChange}
                              placeholder="e.g., Manager, Accountant, Owner"
                            />
                          </Form.Group>
                          
                          <Form.Group className="mb-4">
                            <Form.Label>Company</Form.Label>
                            <Form.Control 
                              type="text" 
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleChange}
                            />
                          </Form.Group>
                          
                          <div className="d-flex justify-content-between">
                            <Button 
                              variant="primary" 
                              type="submit"
                              disabled={loading}
                              className="px-4"
                            >
                              <FaSave className="me-2" />
                              {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            
                            <Button 
                              variant="outline-danger" 
                              onClick={handleLogout}
                            >
                              <FaSignOutAlt className="me-2" />
                              Sign Out
                            </Button>
                          </div>
                        </Form>
                      </Tab.Pane>
                      
                      <Tab.Pane eventKey="appearance">
                        <h5 className="mb-4">Theme Settings</h5>
                        
                        <div className="appearance-option mb-4">
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <div>
                              <h6 className="mb-1">Dark Mode</h6>
                              <p className="text-muted mb-0 small">Switch between light and dark themes</p>
                            </div>
                            <ThemeToggle />
                          </div>
                          
                          <div className="theme-preview-container d-flex justify-content-between mt-4">
                            <div className={`theme-preview p-3 rounded ${!darkMode ? 'border border-primary' : 'border'}`} onClick={() => darkMode && toggleTheme()}>
                              <div className="d-flex align-items-center mb-2">
                                <FaSun className="me-2 text-warning" />
                                <span>Light Mode</span>
                              </div>
                              <div style={{ 
                                width: '100%', 
                                height: '80px', 
                                backgroundColor: '#f5f5f7',
                                borderRadius: '8px',
                                padding: '10px',
                                position: 'relative'
                              }}>
                                <div style={{ 
                                  position: 'absolute',
                                  top: '10px',
                                  left: '10px',
                                  right: '10px',
                                  height: '20px',
                                  backgroundColor: '#fff',
                                  borderRadius: '4px'
                                }}></div>
                                <div style={{ 
                                  position: 'absolute',
                                  bottom: '10px',
                                  left: '10px',
                                  width: '60%',
                                  height: '30px',
                                  backgroundColor: '#5e5ce6',
                                  borderRadius: '4px'
                                }}></div>
                              </div>
                            </div>
                            
                            <div className={`theme-preview p-3 rounded ${darkMode ? 'border border-primary' : 'border'}`} onClick={() => !darkMode && toggleTheme()}>
                              <div className="d-flex align-items-center mb-2">
                                <FaMoon className="me-2 text-secondary" />
                                <span>Dark Mode</span>
                              </div>
                              <div style={{ 
                                width: '100%', 
                                height: '80px', 
                                backgroundColor: '#111111',
                                borderRadius: '8px',
                                padding: '10px',
                                position: 'relative'
                              }}>
                                <div style={{ 
                                  position: 'absolute',
                                  top: '10px',
                                  left: '10px',
                                  right: '10px',
                                  height: '20px',
                                  backgroundColor: '#1c1c1e',
                                  borderRadius: '4px'
                                }}></div>
                                <div style={{ 
                                  position: 'absolute',
                                  bottom: '10px',
                                  left: '10px',
                                  width: '60%',
                                  height: '30px',
                                  backgroundColor: '#6e6df0',
                                  borderRadius: '4px'
                                }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Tab.Pane>
                    </Tab.Content>
                  </Col>
                </Row>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 