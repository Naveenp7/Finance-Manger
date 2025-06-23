import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import TransactionFilter from '../components/TransactionFilter';
import { exportToExcel } from '../services/api';
import { saveAs } from 'file-saver';
import { FaFileExcel, FaFilePdf, FaChartLine } from 'react-icons/fa';
import { isNative, saveExcelFile } from '../services/capacitorBridge';

const Reports = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [reportType, setReportType] = useState('transactions');
  const [currentFilters, setCurrentFilters] = useState({});

  // Handle filter changes
  const handleFilterChange = (filters) => {
    setCurrentFilters(filters);
  };

  // Generate Excel Report
  const handleExcelExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const blob = await exportToExcel();
      
      if (isNative) {
        // Use Capacitor for file saving on Android
        await saveExcelFile(blob, 'panekkatt_finance.xlsx');
        setSuccess('Excel report saved to your Documents folder');
      } else {
        // Use FileSaver in browser
        saveAs(blob, 'panekkatt_finance.xlsx');
        setSuccess('Excel report generated successfully!');
      }
    } catch (err) {
      setError('Error generating Excel report: ' + err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Export to PDF (placeholder - to be implemented in Phase 2)
  const handlePDFExport = () => {
    setError('PDF export will be available in the next update.');
  };

  // Clear messages after 3 seconds
  React.useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <Container>
      <h2 className="my-4">Reports & Exports</h2>
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      <Row className="g-4">
        <Col lg={4} md={12}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Generate Reports</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Report Type</Form.Label>
                  <Form.Select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="transactions">All Transactions</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expenses Only</option>
                    <option value="summary">Monthly Summary</option>
                    <option value="categories">Category Analysis</option>
                  </Form.Select>
                </Form.Group>
                
                <TransactionFilter 
                  onFilterChange={handleFilterChange} 
                  minimal={true}
                  showResetButton={false}
                />
                
                <div className="mt-3">
                  <Button 
                    variant="success" 
                    className="me-2 mb-2"
                    onClick={handleExcelExport}
                    disabled={isLoading}
                  >
                    <FaFileExcel className="me-1" /> Export to Excel
                  </Button>
                  
                  <Button 
                    variant="danger"
                    className="mb-2"
                    onClick={handlePDFExport}
                    disabled={isLoading}
                  >
                    <FaFilePdf className="me-1" /> Export to PDF
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8} md={12}>
          <Card>
            <Card.Header>Report Preview</Card.Header>
            <Card.Body className="p-4">
              <div className="text-center">
                <FaChartLine size={50} className="text-muted mb-3" />
                <h4>Your Report Will Appear Here</h4>
                <p className="text-muted">
                  Select report type and date range, then click Export to generate your report.
                </p>
                <p className="text-muted">
                  In Phase 2, AI-powered insights and forecasting will be available here!
                </p>
              </div>
              
              {/* Future: Report Preview Content */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Reports; 