import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaRegCalendarAlt, FaCreditCard } from 'react-icons/fa';
import { formatCurrency } from '../utils/formatters';

const DashboardMetrics = ({ transactions }) => {
  // Calculate metrics
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const profit = income - expense;
  
  // Get profit percentage (avoid division by zero)
  const profitPercentage = income > 0 
    ? ((profit / income) * 100).toFixed(1)
    : 0;

  const incomePercentage = expense + income > 0 
    ? ((income / (expense + income)) * 100).toFixed(0)
    : 0;
    
  // Get current week spending
  const now = new Date();
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  const weeklySpending = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) >= oneWeekAgo)
    .reduce((sum, t) => sum + t.amount, 0);
    
  // Calculate average daily spending
  const avgDailySpending = weeklySpending / 7;
  
  // Generate fake data for weekly spending visualization
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyData = weekDays.map((day, i) => {
    // Random height between 10 and 40px for visualization
    const height = 10 + Math.floor(Math.random() * 30);
    // Make today's bar active
    const isActive = i === currentDay;
    
    return { day, height, isActive };
  });
  
  // Upcoming payments data (example)
  const upcomingPayments = [
    { id: 1, title: 'Electricity Bill', date: 'Oct 15', amount: 1200, icon: <FaRegCalendarAlt /> },
    { id: 2, title: 'Raw Materials', date: 'Oct 18', amount: 5000, icon: <FaCreditCard /> },
  ];
  
  return (
    <>
      {/* Income and Expense Summary */}
      <Row className="mb-4">
        <Col md={4} className="mb-3 mb-md-0">
          <Card className="summary-card card-3d">
            <div className="card-3d-inner">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3 icon-income feature-card-icon">
                  <FaArrowDown />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Income</h6>
                  <h4 className="text-income mb-0">{formatCurrency(income)}</h4>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Total earnings</span>
                <span className="text-success small">
                  <FaArrowUp size={10} className="me-1" />
                  {incomePercentage}%
                </span>
              </div>
            </div>
          </Card>
        </Col>
        <Col md={4} className="mb-3 mb-md-0">
          <Card className="summary-card card-3d">
            <div className="card-3d-inner">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3 icon-expense feature-card-icon">
                  <FaArrowUp />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Expenses</h6>
                  <h4 className="text-expense mb-0">{formatCurrency(expense)}</h4>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Total spending</span>
                <span className="text-expense small">
                  <FaArrowUp size={10} className="me-1" />
                  {expense > 0 ? ((expense / (income || 1)) * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </Card>
        </Col>
        {/* Profit Card - Currently not displayed */}
        {/* <Col md={4}>
          <Card className="summary-card card-3d">
            <div className="card-3d-inner">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3 icon-profit feature-card-icon">
                  <FaBalanceScale />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Profit</h6>
                  <h4 className="text-profit mb-0">{formatCurrency(profit)}</h4>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Net gain/loss</span>
                <span className={`small ${profit >= 0 ? 'text-success' : 'text-danger'}`}>
                  {profitPercentage}%
                </span>
              </div>
            </div>
          </Card>
        </Col> */}
      </Row>

      {/* Weekly Spending Visualization */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h5 className="mb-3">Weekly Spending</h5>
          <div className="weekly-spending-chart d-flex justify-content-around align-items-end" style={{ height: '100px' }}>
            {weeklyData.map(({ day, height, isActive }) => (
              <div key={day} className={`bar-container d-flex flex-column align-items-center ${isActive ? 'active' : ''}`}>
                <div className="bar" style={{ height: `${height}px` }}></div>
                <small className="day-label mt-1">{day}</small>
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <h6 className="mb-0">Average Daily Spending: {formatCurrency(avgDailySpending)}</h6>
          </div>
        </Card.Body>
      </Card>

      {/* Upcoming Payments - Currently not displayed */}
      {/* <Card className="shadow-sm">
        <Card.Header>
          <h5 className="mb-0">Upcoming Payments</h5>
        </Card.Header>
        <Card.Body>
          <ListGroup variant="flush">
            {upcomingPayments.map(payment => (
              <ListGroup.Item key={payment.id} className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  {payment.icon}
                  <span className="ms-2">{payment.title}</span>
                </div>
                <div>
                  <span className="me-2 text-muted small">{payment.date}</span>
                  <span className="fw-bold">{formatCurrency(payment.amount)}</span>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Card.Body>
      </Card> */}
    </>
  );
};

export default DashboardMetrics;