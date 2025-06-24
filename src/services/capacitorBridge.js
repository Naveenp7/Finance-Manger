import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Check if running in native context
export const isNative = Capacitor.isNativePlatform();

// Initialize speech recognition
if (isNative) {
  try {
    // Force initialization of the plugin
    SpeechRecognition.available();
  } catch (error) {
    console.error('Error initializing speech recognition:', error);
  }
}

// Camera functions
export const takePicture = async () => {
  if (!isNative) {
    throw new Error('Not supported in browser');
  }
  
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });
    
    return image.dataUrl;
  } catch (error) {
    console.error('Error taking picture:', error);
    throw error;
  }
};

export const pickImage = async () => {
  if (!isNative) {
    throw new Error('Not supported in browser');
  }
  
  try {
    // Using FilePicker for compatibility with both iOS and Android
    const result = await Camera.pickImages({
      quality: 90,
      limit: 1
    });
    
    if (result.photos.length > 0) {
      // Convert to base64/dataURL
      const photo = result.photos[0];
      const fileData = await Filesystem.readFile({
        path: photo.path
      });
      
      return `data:image/jpeg;base64,${fileData.data}`;
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

// Speech recognition
export const startSpeechRecognition = async (language = 'en-US') => {
  if (!isNative) {
    throw new Error('Not supported in browser');
  }
  
  try {
    console.log('Checking speech recognition availability');
    // Check availability
    const available = await SpeechRecognition.available();
    console.log('Speech recognition available:', available);
    
    if (!available.available) {
      throw new Error('Speech recognition not available on this device');
    }
    
    console.log('Checking speech recognition permission');
    // Check and request permission if needed
    const permission = await SpeechRecognition.requestPermission();
    console.log('Speech recognition permission:', permission);
    
    if (!permission.permission) {
      throw new Error('Permission denied for speech recognition');
    }
    
    console.log('Starting speech recognition');
    // Start listening
    await SpeechRecognition.start({
      language,
      maxResults: 2,
      prompt: 'Speak now...',
      partialResults: true,
      popup: false,
    });
    
    console.log('Speech recognition started successfully');
    return true;
  } catch (error) {
    console.error('Error starting speech recognition:', error);
    alert(`Speech recognition error: ${error.message}`);
    throw error;
  }
};

export const stopSpeechRecognition = async () => {
  if (!isNative) {
    throw new Error('Not supported in browser');
  }
  
  try {
    await SpeechRecognition.stop();
    return true;
  } catch (error) {
    console.error('Error stopping speech recognition:', error);
    throw error;
  }
};

// Add event listener for speech recognition results
export const addSpeechRecognitionListener = (callback) => {
  if (!isNative) {
    throw new Error('Not supported in browser');
  }
  
  try {
    // Listen for both partial and final results
    SpeechRecognition.addListener('partialResults', (data) => {
      console.log('Partial speech results:', data);
      if (data && data.matches && data.matches.length > 0) {
        callback(data.matches[0]);
      }
    });
    
    SpeechRecognition.addListener('results', (data) => {
      console.log('Final speech results:', data);
      if (data && data.matches && data.matches.length > 0) {
        callback(data.matches[0]);
      }
    });
  } catch (error) {
    console.error('Error adding speech recognition listener:', error);
  }
};

export const removeSpeechRecognitionListeners = async () => {
  if (!isNative) {
    throw new Error('Not supported in browser');
  }
  
  try {
    await SpeechRecognition.removeAllListeners();
  } catch (error) {
    console.error('Error removing speech recognition listeners:', error);
  }
};

// File operations
export const saveFile = async (fileName, data, mimeType) => {
  if (!isNative) {
    throw new Error('Not supported in browser');
  }
  
  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: data,
      directory: Directory.Documents,
      recursive: true
    });
    
    return result;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Save Excel file
export const saveExcelFile = async (excelData, fileName = 'panekkatt_finance.xlsx') => {
  try {
    if (isNative) {
      // Convert blob to base64
      const base64Data = await blobToBase64(excelData);
      
      // Save file
      const result = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true
      });
      
      // Show success message
      alert(`File saved to Documents/${fileName}`);
      
      return result;
    } else {
      // Use FileSaver in browser
      // This should already be handled by the original code
      throw new Error('Use browser method instead');
    }
  } catch (error) {
    console.error('Error saving excel file:', error);
    throw error;
  }
};

// Helper function to convert Blob to base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      // Get the base64 string (remove data:application/octet-stream;base64, prefix)
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.readAsDataURL(blob);
  });
};