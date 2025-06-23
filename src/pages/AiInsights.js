import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Tab, Tabs } from 'react-bootstrap';
import { FaChartLine, FaExclamationTriangle, FaCalendarAlt, FaRobot, FaDownload } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate, formatDateRange } from '../utils/formatters';
import { predictTransactions, detectAnomalies, recommendStockPurchaseDays } from '../services/ai/predictionService';
import { generateWeeklySummary } from '../services/ai/reportService';
import { createBackup } from '../services/backupService';
import '../styles/AIStyles.css';

const AiInsights = () => {
  const { currentUser, isOnline, aiFeatureEnabled } = useAuth();
  const [incomePredictions, setIncomePredictions] = useState([]);
  const [expensePredictions, setExpensePredictions] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState({});
  const [activeTab, setActiveTab] = useState('predictions');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading((prev) => ({ ...prev, predictions: true }));
        const incomeData = await predictTransactions(currentUser.uid, 'income');
        setIncomePredictions(incomeData);

        const expenseData = await predictTransactions(currentUser.uid, 'expenses');
        setExpensePredictions(expenseData);

        setLoading((prev) => ({ ...prev, predictions: false }));
      } catch (err) {
        setError((prev) => ({ ...prev, predictions: err.message }));
        setLoading((prev) => ({ ...prev, predictions: false }));
      }
    };

    if (aiFeatureEnabled) {
      fetchData();
    }
  }, [currentUser.uid, aiFeatureEnabled]);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        setLoading((prev) => ({ ...prev, anomalies: true }));
        const data = await detectAnomalies(currentUser.uid);
        setAnomalies(data);
        setLoading((prev) => ({ ...prev, anomalies: false }));
      } catch (err) {
        setError((prev) => ({ ...prev, anomalies: err.message }));
        setLoading((prev) => ({ ...prev, anomalies: false }));
      }
    };

    const fetchRecommendations = async () => {
      try {
        setLoading((prev) => ({ ...prev, recommendations: true }));
        const data = await recommendStockPurchaseDays(currentUser.uid);
        setRecommendations(data);
        setLoading((prev) => ({ ...prev, recommendations: false }));
      } catch (err) {
        setError((prev) => ({ ...prev, recommendations: err.message }));
        setLoading((prev) => ({ ...prev, recommendations: false }));
      }
    };

    const fetchWeeklySummary = async () => {
      try {
        setLoading((prev) => ({ ...prev, summary: true }));
        const data = await generateWeeklySummary(currentUser.uid);
        setWeeklySummary(data);
        setLoading((prev) => ({ ...prev, summary: false }));
      } catch (err) {
        setError((prev) => ({ ...prev, summary: err.message }));
        setLoading((prev) => ({ ...prev, summary: false }));
      }
    };

    if (aiFeatureEnabled) {
      fetchAnomalies();
      fetchRecommendations();
      fetchWeeklySummary();
    }
  }, [currentUser.uid, aiFeatureEnabled]);

  const handleTabSelect = (key) => {
    setActiveTab(key);
  };

  const renderPredictions = () => (
    <Row>
      <Col>
        <Card>
          <Card.Body>
            <Card.Title>Income Predictions</Card.Title>
            {loading.predictions ? (
              <Spinner animation="border" />
            ) : error.predictions ? (
              <Alert variant="danger">{error.predictions}</Alert>
            ) : (
              <ul>
                {incomePredictions.map((prediction, index) => (
                  <li key={index}>{formatCurrency(prediction.amount)} on {formatDate(prediction.date)}</li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </Col>
      <Col>
        <Card>
          <Card.Body>
            <Card.Title>Expense Predictions</Card.Title>
            {loading.predictions ? (
              <Spinner animation="border" />
            ) : error.predictions ? (
              <Alert variant="danger">{error.predictions}</Alert>
            ) : (
              <ul>
                {expensePredictions.map((prediction, index) => (
                  <li key={index}>{formatCurrency(prediction.amount)} on {formatDate(prediction.date)}</li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderAnomalies = () => (
    <Row>
      <Col>
        <Card>
          <Card.Body>
            <Card.Title>Detected Anomalies</Card.Title>
            {loading.anomalies ? (
              <Spinner animation="border" />
            ) : error.anomalies ? (
              <Alert variant="danger">{error.anomalies}</Alert>
            ) : (
              <ul>
                {anomalies.map((anomaly, index) => (
                  <li key={index}>{anomaly.description} on {formatDate(anomaly.date)}</li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderRecommendations = () => (
    <Row>
      <Col>
        <Card>
          <Card.Body>
            <Card.Title>Stock Purchase Recommendations</Card.Title>
            {loading.recommendations ? (
              <Spinner animation="border" />
            ) : error.recommendations ? (
              <Alert variant="danger">{error.recommendations}</Alert>
            ) : (
              <ul>
                {recommendations.map((rec, index) => (
                  <li key={index}>{rec.stock} - {rec.reason}</li>
                ))}
              </ul>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  const renderWeeklySummary = () => (
    <Row>
      <Col>
        <Card>
          <Card.Body>
            <Card.Title>Weekly Financial Summary</Card.Title>
            {loading.summary ? (
              <Spinner animation="border" />
            ) : error.summary ? (
              <Alert variant="danger">{error.summary}</Alert>
            ) : (
              <div>
                <p>Total Income: {formatCurrency(weeklySummary.totalIncome)}</p>
                <p>Total Expenses: {formatCurrency(weeklySummary.totalExpenses)}</p>
                <p>Net Savings: {formatCurrency(weeklySummary.netSavings)}</p>
                <Button variant="primary" onClick={() => createBackup(currentUser.uid)}>
                  <FaDownload /> Backup Data
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );

  return (
    <Container>
      <h2><FaRobot /> AI Insights & Predictions</h2>
      <Tabs activeKey={activeTab} onSelect={handleTabSelect}>
        <Tab eventKey="predictions" title="Predictions">
          {renderPredictions()}
        </Tab>
        <Tab eventKey="anomalies" title="Anomalies">
          {renderAnomalies()}
        </Tab>
        <Tab eventKey="recommendations" title="Recommendations">
          {renderRecommendations()}
        </Tab>
        <Tab eventKey="summary" title="Weekly Summary">
          {renderWeeklySummary()}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AiInsights;