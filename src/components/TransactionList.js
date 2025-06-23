import React, { useState } from 'react';
import { Table, Badge, Button, Card, Row, Col } from 'react-bootstrap';
import { FaEdit, FaTrash, FaChevronDown, FaChevronUp, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const TransactionList = ({ transactions, onEdit, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);
  
  if (!transactions || transactions.length === 0) {
    return (
      <Card className="text-center p-4">
        <p className="text-muted mb-0">No transactions found.</p>
      </Card>
    );
  }
  
  // Format date to more readable format
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };
  
  const toggleDetails = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  // Mobile card view for transactions (shown on small screens)
  const renderMobileCards = () => {
    return (
      <div className="d-md-none">
        {transactions.map((transaction) => (
          <Card key={transaction.id} className="mb-3 mobile-card">
            <div className="mobile-card-header">
              <div className="d-flex align-items-center">
                <div className={`stat-card-icon ${transaction.type === 'income' ? 'icon-income' : 'icon-expense'}`}>
                  {transaction.type === 'income' ? <FaArrowUp /> : <FaArrowDown />}
                </div>
                <div className="ms-2">
                  <h6 className="mb-0">{transaction.category}</h6>
                  <small className="text-muted">{formatDate(transaction.date)}</small>
                </div>
              </div>
              <div className="text-end">
                <div className={`mobile-card-amount ${transaction.type === 'income' ? 'text-income' : 'text-expense'}`}>
                  ₹{transaction.amount.toFixed(2)}
                </div>
                <Badge className={transaction.type === 'income' ? 'badge-income' : 'badge-expense'}>
                  {transaction.type === 'income' ? 'Income' : 'Expense'}
                </Badge>
              </div>
            </div>
            
            {expandedId === transaction.id && (
              <div className="pt-2 mt-2 border-top">
                {transaction.description && (
                  <p className="text-muted small mb-2">{transaction.description}</p>
                )}
                <div className="d-flex justify-content-end">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => onEdit(transaction)}
                  >
                    <FaEdit /> Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <FaTrash /> Delete
                  </Button>
                </div>
              </div>
            )}
            
            <Button 
              variant="link" 
              className="p-0 mt-2 text-decoration-none" 
              onClick={() => toggleDetails(transaction.id)}
            >
              {expandedId === transaction.id ? (
                <small className="text-muted">Hide Details <FaChevronUp size={10} /></small>
              ) : (
                <small className="text-muted">Show Details <FaChevronDown size={10} /></small>
              )}
            </Button>
          </Card>
        ))}
      </div>
    );
  };

  // Table view for larger screens
  const renderDesktopTable = () => {
    return (
      <div className="d-none d-md-block table-responsive">
        <Table hover className="transaction-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Amount (₹)</th>
              <th>Description</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>{formatDate(transaction.date)}</td>
                <td>
                  <Badge className={transaction.type === 'income' ? 'badge-income' : 'badge-expense'}>
                    {transaction.type === 'income' ? 'Income' : 'Expense'}
                  </Badge>
                </td>
                <td>{transaction.category}</td>
                <td className={transaction.type === 'income' ? 'text-income' : 'text-expense'}>
                  ₹{transaction.amount.toFixed(2)}
                </td>
                <td>
                  {transaction.description ? 
                    (transaction.description.length > 30 ? 
                      `${transaction.description.slice(0, 30)}...` : 
                      transaction.description) : 
                    '-'}
                </td>
                <td className="text-end">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-1"
                    onClick={() => onEdit(transaction)}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => onDelete(transaction.id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Transactions</h5>
          <Badge bg="primary" pill>{transactions.length} items</Badge>
        </div>
      </Card.Header>
      <Card.Body className="p-0 p-md-3">
        {renderMobileCards()}
        {renderDesktopTable()}
      </Card.Body>
    </Card>
  );
};

export default TransactionList; 