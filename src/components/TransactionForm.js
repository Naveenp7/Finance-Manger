import React, { useState, useEffect } from 'react';
import { Form, Button, Card } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaCalendarAlt, FaRupeeSign, FaTags, FaEdit } from 'react-icons/fa';

const COMMON_CATEGORIES = {
  income: ['Oil Sales', 'Flour Mill Service', 'Other Income', 'Sales'],
  expense: ['Raw Materials', 'Wages', 'Transport', 'Packaging', 'Utilities', 'Maintenance', 'Other Expense']
};

const TransactionForm = ({ 
  onSubmit, 
  initialData = null, 
  isEditing = false 
}) => {
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    category: '',
    date: new Date(),
    description: ''
  });

  // If editing, populate form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        date: new Date(initialData.date)
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format date to YYYY-MM-DD for API
    const formattedData = {
      ...formData,
      date: formData.date.toISOString().split('T')[0],
      amount: parseFloat(formData.amount)
    };
    
    onSubmit(formattedData);
    
    // Only reset if not editing
    if (!isEditing) {
      setFormData({
        type: 'income',
        amount: '',
        category: '',
        date: new Date(),
        description: ''
      });
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header>
        <div className="d-flex align-items-center">
          {isEditing ? <FaEdit className="me-2" /> : <FaRupeeSign className="me-2" />}
          <div>{isEditing ? 'Edit Transaction' : 'Add Transaction'}</div>
        </div>
      </Card.Header>
      
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          {/* Transaction Type Toggle */}
          <div className="form-group mb-4">
            <div className="d-flex mb-2">
              <button
                type="button"
                className={`btn flex-grow-1 py-2 me-2 ${formData.type === 'income' 
                  ? 'btn-success' 
                  : 'btn-outline-secondary text-muted'}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'income' }))}
              >
                Income
              </button>
              <button
                type="button"
                className={`btn flex-grow-1 py-2 ${formData.type === 'expense' 
                  ? 'btn-danger' 
                  : 'btn-outline-secondary text-muted'}`}
                onClick={() => setFormData(prev => ({ ...prev, type: 'expense' }))}
              >
                Expense
              </button>
            </div>
          </div>

          {/* Amount with currency icon */}
          <Form.Group className="mb-3 position-relative">
            <Form.Label>Amount</Form.Label>
            <div className="input-group">
              <span className="input-group-text">
                <FaRupeeSign />
              </span>
              <Form.Control
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                required
                className="form-control-lg"
              />
            </div>
          </Form.Group>

          {/* Category dropdown */}
          <Form.Group className="mb-3">
            <Form.Label className="d-flex align-items-center">
              <FaTags className="me-2" /> Category
            </Form.Label>
            <Form.Select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="form-select-lg"
            >
              <option value="">Select a category</option>
              {COMMON_CATEGORIES[formData.type].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="custom">Custom Category...</option>
            </Form.Select>
          </Form.Group>

          {/* Custom category field */}
          {formData.category === 'custom' && (
            <Form.Group className="mb-3">
              <Form.Label>Custom Category</Form.Label>
              <Form.Control
                type="text"
                name="category"
                value={formData.category === 'custom' ? '' : formData.category}
                onChange={handleChange}
                placeholder="Enter custom category"
                required
                className="form-control-lg"
              />
            </Form.Group>
          )}

          {/* Date Picker */}
          <Form.Group className="mb-3">
            <Form.Label className="d-flex align-items-center">
              <FaCalendarAlt className="me-2" /> Date
            </Form.Label>
            <DatePicker
              selected={formData.date}
              onChange={handleDateChange}
              className="form-control form-control-lg"
              dateFormat="dd/MM/yyyy"
              required
              customInput={
                <div className="position-relative">
                  <Form.Control
                    type="text"
                    readOnly
                    value={formData.date.toLocaleDateString()}
                    className="form-control-lg"
                  />
                </div>
              }
            />
          </Form.Group>

          {/* Description */}
          <Form.Group className="mb-4">
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add notes about this transaction"
              className="form-control-lg"
            />
          </Form.Group>

          {/* Submit/Cancel buttons */}
          <div className="d-grid gap-2">
            <Button 
              variant={isEditing ? "primary" : formData.type === 'income' ? "success" : "danger"}
              type="submit"
              size="lg"
              className="py-3"
            >
              {isEditing ? 'Update' : 'Save'} Transaction
            </Button>
            
            {isEditing && (
              <Button 
                variant="outline-secondary" 
                onClick={() => onSubmit(null)}
                size="lg"
              >
                Cancel
              </Button>
            )}
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default TransactionForm; 