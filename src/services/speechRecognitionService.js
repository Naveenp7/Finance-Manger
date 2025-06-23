import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

/**
 * Service for handling speech recognition across web and mobile platforms
 * Uses Capacitor's Speech Recognition plugin on mobile
 */
class SpeechRecognitionService {
  constructor() {
    this.isAvailable = false;
    this.isListening = false;
    this.hasPermission = false;
    this.onStartCallback = null;
    this.onStopCallback = null;
    this.onResultCallback = null;
    this.onErrorCallback = null;
    
    // Check availability on initialization
    this.checkAvailability();
  }
  
  /**
   * Check if speech recognition is available on this device
   * @returns {Promise<boolean>} Whether speech recognition is available
   */
  async checkAvailability() {
    try {
      if (Capacitor.isNativePlatform()) {
        // On native platforms (Android/iOS), use Capacitor plugin
        const { available } = await SpeechRecognition.available();
        this.isAvailable = available;
        console.log(`Speech recognition availability on native: ${available}`);
        return available;
      } else {
        // On web, check browser support
        const webSpeechAvailable = 'webkitSpeechRecognition' in window || 
                                  'SpeechRecognition' in window;
        this.isAvailable = webSpeechAvailable;
        console.log(`Speech recognition availability on web: ${webSpeechAvailable}`);
        return webSpeechAvailable;
      }
    } catch (error) {
      console.error('Error checking speech recognition availability:', error);
      this.isAvailable = false;
      return false;
    }
  }
  
  /**
   * Request permission to use speech recognition
   * @returns {Promise<boolean>} Whether permission was granted
   */
  async requestPermission() {
    try {
      if (!this.isAvailable) {
        const available = await this.checkAvailability();
        if (!available) {
          console.warn('Speech recognition not available on this device');
          return false;
        }
      }
      
      if (Capacitor.isNativePlatform()) {
        // On native platforms, request permission through the plugin
        console.log('Requesting speech recognition permission on native platform');
        const { allowed } = await SpeechRecognition.requestPermission();
        this.hasPermission = allowed;
        return allowed;
      } else {
        // On web, permission is requested when starting recognition
        this.hasPermission = true;
        return true;
      }
    } catch (error) {
      console.error('Error requesting speech recognition permission:', error);
      if (error.message?.includes('not implemented') && Capacitor.getPlatform() === 'android') {
        // If we get "not implemented" on Android, it's likely a configuration issue
        // Let's try to assume we have permission and proceed
        console.warn('Android speech permission implementation issue, attempting to proceed anyway');
        this.hasPermission = true;
        return true;
      }
      this.hasPermission = false;
      return false;
    }
  }
  
  /**
   * Set callbacks for speech recognition events
   * @param {Object} callbacks - Object containing callback functions
   */
  setCallbacks(callbacks = {}) {
    if (callbacks.onStart) this.onStartCallback = callbacks.onStart;
    if (callbacks.onStop) this.onStopCallback = callbacks.onStop;
    if (callbacks.onResult) this.onResultCallback = callbacks.onResult;
    if (callbacks.onError) this.onErrorCallback = callbacks.onError;
  }
  
  /**
   * Start speech recognition
   * @param {string} language - Language code (e.g., 'en-US')
   * @returns {Promise<void>}
   */
  async start(language = 'en-US') {
    try {
      if (!this.isAvailable) {
        await this.checkAvailability();
      }
      
      if (!this.hasPermission) {
        const permissionGranted = await this.requestPermission();
        if (!permissionGranted) {
          this._triggerError('Permission not granted for speech recognition');
          return;
        }
      }
      
      if (Capacitor.isNativePlatform()) {
        // Configure plugin
        await SpeechRecognition.start({
          language,
          maxResults: 5,
          prompt: 'Speak now',
          partialResults: true,
          popup: true,
        });
        
        // Set up listeners
        SpeechRecognition.addListener('partialResults', (data) => {
          if (this.onResultCallback && data.matches && data.matches.length > 0) {
            this.onResultCallback(data.matches);
          }
        });
        
        SpeechRecognition.addListener('results', (data) => {
          if (this.onResultCallback && data.matches && data.matches.length > 0) {
            this.onResultCallback(data.matches);
          }
          this.isListening = false;
          if (this.onStopCallback) this.onStopCallback();
        });
      } else {
        // Web implementation
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
          this._triggerError('Speech recognition not supported in this browser');
          return;
        }
        
        this.webSpeechRecognition = new SpeechRecognitionAPI();
        this.webSpeechRecognition.lang = language;
        this.webSpeechRecognition.continuous = false;
        this.webSpeechRecognition.interimResults = true;
        
        this.webSpeechRecognition.onstart = () => {
          this.isListening = true;
          if (this.onStartCallback) this.onStartCallback();
        };
        
        this.webSpeechRecognition.onend = () => {
          this.isListening = false;
          if (this.onStopCallback) this.onStopCallback();
        };
        
        this.webSpeechRecognition.onresult = (event) => {
          if (this.onResultCallback) {
            const results = Array.from(event.results)
              .map(result => result[0].transcript);
            this.onResultCallback(results);
          }
        };
        
        this.webSpeechRecognition.onerror = (event) => {
          this._triggerError(event.error);
        };
        
        this.webSpeechRecognition.start();
      }
      
      this.isListening = true;
      if (this.onStartCallback) this.onStartCallback();
      
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      this._triggerError(error.message || 'Error starting speech recognition');
    }
  }
  
  /**
   * Stop speech recognition
   * @returns {Promise<void>}
   */
  async stop() {
    try {
      if (!this.isListening) return;
      
      if (Capacitor.isNativePlatform()) {
        await SpeechRecognition.stop();
        SpeechRecognition.removeAllListeners();
      } else if (this.webSpeechRecognition) {
        this.webSpeechRecognition.stop();
      }
      
      this.isListening = false;
      if (this.onStopCallback) this.onStopCallback();
    } catch (error) {
      console.error('Error stopping speech recognition:', error);
      this._triggerError(error.message || 'Error stopping speech recognition');
    }
  }
  
  /**
   * Trigger error callback
   * @param {string} message - Error message
   * @private
   */
  _triggerError(message) {
    if (this.onErrorCallback) {
      this.onErrorCallback(message);
    }
  }
}

export default new SpeechRecognitionService(); 