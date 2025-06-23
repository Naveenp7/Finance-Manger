import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import speechRecognitionService from '../services/speechRecognitionService';

/**
 * Speech recognition button component
 * @param {Object} props - Component props
 * @param {Function} props.onSpeechResult - Callback function called with speech recognition results
 * @param {string} props.language - Language code for speech recognition (default: 'en-US')
 * @param {string} props.buttonText - Text to display on the button (optional)
 * @param {string} props.variant - Button variant (default: 'primary')
 * @param {string} props.size - Button size (default: 'md')
 */
const SpeechRecognitionButton = ({ 
  onSpeechResult, 
  language = 'en-US',
  buttonText = '',
  variant = 'primary',
  size = 'md'
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Initialize speech recognition
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await speechRecognitionService.checkAvailability();
      setIsAvailable(available);
    };
    
    // Set callbacks
    speechRecognitionService.setCallbacks({
      onStart: () => setIsListening(true),
      onStop: () => setIsListening(false),
      onResult: (results) => {
        if (onSpeechResult && results && results.length > 0) {
          onSpeechResult(results[0]);
        }
      },
      onError: (error) => {
        console.error('Speech recognition error:', error);
        setErrorMessage(error);
        setIsListening(false);
      }
    });
    
    checkAvailability();
    
    return () => {
      // Clean up on unmount
      if (isListening) {
        speechRecognitionService.stop();
      }
    };
  }, [onSpeechResult]);

  // Toggle speech recognition
  const toggleListening = async () => {
    try {
      if (isListening) {
        await speechRecognitionService.stop();
      } else {
        setErrorMessage('');
        await speechRecognitionService.start(language);
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
      setErrorMessage(error.message || 'Error with speech recognition');
      setIsListening(false);
    }
  };

  if (!isAvailable) {
    return (
      <Button 
        variant="secondary" 
        size={size} 
        disabled 
        title="Speech recognition not available on this device"
      >
        <FaMicrophoneSlash /> {buttonText || 'Voice Input Not Available'}
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={isListening ? 'danger' : variant}
        size={size}
        onClick={toggleListening}
        className={isListening ? 'pulse-animation' : ''}
        title={isListening ? 'Tap to stop listening' : 'Tap to start voice input'}
      >
        {isListening ? <FaMicrophone /> : <FaMicrophone />} {buttonText}
      </Button>
      
      {errorMessage && (
        <div className="text-danger mt-1 small">
          {errorMessage}
        </div>
      )}
    </>
  );
};

export default SpeechRecognitionButton; 