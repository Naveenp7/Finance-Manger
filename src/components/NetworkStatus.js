import React from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { FaExclamationTriangle } from 'react-icons/fa';

const NetworkStatus = () => {
  const { isOnline } = useAuth();

  if (isOnline) {
    return null;
  }

  return (
    <ToastContainer position="top-center" className="p-3" style={{ zIndex: 1070 }}>
      <Toast show={!isOnline} bg="warning">
        <Toast.Body className="d-flex align-items-center text-dark">
          <FaExclamationTriangle className="me-2" />
          <span>You are currently offline. Some features may be limited.</span>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default NetworkStatus;