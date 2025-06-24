import React, { useState, useEffect, useRef } from 'react';
import { Modal, Form, Button, Spinner, Tab, Tabs, Card, ListGroup, Badge } from 'react-bootstrap';
import { FaRobot, FaMicrophone, FaMicrophoneSlash, FaChartLine, FaExclamationTriangle, FaCalendarAlt, FaPaperPlane, FaTimes } from 'react-icons/fa';
import { aiAgent } from '../services/ai/aiAgentService';
import { useAuth } from '../context/AuthContext';
import VoiceInput from './VoiceInput';
import '../styles/ai-agent-modal.css';

const AIAgentModal = ({ show, onHide }) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [insights, setInsights] = useState([]);
  const [anomalies, setAnomalies] = useState('');
  const [forecast, setForecast] = useState('');
  const [summary, setSummary] = useState('');
  const { currentUser } = useAuth();
  const chatEndRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (show && currentUser && !initialized) {
      initializeAgent();
    }
  }, [show, currentUser, initialized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeAgent = async () => {
    setLoading(true);
    try {
      const success = await aiAgent.initializeAgent(currentUser.uid);
      if (success) {
        setInitialized(true);
        setMessages([{
          from: 'ai',
          text: "Hello! I'm your AI financial assistant. I've analyzed your transaction data and I'm ready to help you with insights, forecasts, and answer any questions about your finances.",
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to initialize AI agent:', error);
      setMessages([{
        from: 'ai',
        text: "Sorry, I couldn't access your financial data right now. Please try again later.",
        timestamp: new Date()
      }]);
    }
    setLoading(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      from: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    
    try {
      const response = await aiAgent.processQuery(input);
      const aiMessage = {
        from: 'ai',
        text: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        from: 'ai',
        text: "I apologize, but I encountered an error processing your request. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setInput('');
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await aiAgent.generateInsights();
      setInsights(response.split('\n').filter(line => line.trim()));
    } catch (error) {
      setInsights(['Unable to generate insights at this time.']);
    }
    setLoading(false);
  };

  const loadAnomalies = async () => {
    setLoading(true);
    try {
      const response = await aiAgent.detectAnomalies();
      setAnomalies(response);
    } catch (error) {
      setAnomalies('Unable to detect anomalies at this time.');
    }
    setLoading(false);
  };

  const loadForecast = async () => {
    setLoading(true);
    try {
      const response = await aiAgent.forecastExpenses();
      setForecast(response);
    } catch (error) {
      setForecast('Unable to generate forecast at this time.');
    }
    setLoading(false);
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await aiAgent.getSummary();
      setSummary(response);
    } catch (error) {
      setSummary('Unable to generate summary at this time.');
    }
    setLoading(false);
  };

  const handleVoiceResult = (transcript) => {
    setInput(transcript);
  };

  const QuickActionButton = ({ text, onClick }) => (
    <Button 
      variant="outline-primary" 
      className="quick-action-btn" 
      onClick={onClick}
    >
      {text}
    </Button>
  );

  const renderQuickActions = () => (
    <div className="quick-actions">
      <QuickActionButton 
        text="💰 Monthly Spending Analysis" 
        onClick={() => setInput("Analyze my monthly spending patterns")}
      />
      <QuickActionButton 
        text="📊 Budget Status" 
        onClick={() => setInput("How am I doing with my budget?")}
      />
      <QuickActionButton 
        text="🎯 Saving Tips" 
        onClick={() => setInput("Give me personalized saving tips")}
      />
      <QuickActionButton 
        text="📈 Expense Forecast" 
        onClick={() => setInput("Forecast my expenses for next month")}
      />
    </div>
  );

  const renderChatBubble = (message, index) => (
    <div key={index} className={`chat-bubble ${message.from}`}>
      {message.text}
    </div>
  );

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      aria-labelledby="ai-assistant-modal"
      centered
      className="ai-assistant-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title id="ai-assistant-modal">
          <FaRobot className="me-2" />
          AI Financial Assistant
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-0">
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-3 px-3 pt-2"
        >
          <Tab eventKey="chat" title="Chat">
            <div className="ai-assistant-container">
              {!initialized && !loading && renderQuickActions()}
              
              <div className="chat-window">
                {messages.map((msg, index) => renderChatBubble(msg, index))}
                {loading && (
                  <div className="loading-indicator">
                    <Spinner animation="border" variant="primary" size="sm" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              <div className="chat-input-row">
                <Form.Control
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your finances..."
                  disabled={loading}
                />
                
                <VoiceInput
                  className="voice-input-btn"
                  isListening={isListening}
                  onStart={() => setIsListening(true)}
                  onEnd={() => setIsListening(false)}
                  onResult={(text) => setInput(text)}
                  disabled={loading}
                />
                
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || loading}
                >
                  <FaPaperPlane />
                </Button>
              </div>
            </div>
          </Tab>

          <Tab eventKey="insights" title="Insights">
            <div className="tab-content-container">
              <Card>
                <Card.Header>
                  <Card.Title className="mb-0">AI Financial Insights</Card.Title>
                </Card.Header>
                <Card.Body>
                  {!insights.length ? (
                    <Button onClick={loadInsights} disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : 'Generate Insights'}
                    </Button>
                  ) : (
                    <ListGroup variant="flush">
                      {insights.map((insight, index) => (
                        <ListGroup.Item key={index} className="border-0 px-0">
                          {insight}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Tab>
          
          <Tab eventKey="anomalies" title={<><FaExclamationTriangle className="me-1" /> Anomalies</>}>
            <div className="tab-content-container">
              <Card>
                <Card.Header>
                  <Card.Title className="mb-0">Spending Anomalies</Card.Title>
                </Card.Header>
                <Card.Body>
                  {!anomalies ? (
                    <Button onClick={loadAnomalies} disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : 'Detect Anomalies'}
                    </Button>
                  ) : (
                    <div className="anomaly-content">
                      {anomalies}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Tab>
          
          <Tab eventKey="forecast" title={<><FaCalendarAlt className="me-1" /> Forecast</>}>
            <div className="tab-content-container">
              <Card>
                <Card.Header>
                  <Card.Title className="mb-0">Expense Forecast</Card.Title>
                </Card.Header>
                <Card.Body>
                  {!forecast ? (
                    <Button onClick={loadForecast} disabled={loading}>
                      {loading ? <Spinner animation="border" size="sm" /> : 'Generate Forecast'}
                    </Button>
                  ) : (
                    <div className="forecast-content">
                      {forecast}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
    </Modal>
  );
};

export default AIAgentModal;
