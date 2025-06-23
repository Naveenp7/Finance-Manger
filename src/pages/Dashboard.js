import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import DashboardMetrics from '../components/DashboardMetrics';
import DashboardCharts from '../components/DashboardCharts';
import TransactionFilter from '../components/TransactionFilter';
import { fetchTransactions } from '../services/api';
import { FaWallet, FaExchangeAlt, FaFileAlt, FaCreditCard, FaChartLine } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [greeting, setGreeting] = useState('');
  const { darkMode } = useTheme();

  // Set greeting based on time of day
  useEffect(() => {
    const hours = new Date().getHours();
    let greet = '';
    
    if (hours < 12) greet = 'Good Morning';
    else if (hours < 18) greet = 'Good Afternoon';
    else greet = 'Good Evening';
    
    setGreeting(greet);
  }, []);

  // Load transactions with default filters (current month)
  const loadTransactions = async (filters = {}) => {
    try {
      setIsLoading(true);
      const data = await fetchTransactions(filters);
      setTransactions(data);
      setError(null);
    } catch (err) {
      setError('Error loading transactions. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    // Default to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const defaultFilters = {
      start_date: firstDay.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0]
    };
    
    loadTransactions(defaultFilters);
  }, []);

  // Handle filter changes
  const handleFilterChange = (filters) => {
    loadTransactions(filters);
  };

  // Render feature cards
  const renderFeatureCards = () => {
    const features = [
      {
        title: 'Transactions',
        description: 'Add or view your recent income and expenses',
        icon: <FaExchangeAlt size={20} />,
        iconClass: 'icon-primary',
        link: '/transactions'
      },
      {
        title: 'Reports',
        description: 'Export and analyze your financial data',
        icon: <FaFileAlt size={20} />,
        iconClass: 'icon-report',
        link: '/reports'
      },
      {
        title: 'Payment Cards',
        description: 'Manage your credit and debit cards',
        icon: <FaCreditCard size={20} />,
        iconClass: 'icon-income',
        link: '/transactions'
      }
    ];
    
    return (
      <Row className="row-cols-1 row-cols-md-3 g-3 mb-4">
        {features.map((feature, index) => (
          <Col key={index}>
            <Link to={feature.link} className="text-decoration-none">
              <div className="feature-card">
                <div className={`feature-card-icon ${feature.iconClass}`}>
                  {feature.icon}
                </div>
                <h4>{feature.title}</h4>
                <p>{feature.description}</p>
              </div>
            </Link>
          </Col>
        ))}
      </Row>
    );
  };

  // Render credit card
  const renderCreditCard = () => {
    return (
      <div className="credit-card">
        <div className="credit-card-brand">VISA</div>
        <div className="credit-card-chip">💳</div>
        <div className="credit-card-number">**** **** **** 4389</div>
        <div className="credit-card-holder">PANEKKATT OIL MILL</div>
        <div className="credit-card-exp">EXP: 06/25</div>
      </div>
    );
  };

  return (
    <Container fluid>
      <div className="welcome-banner mt-3">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h2>Hi, {greeting}! 👋</h2>
            <p>Welcome to your financial dashboard</p>
          </div>
          <div className="money-icon-container d-none d-md-flex">
            <FaChartLine className="money-icon" />
          </div>
        </div>
        
        {transactions.length > 0 && (
          <div className="mobile-notification mt-3">
            <div className="mobile-notification-icon">
              <FaWallet />
            </div>
            <div className="mobile-notification-content">
              <p className="mobile-notification-text">
                You have {transactions.filter(t => t.type === 'expense').length} expenses 
                and {transactions.filter(t => t.type === 'income').length} income transactions 
                this month.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {renderFeatureCards()}
      
      <div className="d-md-none mb-4">
        {renderCreditCard()}
      </div>
      
      <Card className="mb-4 card-3d">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Transaction Period</h5>
            <small className="text-muted">Filter by date range</small>
          </div>
        </Card.Header>
        <Card.Body>
          <TransactionFilter onFilterChange={handleFilterChange} />
        </Card.Body>
      </Card>
      
      {isLoading ? (
        <div className="text-center p-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading dashboard data...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          <DashboardMetrics transactions={transactions} />
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">Insights & Charts</h4>
            <Button variant="outline-primary" size="sm" className="rounded-pill">
              View All
            </Button>
          </div>
          
          <DashboardCharts transactions={transactions} />
          
          <div className="d-none d-md-block">
            <h4 className="mb-3">Your Payment Cards</h4>
            <Row>
              <Col md={6}>
                {renderCreditCard()}
              </Col>
            </Row>
          </div>
        </>
      )}
    </Container>
  );
};

export default Dashboard; 