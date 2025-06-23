import * as tf from '@tensorflow/tfjs';

// Global flag for TensorFlow availability
let isTensorFlowEnabled = true;

/**
 * Safely checks if TensorFlow is available and working
 * @returns {boolean} True if TensorFlow is working properly
 */
export const isTensorFlowAvailable = async () => {
  try {
    // Check localStorage first - if explicitly disabled before, stay disabled
    const storedSetting = localStorage.getItem('ai_feature_enabled');
    if (storedSetting === 'false') {
      console.log('TensorFlow disabled by stored setting');
      return false;
    }
    
    // Already determined it's not available in this session
    if (!isTensorFlowEnabled) {
      return false;
    }
    
    // Check if running in production (not localhost)
    const isProduction = !window.location.hostname.includes('localhost');
    
    // Always enable in development
    if (!isProduction) {
      return true;
    }
    
    // Check for specific mobile browsers that might have issues
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      console.log('Mobile browser detected, disabling TensorFlow features');
      disableTensorFlow();
      return false;
    }
    
    // Try basic operations
    await tf.ready();
    const testTensor = tf.tensor1d([1, 2, 3]);
    testTensor.dispose();
    
    // Specifically test tensor3d which is causing issues
    try {
      const test3dTensor = tf.tensor3d([[[1], [2]], [[3], [4]]]);
      test3dTensor.dispose();
    } catch (error) {
      console.error('tensor3d test failed:', error);
      disableTensorFlow();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('TensorFlow availability check failed:', error);
    disableTensorFlow();
    return false;
  }
};

/**
 * Prepares data specifically for TensorFlow's tensor3d function
 * @param {Array} data The 1D time series data array
 * @param {number} windowSize Number of time periods to include in each window
 * @returns {Array} Properly formatted 3D array for tensor3d
 */
export const prepareDataForTensor3d = (data, windowSize = 14) => {
  // Ensure we have enough data
  if (!Array.isArray(data) || data.length < windowSize) {
    throw new Error(`Not enough data. Need at least ${windowSize} points.`);
  }
  
  // Ensure all data points are numbers
  const numericData = data.map(val => {
    const num = Number(val);
    if (isNaN(num)) {
      throw new Error('All values must be numeric');
    }
    return num;
  });
  
  // Create the proper shape for tensor3d: [batch, timesteps, features]
  // For a single time series, shape is [1, windowSize, 1]
  const shaped = [];
  for (let i = 0; i < numericData.length - windowSize + 1; i++) {
    const window = numericData.slice(i, i + windowSize).map(val => [val]);
    shaped.push(window);
  }
  
  return shaped;
};

/**
 * Makes a safe tensor3d that falls back to simpler methods if it fails
 * @param {Array} values Array to convert to tensor3d
 * @returns {tf.Tensor3D} A tensor3d or null if it fails
 */
export const safeTensor3d = (values) => {
  try {
    // Check if values is empty or not an array
    if (!values || !Array.isArray(values) || values.length === 0) {
      console.error('Empty or invalid input for tensor3d');
      return null;
    }
    
    // For 1D arrays, automatically convert to proper 3D shape
    if (values.length > 0 && !Array.isArray(values[0])) {
      values = [values.map(v => [Number(v)])];
    }
    
    // Ensure we're working with proper number[][][] format
    const validated = validateTensor3dData(values);
    
    // Log the shape to help debug
    console.log('Creating tensor3d with shape:', 
      `${validated.length}x${validated[0]?.length || 0}x${validated[0]?.[0]?.length || 0}`);
    
    return tf.tensor3d(validated);
  } catch (error) {
    console.error('Error in safeTensor3d:', error);
    disableTensorFlow();
    return null;
  }
};

/**
 * Deeply validates and formats data for tensor3d to ensure it's proper number[][][]
 * @param {Array} data Input data to validate
 * @returns {Array} Cleaned and validated data
 */
export const validateTensor3dData = (data) => {
  if (!Array.isArray(data)) {
    throw new Error('tensor3d input must be an array');
  }
  
  if (data.length === 0) {
    throw new Error('tensor3d input array cannot be empty');
  }
  
  // Create a properly shaped array with numerical values
  return data.map((batch, i) => {
    if (!Array.isArray(batch)) {
      throw new Error(`tensor3d batch at index ${i} is not an array`);
    }
    
    if (batch.length === 0) {
      throw new Error(`tensor3d batch at index ${i} is empty`);
    }
    
    return batch.map((row, j) => {
      if (!Array.isArray(row)) {
        throw new Error(`tensor3d row at [${i},${j}] is not an array`);
      }
      
      return row.map((value, k) => {
        const num = Number(value);
        if (isNaN(num)) {
          throw new Error(`tensor3d value at [${i},${j},${k}] is not a number: ${value}`);
        }
        return num;
      });
    });
  });
};

/**
 * Disables TensorFlow globally for this session and saves to localStorage
 * to remember the setting across page loads
 */
export const disableTensorFlow = () => {
  isTensorFlowEnabled = false;
  try {
    localStorage.setItem('ai_feature_enabled', 'false');
    console.log('TensorFlow features disabled for this browser');
  } catch (e) {
    console.error('Failed to save TensorFlow setting to localStorage', e);
  }
}; 