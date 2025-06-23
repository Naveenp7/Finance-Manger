import React, { useState, useEffect, useCallback } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Button, Modal, Card, Spinner, Alert } from 'react-bootstrap';
import { FaMicrophone, FaMicrophoneSlash, FaCheck, FaTimes } from 'react-icons/fa';
import { isNative, startSpeechRecognition, stopSpeechRecognition, addSpeechRecognitionListener, removeSpeechRecognitionListeners } from '../services/capacitorBridge';
import aiAgentModal from './aiAgentModal';

// Regular expressions for parsing amount
const amountRegex = /(\d+(?:\.\d+)?)/g;

// Regular expressions for categories
const expenseCategoryRegexes = {
  'raw materials': /raw materials|raw material|rawmaterials|rawmaterial/i,
  'utilities': /utility|utilities|electric|electricity|water|power/i,
  'salaries': /salary|salaries|wage|wages|pay|payment to staff|staff payment/i,
  'maintenance': /maintenance|repair|repairs|fix|fixing/i,
  'transport': /transport|transportation|shipping|logistics|delivery/i,
  'office supplies': /office|supplies|stationery|paper|pen|ink/i,
  'marketing': /marketing|advertisement|promotion|ad|ads/i,
  'miscellaneous': /misc|miscellaneous|other|others/i
};

const incomeCategoryRegexes = {
  'sales': /sales|sold|sale|selling/i,
  'wholesale': /wholesale|bulk sale|distributor/i,
  'retail': /retail|shop sale|direct sale/i,
  'online': /online|internet|website|web/i,
  'other income': /other income|misc income|miscellaneous income/i
};

// Date regex - supports various formats
const dateRegex = /([0-9]{1,2})[\/\-]([0-9]{1,2})(?:[\/\-]([0-9]{2,4}))?/;
const todayRegex = /today|to-day/i;
const yesterdayRegex = /yesterday|yester-day/i;

const VoiceInput = ({ onTransactionCapture, defaultType, onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [interpretedTransaction, setInterpretedTransaction] = useState(null);
  const [error, setError] = useState(null);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [nativeTranscript, setNativeTranscript] = useState('');
  const [permissionStatus, setPermissionStatus] = useState(null);

  // Use web speech recognition if not running natively
  const {
    transcript: webTranscript,
    listening: webListening,
    resetTranscript: resetWebTranscript,
    browserSupportsSpeechRecognition
  } = useSpeechRecognition();

  // Get the appropriate transcript based on platform
  const transcript = isNative ? nativeTranscript : webTranscript;

  // Stop native speech recognition when component unmounts
  useEffect(() => {
    return () => {
      if (isNative && isListening) {
        stopNativeSpeechRecognition().catch(err =>
          console.error('Error stopping recognition on unmount:', err)
        );
      }
    };
  }, [isListening]);

  // Update listening status for web speech
  useEffect(() => {
    if (!isNative) {
      setIsListening(webListening);
    }
  }, [webListening]);

  // Callback for speech recognition results
  const handleNativeSpeechResult = useCallback((text) => {
    console.log('Received speech recognition result:', text);
    setNativeTranscript(text);
  }, []);

  // Start native speech recognition
  const startNativeSpeechRecognition = async () => {
    try {
      console.log('Starting native speech recognition');
      setIsListening(true);
      setNativeTranscript('');
      setError(null);

      // Setup listener for results
      addSpeechRecognitionListener(handleNativeSpeechResult);

      // Start listening
      await startSpeechRecognition('en-IN');
      console.log('Native speech recognition started successfully');
      setPermissionStatus('granted');
    } catch (err) {
      console.error('Error in startNativeSpeechRecognition:', err);
      setError(`Speech recognition error: ${err.message}`);
      setIsListening(false);

      if (err.message.includes('Permission denied')) {
        setPermissionStatus('denied');
      }
    }
  };

  // Stop native speech recognition
  const stopNativeSpeechRecognition = async () => {
    try {
      console.log('Stopping native speech recognition');
      if (isListening) {
        await stopSpeechRecognition();
        await removeSpeechRecognitionListeners();
        setIsListening(false);

        // Only interpret if we have a transcript
        if (nativeTranscript && nativeTranscript.trim().length > 0) {
          interpretVoiceInput();
        }
      }
    } catch (err) {
      console.error('Error stopping speech recognition:', err);
      setError(`Error stopping speech: ${err.message}`);
      setIsListening(false);
    }
  };

  // Check if voice input is supported
  const isVoiceSupported = isNative || browserSupportsSpeechRecognition;

  if (!isVoiceSupported) {
    return (
      <Button
        variant="outline-secondary"
        disabled
        className="voice-input-btn"
        title="Your device doesn't support speech recognition"
      >
        <FaMicrophoneSlash /> Voice Input Not Supported
      </Button>
    );
  }

  const handleListen = () => {
    console.log('handleListen called, isListening:', isListening);
    if (isNative) {
      if (!isListening) {
        startNativeSpeechRecognition();
      } else {
        stopNativeSpeechRecognition();
      }
    } else {
      if (!isListening) {
        resetWebTranscript();
        SpeechRecognition.startListening({ continuous: true, language: 'en-IN' });
      } else {
        SpeechRecognition.stopListening();
        interpretVoiceInput();
      }
    }
  };

  const interpretVoiceInput = () => {
    setProcessingVoice(true);
    setError(null);

    try {
      console.log('Interpreting voice input:', transcript);

      if (!transcript || transcript.trim().length === 0) {
        throw new Error("No speech detected. Please try again and speak clearly.");
      }

      // Default type
      let type = defaultType || 'expense';

      // Check if the transcript contains income-related words
      if (/income|received|earned|revenue|sales/i.test(transcript)) {
        type = 'income';
      }

      // Check if the transcript contains expense-related words
      if (/expense|spent|paid|payment|buy|bought|purchased/i.test(transcript)) {
        type = 'expense';
      }

      // Extract amount
      const amountMatches = transcript.match(amountRegex);
      const amount = amountMatches ? parseFloat(amountMatches[0]) : null;

      if (!amount) {
        throw new Error("Could not identify an amount in your voice input");
      }

      // Extract category
      let category = 'miscellaneous';
      const categoryRegexes = type === 'income' ? incomeCategoryRegexes : expenseCategoryRegexes;

      for (const [cat, regex] of Object.entries(categoryRegexes)) {
        if (regex.test(transcript)) {
          category = cat;
          break;
        }
      }

      // Extract date
      let date = new Date();

      if (todayRegex.test(transcript)) {
        // Already set to today
      } else if (yesterdayRegex.test(transcript)) {
        date.setDate(date.getDate() - 1);
      } else {
        const dateMatch = transcript.match(dateRegex);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]) - 1; // JS months are 0-indexed

          // If year is provided, use it, otherwise use current year
          const year = dateMatch[3]
            ? (dateMatch[3].length === 2 ? 2000 + parseInt(dateMatch[3]) : parseInt(dateMatch[3]))
            : date.getFullYear();

          date = new Date(year, month, day);
        }
      }

      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];

      // Extract description
      const descriptionMatch = transcript.match(/for\s+(.*?)(?:\s+on|\s+at|\s+in|\s+to|\s+from|\s+by|\s+with|\s+and|\s+$)/i);
      const description = descriptionMatch ? descriptionMatch[1] : category;

      // Create the interpreted transaction
      const transaction = {
        type,
        amount,
        category,
        date: formattedDate,
        description: description.charAt(0).toUpperCase() + description.slice(1)
      };

      console.log('Interpreted transaction:', transaction);
      setInterpretedTransaction(transaction);
      setShowModal(true);
    } catch (err) {
      console.error('Error interpreting voice input:', err);
      setError(err.message || "Couldn't interpret voice input properly");
      setInterpretedTransaction(null);
    } finally {
      setProcessingVoice(false);
    }
  };

  const handleConfirm = () => {
    if (interpretedTransaction) {
      onTransactionCapture(interpretedTransaction);
      if (!isNative) {
        resetWebTranscript();
      } else {
        setNativeTranscript('');
      }
      setInterpretedTransaction(null);
      setShowModal(false);
    }
  };

  const handleCancel = () => {
    if (!isNative) {
      resetWebTranscript();
    } else {
      setNativeTranscript('');
    }
    setInterpretedTransaction(null);
    setShowModal(false);
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported');
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.start();
  };

  return (
    <>
      <Button
        variant={isListening ? "danger" : "outline-primary"}
        onClick={handleListen}
        className="voice-input-btn"
      >
        {isListening ? <FaMicrophoneSlash /> : <FaMicrophone />} {isListening ? "Stop Listening" : "Voice Input"}
      </Button>

      {processingVoice && (
        <Modal show centered backdrop="static">
          <Modal.Body className="text-center p-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Processing your voice input...</p>
          </Modal.Body>
        </Modal>
      )}

      {permissionStatus === 'denied' && isNative && (
        <Modal show onHide={() => setPermissionStatus(null)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Permission Required</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="warning">
              <p>Microphone permission is required for voice input.</p>
              <p>Please go to your device settings and enable microphone permission for this app.</p>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setPermissionStatus(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}

      <Modal show={showModal} onHide={handleCancel} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Transaction</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error ? (
            <Alert variant="danger">
              {error}
              <hr />
              <p className="mb-0">Speech transcript: "{transcript}"</p>
            </Alert>
          ) : (
            interpretedTransaction && (
              <Card>
                <Card.Body>
                  <Card.Title>{interpretedTransaction.type === 'income' ? 'Income' : 'Expense'}</Card.Title>
                  <Card.Text as="div">
                    <p><strong>Amount:</strong> ₹{interpretedTransaction.amount}</p>
                    <p><strong>Category:</strong> {interpretedTransaction.category}</p>
                    <p><strong>Description:</strong> {interpretedTransaction.description}</p>
                    <p><strong>Date:</strong> {interpretedTransaction.date}</p>
                  </Card.Text>
                </Card.Body>
              </Card>
            )
          )}
          <div className="mt-3">
            <p className="text-muted small">I heard: "{transcript}"</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            <FaTimes /> Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={!interpretedTransaction}
          >
            <FaCheck /> Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default VoiceInput;