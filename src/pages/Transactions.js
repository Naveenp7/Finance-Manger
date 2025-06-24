import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Alert, Modal, Button, Card } from 'react-bootstrap';
import TransactionList from '../components/TransactionList';
import TransactionForm from '../components/TransactionForm';
import TransactionFilter from '../components/TransactionFilter';
import VoiceInput from '../components/VoiceInput';
import OcrScanner from '../components/OcrScanner';
import { FaMicrophone, FaCamera, FaPlus } from 'react-icons/fa';
import { 
  fetchTransactions, 
  addTransaction, 
  updateTransaction, 
  deleteTransaction 
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const Transactions = () => {
  const { isOnline } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Load transactions with filters
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

  // Handle add/edit transaction
  const handleSubmitTransaction = async (formData) => {
    try {
      if (editingTransaction) {
        // Editing existing transaction
        if (!formData) {
          // Cancel editing
          setEditingTransaction(null);
          return;
        }
        
        await updateTransaction(editingTransaction.id, formData);
        setSuccessMessage('Transaction updated successfully!');
        setEditingTransaction(null);
      } else {
        // Adding new transaction
        await addTransaction(formData);
        setSuccessMessage('Transaction added successfully!');
      }
      
      // Reload the transactions
      loadTransactions();
    } catch (err) {
      setError('Error saving transaction. Please try again.');
      console.error(err);
    }
  };

  // Handle edit button click
  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
  };

  // Handle delete button click
  const handleDeleteClick = (id) => {
    setTransactionToDelete(id);
    setShowDeleteModal(true);
  };

  // Confirm and perform delete
  const confirmDelete = async () => {
    try {
      await deleteTransaction(transactionToDelete);
      setSuccessMessage('Transaction deleted successfully!');
      setShowDeleteModal(false);
      setTransactionToDelete(null);
      
      // Reload the transactions
      loadTransactions();
    } catch (err) {
      setError('Error deleting transaction. Please try again.');
      console.error(err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (filters) => {
    loadTransactions(filters);
  };

  // Handle voice input capture
  const handleVoiceCapture = async (transactionData) => {
    try {
      await addTransaction(transactionData);
      setSuccessMessage('Voice transaction added successfully!');
      loadTransactions();
    } catch (err) {
      setError('Error saving voice transaction. Please try again.');
      console.error(err);
    }
  };

  // Handle OCR capture
  const handleOcrCapture = async (transactionData) => {
    try {
      await addTransaction(transactionData);
      setSuccessMessage('Scanned transaction added successfully!');
      loadTransactions();
    } catch (err) {
      setError('Error saving scanned transaction. Please try again.');
      console.error(err);
    }
  };

  // Toggle transaction form
  const toggleTransactionForm = () => {
    setShowForm(!showForm);
    if (editingTransaction && !showForm) {
      setEditingTransaction(null);
    }
  };

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <Container fluid>
      <h2 className="section-header mt-3">Manage Transactions</h2>
      
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Row>
        <Col lg={4} md={12}>
          <Card className="mb-4 shadow-sm">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Add Transaction</h5>
                <div>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={toggleTransactionForm}
                    className="me-2"
                  >
                    <FaPlus /> {showForm ? "Hide Form" : "Show Form"}
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {showForm && (
                <TransactionForm 
                  onSubmit={handleSubmitTransaction}
                  initialData={editingTransaction}
                  isEditing={!!editingTransaction}
                />
              )}
              
              <div className="smart-input-options mt-3">
                <h6 className="text-muted mb-3">Quick Input Options:</h6>
                <div className="d-flex flex-wrap gap-2">
                  <VoiceInput 
                    onTransactionCapture={handleVoiceCapture} 
                    defaultType="expense"
                    disabled={!isOnline}
                  />
                  
                  <OcrScanner 
                    onTransactionCapture={handleOcrCapture}
                    defaultType="expense"
                    disabled={!isOnline}
                  />
                </div>
                
                {!isOnline && (
                  <Alert variant="warning" className="mt-3 mb-0">
                    <small>Voice and OCR features require an internet connection.</small>
                  </Alert>
                )}
              </div>
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">How to Use</h5>
            </Card.Header>
            <Card.Body>
              <h6><FaMicrophone className="me-2" />Voice Input</h6>
              <div className="small text-muted mb-3">
                Say amounts and categories naturally. Examples:
                <ul className="mb-0 ps-3">
                  <li>"Spent 500 rupees on raw materials today"</li>
                  <li>"Income of 2000 from sales yesterday"</li>
                  <li>"Paid 350 for electricity on 15/05"</li>
                </ul>
              </div>
              
              <h6><FaCamera className="me-2" />Receipt Scanner</h6>
              <div className="small text-muted mb-0">
                Use your camera to scan receipts and bills. The system will try to detect:
                <ul className="mb-0 ps-3">
                  <li>Total amount</li>
                  <li>Date of purchase</li>
                  <li>Vendor information</li>
                  <li>GST information (if available)</li>
                </ul>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8} md={12}>
          <TransactionFilter onFilterChange={handleFilterChange} />
          
          {isLoading ? (
            <div className="text-center p-5">Loading transactions...</div>
          ) : (
            <TransactionList
              transactions={transactions}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteClick}
            />
          )}
        </Col>
      </Row>
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this transaction? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Transactions;