import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, Spinner, Card, Alert } from 'react-bootstrap';
import { FaCamera, FaCheck, FaUpload } from 'react-icons/fa';
import { createWorker } from 'tesseract.js';
import { isNative, takePicture, pickImage } from '../services/capacitorBridge';

// Regular expressions for parsing
const amountRegex = /(?:total|amount|amt|sum|rs|inr|₹)[\s:]*(\d+(?:\.\d+)?)/i;
const dateRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;
const gstRegex = /GST\s*(?:No|Number|#)?[\s:]*([0-9A-Z]+)/i;

const OcrScanner = ({ onTransactionCapture, defaultType = 'expense' }) => {
  const [showModal, setShowModal] = useState(false);
  const [image, setImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [error, setError] = useState(null);
  const [interpretedTransaction, setInterpretedTransaction] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [rawText, setRawText] = useState('');
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Open camera modal
  const handleOpenScanner = () => {
    setShowModal(true);
    setImage(null);
    setScanResults(null);
    setError(null);
    setInterpretedTransaction(null);
  };
  
  // Close camera modal
  const handleCloseScanner = () => {
    setShowModal(false);
    if (!isNative) {
      stopCamera();
    }
  };
  
  // Start the camera (web only)
  const startCamera = async () => {
    if (isNative) return; // Not needed for native
    
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      setError("Couldn't access camera: " + err.message);
    }
  };
  
  // Stop the camera (web only)
  const stopCamera = () => {
    if (isNative) return; // Not needed for native
    
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  // Capture image
  const captureImage = async () => {
    try {
      if (isNative) {
        // Use Capacitor Camera API
        const imageUrl = await takePicture();
        setImage(imageUrl);
      } else {
        // Use web camera API
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          // Draw video frame to canvas
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Convert canvas to image
          const imageDataUrl = canvas.toDataURL('image/jpeg');
          
          // Stop camera after capturing
          stopCamera();
          
          // Set captured image
          setImage(imageDataUrl);
        }
      }
    } catch (err) {
      setError(`Couldn't capture image: ${err.message}`);
    }
  };
  
  // Handle file selection
  const handleFileSelect = async (e) => {
    try {
      if (isNative) {
        // Use Capacitor File Picker
        const imageUrl = await pickImage();
        if (imageUrl) {
          setImage(imageUrl);
        }
      } else {
        // Use web file input
        const file = e.target.files[0];
        
        if (file) {
          const reader = new FileReader();
          
          reader.onload = (event) => {
            setImage(event.target.result);
          };
          
          reader.readAsDataURL(file);
        }
      }
    } catch (err) {
      setError(`Couldn't select image: ${err.message}`);
    }
  };
  
  // Process the selected image
  const processImage = async () => {
    if (!image) {
      setError("No image to process");
      return;
    }
    
    setScanning(true);
    setScanResults(null);
    setError(null);
    
    try {
      const worker = await createWorker('eng');
      
      const result = await worker.recognize(image);
      
      await worker.terminate();
      
      if (result && result.data) {
        setRawText(result.data.text);
        setConfidence(result.data.confidence);
        setScanResults(result.data);
        
        // Interpret results
        interpretOcrResults(result.data.text, result.data.confidence);
      } else {
        throw new Error("Couldn't extract text from the image");
      }
    } catch (err) {
      setError(`OCR processing failed: ${err.message}`);
      setScanResults(null);
    } finally {
      setScanning(false);
    }
  };
  
  // Interpret OCR results
  const interpretOcrResults = (text, confidence) => {
    try {
      // Default transaction with current date
      const currentDate = new Date().toISOString().split('T')[0];
      
      const transaction = {
        type: defaultType,
        amount: null,
        category: 'miscellaneous',
        date: currentDate,
        description: 'Scanned receipt'
      };
      
      // Extract amount
      const amountMatch = text.match(amountRegex);
      if (amountMatch && amountMatch[1]) {
        transaction.amount = parseFloat(amountMatch[1]);
      }
      
      // Extract date
      const dateMatch = text.match(dateRegex);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        let year = parseInt(dateMatch[3]);
        
        // Handle 2-digit years
        if (year < 100) {
          year = year < 50 ? 2000 + year : 1900 + year;
        }
        
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) {
          transaction.date = date.toISOString().split('T')[0];
        }
      }
      
      // If a store/vendor name is found, use it for description
      const storeMatch = text.match(/(store|mart|shop|super|market|restaurant|hotel):?\s*([A-Za-z0-9\s]+)/i);
      if (storeMatch && storeMatch[2]) {
        transaction.description = storeMatch[2].trim();
      }
      
      // Extract GST number if present (useful for business receipts)
      const gstMatch = text.match(gstRegex);
      if (gstMatch && gstMatch[1]) {
        transaction.gstNumber = gstMatch[1];
        transaction.description += ` (GST: ${gstMatch[1]})`;
      }
      
      // Attempt to categorize based on keywords in the text
      if (/food|meal|restaurant|cafe|grocery|groceries/i.test(text)) {
        transaction.category = 'raw materials';
      } else if (/electric|electricity|power|water|gas|utility|utilities/i.test(text)) {
        transaction.category = 'utilities';
      } else if (/petrol|diesel|fuel|transport|travel|taxi|cab|uber|ola/i.test(text)) {
        transaction.category = 'transport';
      } else if (/office|stationery|paper|pen|printer|ink/i.test(text)) {
        transaction.category = 'office supplies';
      }
      
      // Only set valid transactions
      if (transaction.amount) {
        setInterpretedTransaction(transaction);
      } else {
        throw new Error("Couldn't detect an amount on the receipt");
      }
    } catch (err) {
      setError(err.message || "Couldn't interpret the receipt properly");
      setInterpretedTransaction(null);
    }
  };
  
  // Handle transaction confirmation
  const handleConfirm = () => {
    if (interpretedTransaction) {
      onTransactionCapture(interpretedTransaction);
      setShowModal(false);
      setImage(null);
      setScanResults(null);
      setInterpretedTransaction(null);
    }
  };
  
  // Handle modal open
  useEffect(() => {
    if (showModal && !image && !isNative) {
      startCamera();
    }
  }, [showModal, image]);
  
  return (
    <>
      <Button
        variant="outline-primary"
        onClick={handleOpenScanner}
        className="ocr-scanner-btn"
      >
        <FaCamera /> Scan Receipt
      </Button>

      <Modal
        show={showModal}
        onHide={handleCloseScanner}
        centered
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Scan Receipt</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!image ? (
            <div className="text-center">
              {!isNative && (
                <div className="camera-container mb-3">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', maxHeight: '50vh', objectFit: 'contain' }}
                  />
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}

              <div className="d-flex justify-content-center gap-3">
                <Button variant="primary" onClick={captureImage}>
                  <FaCamera /> {isNative ? 'Take Photo' : 'Capture'}
                </Button>
                <Button variant="secondary" onClick={isNative ? handleFileSelect : () => fileInputRef.current?.click()}>
                  <FaUpload /> Upload Image
                </Button>
                {!isNative && (
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                )}
              </div>
            </div>
          ) : (
            <div>
              {scanning ? (
                <div className="text-center">
                  <Spinner animation="border" variant="primary" />
                  <p>Scanning image for text...</p>
                </div>
              ) : error ? (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                  {error}
                </Alert>
              ) : (
                <div>
                  <h5>Scan Results</h5>
                  <Card className="mb-3">
                    <Card.Body>
                      <Card.Title>Interpreted Transaction</Card.Title>
                      <Card.Text>
                        <strong>Type:</strong> {interpretedTransaction?.type}<br />
                        <strong>Amount:</strong> {interpretedTransaction?.amount}<br />
                        <strong>Category:</strong> {interpretedTransaction?.category}<br />
                        <strong>Date:</strong> {interpretedTransaction?.date}<br />
                        <strong>Description:</strong> {interpretedTransaction?.description}
                      </Card.Text>
                      
                      <Button variant="success" onClick={handleConfirm}>
                        <FaCheck /> Confirm Transaction
                      </Button>
                    </Card.Body>
                  </Card>
                  
                  <h6>Raw OCR Text (for debugging)</h6>
                  <pre>{rawText}</pre>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default OcrScanner;
