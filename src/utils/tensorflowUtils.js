import * as tf from '@tensorflow/tfjs';

/**
 * Utility functions for TensorFlow.js handling with proper error handling
 * and fallbacks for both web and Android environments
 */

// Check if TensorFlow is available and working correctly
export const checkTensorFlowAvailability = async () => {
  try {
    // Try to create a simple tensor to check if TensorFlow is working
    const testTensor = tf.tensor1d([1, 2, 3]);
    testTensor.dispose();
    
    // Try to check for Android-specific interface if available
    const isAndroid = typeof window !== 'undefined' && 
                      window.TensorFlowAndroid !== undefined;
    
    let androidSupport = true;
    if (isAndroid) {
      try {
        androidSupport = window.TensorFlowAndroid.isTensorFlowSupported();
      } catch (e) {
        console.warn('Error checking Android TensorFlow support:', e);
        androidSupport = false;
      }
    }
    
    return {
      available: true,
      isAndroid,
      androidSupport
    };
  } catch (error) {
    console.warn('TensorFlow.js is not available or not working correctly:', error);
    return {
      available: false,
      error: error.message,
      isAndroid: typeof window !== 'undefined' && window.TensorFlowAndroid !== undefined,
      androidSupport: false
    };
  }
};

// Safely create a tensor3d with validation
export const safeTensor3d = (values, shape, dtype) => {
  try {
    // Validate input data
    if (!values || !Array.isArray(values)) {
      throw new Error('Invalid input: values must be an array');
    }
    
    // Check if values match the expected shape
    const flatSize = shape.reduce((a, b) => a * b, 1);
    const inputSize = Array.isArray(values[0]) && Array.isArray(values[0][0]) 
      ? values.length * values[0].length * values[0][0].length 
      : values.length;
      
    if (flatSize !== inputSize) {
      throw new Error(`Shape mismatch: expected ${flatSize} elements, got ${inputSize}`);
    }
    
    // If we have a 3D array, use it directly
    if (Array.isArray(values[0]) && Array.isArray(values[0][0])) {
      return tf.tensor3d(values, shape, dtype);
    }
    
    // If we have a flat array, reshape it
    if (Array.isArray(values) && !Array.isArray(values[0])) {
      return tf.tensor1d(values, dtype).reshape(shape);
    }
    
    throw new Error('Unsupported data format for tensor3d');
  } catch (error) {
    console.error('Error creating tensor3d:', error);
    // Log error to Android if available
    if (typeof window !== 'undefined' && window.TensorFlowAndroid) {
      try {
        window.TensorFlowAndroid.logError(error.message);
      } catch (e) {
        console.warn('Failed to log to Android:', e);
      }
    }
    throw error;
  }
};

// Simple prediction fallback when TensorFlow is not available
export const simplePredictionFallback = (data, days = 1) => {
  if (!data || data.length === 0) {
    return Array(days).fill(0);
  }
  
  // Use moving average for simple prediction
  const recentValues = data.slice(-7); // Last 7 days
  const sum = recentValues.reduce((a, b) => a + b, 0);
  const average = sum / recentValues.length;
  
  // Calculate standard deviation for trend
  const squaredDiffs = recentValues.map(val => Math.pow(val - average, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / recentValues.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  // Calculate basic trend
  const firstHalf = recentValues.slice(0, Math.floor(recentValues.length / 2));
  const secondHalf = recentValues.slice(Math.floor(recentValues.length / 2));
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trend = secondAvg - firstAvg;
  
  // Generate predictions with trend
  return Array(days).fill(0).map((_, i) => {
    const prediction = average + (trend * (i + 1));
    
    // Add small random variation based on standard deviation
    const variation = (Math.random() - 0.5) * (stdDev / 2);
    
    return Math.max(0, prediction + variation);
  });
}; 