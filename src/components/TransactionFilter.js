import React, { useState, useEffect, useCallback } from 'react';
import { Form, Row, Col, Button, Collapse } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { FaFilter, FaCalendarAlt, FaTags, FaAngleDown, FaAngleUp } from 'react-icons/fa';

const TransactionFilter = ({ onFilterChange, minimal = false, showResetButton = true }) => {
  const [filters, setFilters] = useState({
    type: 'all',
    category: '',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    end_date: new Date()
  });
  
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date, field) => {
    setFilters(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleApplyFilters = useCallback(() => {
    const formattedFilters = {
      ...filters,
      start_date: filters.start_date.toISOString().split('T')[0],
      end_date: filters.end_date.toISOString().split('T')[0],
    };
    
    // If "all" is selected, don't include type in filters
    if (formattedFilters.type === 'all') {
      delete formattedFilters.type;
    }
    
    // Only include category if it's not empty
    if (!formattedFilters.category) {
      delete formattedFilters.category;
    }
    
    onFilterChange(formattedFilters);
    
    // On mobile, collapse the filter section after applying
    if (window.innerWidth < 768) {
      setShowFilters(false);
    }
  }, [filters, onFilterChange]);

  useEffect(() => {
    handleApplyFilters();
  }, [handleApplyFilters]);

  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      category: '',
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end_date: new Date()
    });
    
    // Apply the reset filters
    onFilterChange({
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    });
  };
  
  // Format date for display
  const formatDateForDisplay = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="transaction-filters mb-4">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="d-flex align-items-center">
          <FaFilter className="me-2 text-primary" />
          <h6 className="mb-0">Filter Transactions</h6>
        </div>
        
        <Button 
          variant="link" 
          className="p-0 text-decoration-none text-primary" 
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          aria-controls="filter-collapse"
        >
          {showFilters ? (
            <>Hide Filters <FaAngleUp className="ms-1" /></>
          ) : (
            <>Show Filters <FaAngleDown className="ms-1" /></>
          )}
        </Button>
      </div>
      
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="small text-muted">
          <FaCalendarAlt className="me-1" />
          {formatDateForDisplay(filters.start_date)} - {formatDateForDisplay(filters.end_date)}
        </div>
        
        {filters.type !== 'all' && (
          <div className="small">
            <span className={`badge ${filters.type === 'income' ? 'badge-income' : 'badge-expense'}`}>
              {filters.type === 'income' ? 'Income' : 'Expense'}
            </span>
          </div>
        )}
        
        {filters.category && (
          <div className="small">
            <FaTags className="me-1" />
            {filters.category}
          </div>
        )}
      </div>
      
      <Collapse in={showFilters}>
        <div id="filter-collapse">
          <Row className="g-3 mb-3">
            <Col sm={6} lg={3}>
              <Form.Group>
                <Form.Label className="small">Transaction Type</Form.Label>
                <Form.Select
                  name="type"
                  value={filters.type}
                  onChange={handleChange}
                  className="form-select-sm"
                >
                  <option value="all">All Transactions</option>
                  <option value="income">Income Only</option>
                  <option value="expense">Expenses Only</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col sm={6} lg={3}>
              <Form.Group>
                <Form.Label className="small">Category</Form.Label>
                <Form.Control
                  type="text"
                  name="category"
                  value={filters.category}
                  onChange={handleChange}
                  placeholder="Filter by category"
                  className="form-control-sm"
                />
              </Form.Group>
            </Col>
            
            <Col sm={6} lg={3}>
              <Form.Group>
                <Form.Label className="small">Start Date</Form.Label>
                <DatePicker
                  selected={filters.start_date}
                  onChange={(date) => handleDateChange(date, 'start_date')}
                  selectsStart
                  startDate={filters.start_date}
                  endDate={filters.end_date}
                  className="form-control form-control-sm"
                  dateFormat="MMM d, yyyy"
                  popperPlacement="bottom-start"
                />
              </Form.Group>
            </Col>
            
            <Col sm={6} lg={3}>
              <Form.Group>
                <Form.Label className="small">End Date</Form.Label>
                <DatePicker
                  selected={filters.end_date}
                  onChange={(date) => handleDateChange(date, 'end_date')}
                  selectsEnd
                  startDate={filters.start_date}
                  endDate={filters.end_date}
                  minDate={filters.start_date}
                  className="form-control form-control-sm"
                  dateFormat="MMM d, yyyy"
                  popperPlacement="bottom-start"
                />
              </Form.Group>
            </Col>
          </Row>
          
          <div className="d-flex">
            <Button 
              variant="primary" 
              size="sm"
              onClick={handleApplyFilters}
              className="me-2"
            >
              Apply Filters
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm"
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </div>
        </div>
      </Collapse>
    </div>
  );
};

export default TransactionFilter;