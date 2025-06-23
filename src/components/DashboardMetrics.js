import React from 'react';
import { Row, Col, Card } from 'react-bootstrap';
import { FaArrowUp, FaArrowDown, FaBalanceScale, FaChartPie, FaMoneyBillWave, FaWallet, FaRegCalendarAlt, FaCreditCard } from 'react-icons/fa';
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
        <Col md={4}>
          <Card className="summary-card card-3d">
            <div className="card-3d-inner">
              <div className="d-flex align-items-center mb-3">
                <div className="me-3 icon-report feature-card-icon">
                  <FaMoneyBillWave />
                </div>
                <div>
                  <h6 className="text-muted mb-0">Balance</h6>
                  <h4 className={profit >= 0 ? "text-income mb-0" : "text-expense mb-0"}>
                    {formatCurrency(profit)}
                  </h4>
                </div>
              </div>
              <div className="d-flex justify-content-between">
                <span className="text-muted small">Net earnings</span>
                <span className={profit >= 0 ? "text-success small" : "text-danger small"}>
                  {profit >= 0 ? <FaArrowUp size={10} className="me-1" /> : <FaArrowDown size={10} className="me-1" />}
                  {profitPercentage}%
                </span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
      
      {/* Dark Analytics Card with Weekly Spending */}
      <Row className="mb-4">
        <Col md={7} className="mb-3 mb-md-0">
          <div className="analytics-card">
            <h3>Weekly Spending</h3>
            <div className="analytics-card-content">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="text-white mb-2">{formatCurrency(weeklySpending)}</h4>
                  <p className="text-light mb-0">Avg. {formatCurrency(avgDailySpending)}/day</p>
                </div>
                <div>
                  <span className="badge bg-primary rounded-pill">
                    <FaArrowUp className="me-1" size={10} />
                    8% vs. last week
                  </span>
                </div>
              </div>
              
              {/* Weekly spending visualization with enhanced effects */}
              <div className="weekly-spending mt-4">
                {weeklyData.map((data, index) => (
                  <div key={index} className="day-column">
                    <div 
                      className={`spending-bar ${data.isActive ? 'active' : ''}`} 
                      style={{ 
                        height: `${data.height}px`,
                        boxShadow: data.isActive ? '0 0 10px var(--primary-color)' : 'none',
                        transform: data.isActive ? 'scale(1.1)' : 'scale(1)'
                      }}
                    ></div>
                    <span className="day-label">{data.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Col>
        
        <Col md={5}>
          <div className="analytics-card h-100">
            <h3>Upcoming Payments</h3>
            <div className="analytics-card-content">
              <div className="upcoming-payments">
                {upcomingPayments.map((payment) => (
                  <div key={payment.id} className="payment-item">
                    <div className="payment-icon">
                      {payment.icon}
                    </div>
                    <div className="payment-details">
                      <div className="payment-title">{payment.title}</div>
                      <div className="payment-date">{payment.date}</div>
                    </div>
                    <div className="payment-amount">
                      {formatCurrency(payment.amount)}
                    </div>
                  </div>
                ))}
                
                {upcomingPayments.length === 0 && (
                  <p className="text-light">No upcoming payments</p>
                )}
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
};

export default DashboardMetrics; 