import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUserPlus, FaUser } from 'react-icons/fa';

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      await signUp(formData.email, formData.password, formData.displayName);
      navigate('/');
    } catch (err) {
      setError('Failed to create an account. ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "85vh" }}>
      <div style={{ maxWidth: "400px", width: "100%" }}>
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <div className="money-icon-container mx-auto">
                <FaUser className="money-icon" />
              </div>
              <h2 className="fw-bold">Create Account</h2>
              <p className="text-muted">Join Panekkatt Oil Mill Money Tracker</p>
            </div>
            
            {error && <Alert variant="danger">{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control 
                  type="text" 
                  name="displayName"
                  required 
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  className="form-control-lg"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <Form.Control 
                  type="email"
                  name="email" 
                  required 
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="form-control-lg"
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control 
                  type="password"
                  name="password" 
                  required 
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="form-control-lg"
                />
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>Confirm Password</Form.Label>
                <Form.Control 
                  type="password" 
                  name="confirmPassword"
                  required 
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="form-control-lg"
                />
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="primary" 
                  type="submit" 
                  size="lg"
                  className="py-3"
                  disabled={loading}
                >
                  <FaUserPlus className="me-2" />
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </Form>
            
            <div className="text-center mt-4">
              <p>
                Already have an account? <Link to="/login" className="text-decoration-none">Sign In</Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </div>
    </Container>
  );
};

export default Signup; 