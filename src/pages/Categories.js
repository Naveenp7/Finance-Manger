import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, ListGroup, Badge, Modal, Alert } from 'react-bootstrap';
import { fetchCategories, addCategory, updateCategory, deleteCategory } from '../services/api';
import { FaPlus, FaPencilAlt, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Categories = () => {
  const { isOnline } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeType, setActiveType] = useState('income');
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'income',
    icon: '💰'
  });

  // Default icons for selection
  const iconOptions = [
    '💰', '💵', '💸', '💳', '🏦', '🏢', '🏠', '🚗', '🍔', '🛍️', '🎓', 
    '📚', '⚕️', '✈️', '🎭', '🎬', '🏥', '📱', '💻', '👕', '🛒', '🏭',
    '📝', '🔧', '🚿', '💡', '📺', '📈', '📉', '✨'
  ];

  // Fetch categories
  useEffect(() => {
    loadCategories();
  }, [activeType]);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await fetchCategories(activeType);
      setCategories(data);
    } catch (err) {
      setError('Failed to load categories. ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle icon selection
  const handleIconSelect = (icon) => {
    setFormData((prev) => ({
      ...prev,
      icon
    }));
  };

  // Open modal to add new category
  const handleAddNew = () => {
    setEditMode(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      type: activeType,
      icon: '💰'
    });
    setShowModal(true);
  };

  // Open modal to edit a category
  const handleEdit = (category) => {
    setEditMode(true);
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || '💰'
    });
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    
    if (!formData.name) {
      setError('Category name is required');
      return;
    }
    
    try {
      if (editMode && selectedCategory) {
        // Update existing category
        await updateCategory(selectedCategory.id, formData);
        setSuccess(`Category "${formData.name}" updated successfully`);
      } else {
        // Add new category
        await addCategory(formData);
        setSuccess(`Category "${formData.name}" created successfully`);
      }
      
      // Close modal and refresh list
      setShowModal(false);
      loadCategories();
    } catch (err) {
      setError('Failed to save category. ' + err.message);
      console.error(err);
    }
  };

  // Handle category deletion
  const handleDelete = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return;
    }
    
    setError('');
    
    try {
      await deleteCategory(category.id);
      setSuccess(`Category "${category.name}" deleted successfully`);
      loadCategories();
    } catch (err) {
      setError('Failed to delete category. ' + err.message);
      console.error(err);
    }
  };

  return (
    <Container className="my-4">
      <Row>
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">Categories</h4>
              <div>
                <Button
                  variant={activeType === 'income' ? 'primary' : 'outline-primary'}
                  className="me-2"
                  onClick={() => setActiveType('income')}
                >
                  Income
                </Button>
                <Button
                  variant={activeType === 'expense' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveType('expense')}
                >
                  Expense
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              
              {!isOnline && (
                <Alert variant="warning">
                  You are currently offline. Category management is limited in offline mode.
                </Alert>
              )}
              
              <div className="d-flex justify-content-end mb-3">
                <Button 
                  variant="primary" 
                  onClick={handleAddNew}
                  disabled={!isOnline}
                >
                  <FaPlus className="me-1" /> Add Category
                </Button>
              </div>
              
              <ListGroup>
                {loading ? (
                  <p className="text-center my-3">Loading categories...</p>
                ) : categories.length === 0 ? (
                  <p className="text-center my-3">No {activeType} categories found</p>
                ) : (
                  categories.map(category => (
                    <ListGroup.Item 
                      key={category.id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div className="d-flex align-items-center">
                        <span className="me-3 fs-4">{category.icon || '💰'}</span>
                        <span>{category.name}</span>
                      </div>
                      <div>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleEdit(category)}
                          disabled={!isOnline}
                        >
                          <FaPencilAlt />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleDelete(category)}
                          disabled={!isOnline}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Category Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {editMode ? 'Edit Category' : 'Add New Category'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Category Name</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter category name"
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select 
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Icon</Form.Label>
              <div className="p-2 border rounded">
                <div className="mb-2 d-flex align-items-center">
                  <span className="fs-4 me-2">{formData.icon}</span>
                  <span>Selected Icon</span>
                </div>
                <div className="d-flex flex-wrap">
                  {iconOptions.map((icon, index) => (
                    <div 
                      key={index} 
                      className={`icon-option p-2 border rounded m-1 cursor-pointer ${formData.icon === icon ? 'bg-light' : ''}`}
                      onClick={() => handleIconSelect(icon)}
                    >
                      <span className="fs-4">{icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            <FaTimes className="me-1" /> Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            <FaSave className="me-1" /> {editMode ? 'Update' : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Categories; 