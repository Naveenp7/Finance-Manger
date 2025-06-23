import * as tf from '@tensorflow/tfjs';
import { getTransactionsByDateRange } from '../../firebase/transactionService';
import { checkTensorFlowAvailability, safeTensor3d, simplePredictionFallback } from '../../utils/tensorflowUtils';

// Check if we're in production
const isProduction = !window.location.hostname.includes('localhost');

// Store TensorFlow availability state
let tensorFlowDisabled = false;

// Helper function to disable TensorFlow for the session
const disableTensorFlow = () => {
  tensorFlowDisabled = true;
  console.warn('TensorFlow has been disabled for this session due to errors');
};

// Utility to format date as YYYY-MM-DD
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Get date n days from now
const getDateDaysFromNow = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

// Get date n months from now
const getDateMonthsFromNow = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return formatDate(date);
};

// Function to create simple predictions based on average and trend
const generateSimplePredictions = (timeSeries, days, type) => {
  // If we don't have enough data, return empty array
  if (!timeSeries || timeSeries.length < 3) {
    console.log(`Not enough ${type} data for even simple predictions`);
    return [];
  }
  
  // Calculate recent trend using last 7 days or all available data
  const recentData = timeSeries.slice(-Math.min(7, timeSeries.length));
  
  // Calculate average
  const avg = recentData.reduce((sum, t) => sum + t.amount, 0) / recentData.length;
  
  // Calculate trend (slope)
  let trend = 0;
  if (recentData.length >= 3) {
    // Split into first half and second half to determine trend direction
    const midpoint = Math.floor(recentData.length / 2);
    const firstHalf = recentData.slice(0, midpoint);
    const secondHalf = recentData.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;
    
    // Calculate daily trend
    trend = (secondAvg - firstAvg) / midpoint;
  }
  
  // Generate prediction dates
  const predictionDates = Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return formatDate(date);
  });
  
  // Create predictions with trend
  return predictionDates.map((date, i) => {
    // Apply trend and add small randomness based on standard deviation
    const predictedAmount = Math.max(0, avg + (trend * (i + 1)));
    
    return {
      date,
      amount: Math.round(predictedAmount * 100) / 100,
      type,
      isSimpleEstimate: true
    };
  });
};

// Normalize data for model input
const normalizeData = (data) => {
  const values = data.map(item => item.amount);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length) || 1; // Avoid division by zero
  
  return {
    normalizedData: values.map(val => (val - mean) / std),
    mean,
    std
  };
};

// Prepare data for time series prediction with dynamic window sizing
const prepareTimeSeriesData = (data, windowSize = 7) => {
  const X = [];
  const y = [];
  
  // Exit early if not enough data
  if (data.length <= windowSize) {
    return { X, y };
  }
  
  for (let i = 0; i < data.length - windowSize; i++) {
    X.push(data.slice(i, i + windowSize));
    y.push(data[i + windowSize]);
  }
  
  return { X, y };
};

// Build and train model with improved architecture for financial data
const buildModel = async (trainX, trainY) => {
  // In production, use extra caution
  if (isProduction) {
    // Check if TensorFlow is available
    const tfStatus = await checkTensorFlowAvailability();
    if (!tfStatus.available) {
      throw new Error('TensorFlow.js not available');
    }
  }
  
  // Validate input data
  if (!Array.isArray(trainX) || trainX.length === 0 || 
      !Array.isArray(trainY) || trainY.length === 0) {
    throw new Error('Invalid input data for model training');
  }
  
  // Log data size for debugging
  console.log('Training data size:', `X: ${trainX.length}, Y: ${trainY.length}`);
  
  try {
    // Force TensorFlow initialization
    await tf.ready();
    
    // Create a sequential model with improved architecture
    const model = tf.sequential();
    
    // Input layer - LSTM for sequence learning
    model.add(tf.layers.lstm({
      units: 32,
      returnSequences: true, // Return sequences for stacked LSTM
      inputShape: [trainX[0].length, 1]
    }));
    
    // Add dropout to prevent overfitting
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // Second LSTM layer for deeper pattern recognition
    model.add(tf.layers.lstm({
      units: 16,
      returnSequences: false
    }));
    
    // Add dense layer for final prediction
    model.add(tf.layers.dense({ units: 1 }));
    
    // Compile the model with mean absolute error loss for financial data
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanAbsoluteError'
    });
    
    // Format the data for tensor3d - convert each window into [window_size, 1] format
    const formattedTrainX = [];
    for (let i = 0; i < trainX.length; i++) {
      const window = [];
      for (let j = 0; j < trainX[i].length; j++) {
        // Ensure we have valid numbers
        const value = Number(trainX[i][j]);
        if (isNaN(value)) {
          throw new Error('Invalid numeric value in training data');
        }
        window.push([value]);
      }
      formattedTrainX.push(window);
    }
    
    // Double-check data format before creating tensors
    if (formattedTrainX.length === 0) {
      throw new Error('Empty training data array');
    }
    
    // Try-catch specifically for tensor creation
    let xs, ys;
    try {
      // Convert data to tensors using our safe wrapper
      const shape = [formattedTrainX.length, trainX[0].length, 1];
      xs = safeTensor3d(formattedTrainX, shape);
      if (!xs) throw new Error('Failed to create tensor3d');
      
      ys = tf.tensor2d(trainY.map(value => [Number(value)]));
    } catch (tensorError) {
      console.error('Error creating tensor:', tensorError);
      
      // Log to Android if available
      if (typeof window !== 'undefined' && window.TensorFlowAndroid) {
        try {
          window.TensorFlowAndroid.logError(tensorError.message);
        } catch (e) {
          console.warn('Failed to log to Android:', e);
        }
      }
      
      throw new Error(`Unable to create tensor: ${tensorError.message}`);
    }
    
    // Train the model with early stopping to prevent overfitting
    await model.fit(xs, ys, {
      epochs: 150, // Increased epochs for better learning
      batchSize: 16, // Smaller batch size for better generalization
      verbose: 0,
      validationSplit: 0.2 // Use 20% of data for validation
    });
    
    // Clean up tensors
    xs.dispose();
    ys.dispose();
    
    return model;
  } catch (error) {
    console.error("Error building/training model:", error);
    throw new Error(`Error in TensorFlow model training: ${error.message}`);
  }
};

// Main function to predict income or expenses
export const predictTransactions = async (userId, type, days = 30) => {
  // First check if TensorFlow is available
  const tfStatus = await checkTensorFlowAvailability();
  
  try {
    // Get ALL historical data - Changed from 6 months to fetch ALL available data
    const endDate = formatDate(new Date());
    // Use a far past date to ensure we get all data (10 years ago)
    const startDate = formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 10)));
    
    console.log(`Fetching all transactions from ${startDate} to ${endDate}`);
    
    const transactions = await getTransactionsByDateRange(userId, startDate, endDate);
    const filteredTransactions = transactions.filter(t => t.type === type);
    
    console.log(`Found ${filteredTransactions.length} ${type} transactions in total`);
    
    // If we have no transactions of this type at all, return empty array
    if (filteredTransactions.length === 0) {
      console.log(`No ${type} transactions found. Not generating predictions.`);
      return [];
    }
    
    // Group by day
    const dailyData = {};
    filteredTransactions.forEach(transaction => {
      const date = transaction.date.split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = 0;
      }
      dailyData[date] += transaction.amount;
    });
    
    // Convert to array and sort by date
    let timeSeries = Object.entries(dailyData)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log(`Aggregated data: ${timeSeries.length} days with ${type} transactions`);
    
    // If we don't have enough data - need at least 14 days
    if (timeSeries.length < 14) {
      console.log(`Not enough historical data for ${type} (only ${timeSeries.length} days)`);
      // Use simple predictions if we have at least 3 days of data
      if (timeSeries.length >= 3) {
        return generateSimplePredictions(timeSeries, days, type);
      }
      // Otherwise, don't make predictions
      return [];
    }
    
    // Use simple predictions if:
    // 1. TensorFlow is not available
    // 2. We're on Android but it doesn't support TensorFlow well
    // 3. We're in production and randomly choose to use simple predictions for stability
    if (!tfStatus.available || 
        (tfStatus.isAndroid && !tfStatus.androidSupport) || 
        (isProduction && Math.random() > 0.7)) { // 30% chance to use simple predictions in production
        
      console.warn('Using simple predictions due to TensorFlow compatibility or stability concerns');
      return generateSimplePredictions(timeSeries, days, type);
    }
    
    try {
      // Normalize data
      const { normalizedData, mean, std } = normalizeData(timeSeries);
      
      // Debug log data
      console.log(`Normalized data length: ${normalizedData.length}`);
      
      // Use a larger window size for better predictions when we have more data
      // The window size is adaptive based on data availability
      const windowSize = Math.min(
        Math.max(7, Math.floor(normalizedData.length / 4)), // Between 7 and 1/4 of total data
        21 // Maximum window size of 21 days (3 weeks)
      );
      console.log(`Using window size of ${windowSize} for time series prediction`);
      
      // Prepare time series data with dynamic window size
      const { X, y } = prepareTimeSeriesData(normalizedData, windowSize);
      
      // Verify we have enough processed data - need at least 5 windows
      if (X.length < 5 || y.length < 5) {
        console.log(`Not enough processed data for ${type} (${X.length} windows). Using simple predictions.`);
        return generateSimplePredictions(timeSeries, days, type);
      }
      
      // Check if TensorFlow.js is loaded correctly
      if (!tf || !tf.sequential) {
        console.error('TensorFlow.js is not properly loaded');
        return generateSimplePredictions(timeSeries, days, type);
      }
      
      try {
        // Build and train model
        const model = await buildModel(X, y);
        
        // Make predictions for the requested number of days
        const lastWindow = normalizedData.slice(-windowSize);
        if (lastWindow.length < windowSize) {
          throw new Error(`Not enough data for last window (need ${windowSize})`);
        }
        
        // Format for prediction - needs to be [batch, timesteps, features]
        const predictionInput = [lastWindow.map(val => [val])]; // Shape [1, windowSize, 1]
        
        // Use our safer tensor3d creation
        const inputTensor = safeTensor3d(predictionInput);
        if (!inputTensor) {
          throw new Error('Failed to create prediction tensor');
        }
        
        // Generate dates for predictions
        const predictionDates = Array.from({ length: days }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() + i + 1);
          return formatDate(date);
        });
        
        // Implement recursive prediction for multiple days
        const predictions = [];
        let currentWindow = [...lastWindow];
        
        // Generate predictions iteratively
        for (let i = 0; i < days; i++) {
          // Format window for prediction
          const nextInput = [currentWindow.map(val => [val])];
          const nextTensor = safeTensor3d(nextInput);
          
          if (!nextTensor) {
            throw new Error(`Failed to create tensor on iteration ${i}`);
          }
          
          // Predict next value
          const nextOutput = model.predict(nextTensor);
          const predictedValue = nextOutput.dataSync()[0];
          
          // Add to predictions
          predictions.push(predictedValue);
          
          // Update window for next prediction (remove oldest, add newest)
          currentWindow.shift();
          currentWindow.push(predictedValue);
          
          // Clean up tensors
          nextTensor.dispose();
          nextOutput.dispose();
        }
        
        // Denormalize predictions
        const denormalizedPredictions = predictions.map(val => Math.max(0, val * std + mean));
        
        // Create prediction results
        const results = predictionDates.map((date, i) => ({
          date,
          amount: Math.round(denormalizedPredictions[i] * 100) / 100, // Round to 2 decimals
          type
        }));
        
        // Clean up model
        model.dispose();
        
        return results;
      } catch (tensorError) {
        console.error('Error in TensorFlow operations:', tensorError);
        
        // In production, disable TensorFlow for future calls
        if (isProduction) disableTensorFlow();
        
        return generateSimplePredictions(timeSeries, days, type);
      }
    } catch (error) {
      console.error(`Error in ${type} prediction:`, error);
      
      // Log error to Android
      if (typeof window !== 'undefined' && window.TensorFlowAndroid) {
        try {
          window.TensorFlowAndroid.logError(`${type} prediction error: ${error.message}`);
        } catch (e) {
          console.warn('Failed to log to Android:', e);
        }
      }
      
      // Fall back to simple predictions
      console.log('Falling back to simple predictions after error');
      return generateSimplePredictions(timeSeries, days, type);
    }
  } catch (error) {
    console.error(`Error fetching/processing ${type} data:`, error);
    
    // Return empty array instead of mock data
    return [];
  }
};

// Helper to generate prediction dates
const generatePredictionDates = (days) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return formatDate(date);
  });
};

// Detect anomalies in transactions
export const detectAnomalies = async (userId, sensitivity = 2) => {
  try {
    // Get ALL historical data - Changed from 3 months to all available data
    const endDate = formatDate(new Date());
    // Use a far past date to ensure we get all data (10 years ago)
    const startDate = formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 10)));
    
    const transactions = await getTransactionsByDateRange(userId, startDate, endDate);
    
    if (transactions.length < 10) {
      return []; // Return empty array if not enough data
    }
    
    // Group by category and type
    const categoryData = {};
    transactions.forEach(transaction => {
      const key = `${transaction.category}_${transaction.type}`;
      if (!categoryData[key]) {
        categoryData[key] = [];
      }
      categoryData[key].push(transaction);
    });
    
    // Find anomalies in each category
    const anomalies = [];
    
    for (const categoryTransactions of Object.values(categoryData)) {
      // Need at least 5 transactions to establish a pattern
      if (categoryTransactions.length < 5) continue;
      
      // Calculate mean and standard deviation
      const amounts = categoryTransactions.map(t => t.amount);
      const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
      const std = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);
      
      // Find transactions that deviate significantly
      const threshold = std * sensitivity;
      
      categoryTransactions.forEach(transaction => {
        if (Math.abs(transaction.amount - mean) > threshold) {
          anomalies.push({
            ...transaction,
            expected: mean,
            deviation: (transaction.amount - mean) / mean * 100
          });
        }
      });
    }
    
    return anomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation));
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return []; // Return empty array instead of throwing error
  }
};

// Recommend best days for stock purchases based on cash flow
export const recommendStockPurchaseDays = async (userId, daysToLookAhead = 14) => {
  try {
    // Check if TensorFlow is available
    const tfStatus = await checkTensorFlowAvailability();
    
    // Ensure we have sufficient data before making predictions
    const endDate = formatDate(new Date());
    // Use a far past date to ensure we get all data (10 years ago)
    const startDate = formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 10)));
    
    const transactions = await getTransactionsByDateRange(userId, startDate, endDate);
    
    // Check if we have enough data for meaningful predictions
    if (transactions.length < 14) {
      // Return an empty array instead of mock data
      return [];
    }
    
    // If TensorFlow isn't available, use simple recommendations
    if (!tfStatus.available) {
      console.log('TensorFlow not available, using simple recommendations');
      return generateSimpleRecommendations(transactions, daysToLookAhead);
    }
    
    try {
      // Get predictions for income and expenses
      const incomePredictions = await predictTransactions(userId, 'income', daysToLookAhead);
      const expensePredictions = await predictTransactions(userId, 'expense', daysToLookAhead);
      
      // If either prediction set is empty, use simple recommendations
      if (incomePredictions.length === 0 || expensePredictions.length === 0) {
        return generateSimpleRecommendations(transactions, daysToLookAhead);
      }
      
      // Calculate daily cash flow (income - expense)
      const cashFlowPredictions = {};
      
      incomePredictions.forEach(prediction => {
        cashFlowPredictions[prediction.date] = {
          date: prediction.date,
          income: prediction.amount,
          expense: 0,
          cashFlow: prediction.amount
        };
      });
      
      expensePredictions.forEach(prediction => {
        if (cashFlowPredictions[prediction.date]) {
          cashFlowPredictions[prediction.date].expense = prediction.amount;
          cashFlowPredictions[prediction.date].cashFlow -= prediction.amount;
        } else {
          cashFlowPredictions[prediction.date] = {
            date: prediction.date,
            income: 0,
            expense: prediction.amount,
            cashFlow: -prediction.amount
          };
        }
      });
      
      // Convert to array and sort by cash flow
      const cashFlowArray = Object.values(cashFlowPredictions)
        .sort((a, b) => b.cashFlow - a.cashFlow);
      
      // If no positive cash flow days, return empty array
      if (cashFlowArray.length === 0 || cashFlowArray[0].cashFlow <= 0) {
        return [];
      }
      
      // Add flags to indicate prediction type
      const recommendations = cashFlowArray
        .filter(day => day.cashFlow > 0) // Only recommend days with positive cash flow
        .slice(0, 3) // Get top 3 days
        .map(day => {
          const isSimple = incomePredictions.some(p => p.date === day.date && p.isSimpleEstimate) ||
                        expensePredictions.some(p => p.date === day.date && p.isSimpleEstimate);
          
          return {
            date: day.date,
            cashFlow: day.cashFlow,
            reason: isSimple 
              ? `Projected positive cash flow based on historical patterns (estimate)`
              : `Projected high positive cash flow: Income ₹${day.income.toFixed(2)} - Expenses ₹${day.expense.toFixed(2)}`
          };
        });
      
      return recommendations;
    } catch (error) {
      // Fallback to simple recommendation based on past transactions
      console.error('Error in stock purchase recommendations:', error);
      return generateSimpleRecommendations(transactions, daysToLookAhead);
    }
  } catch (error) {
    console.error('Error recommending stock purchase days:', error);
    return []; // Return empty array instead of mock data
  }
};

// Generate simple recommendations based on historical data
const generateSimpleRecommendations = (transactions, daysToLookAhead = 14) => {
  try {
    // If not enough transactions, return empty array
    if (transactions.length < 10) {
      return [];
    }
    
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // If we don't have both income and expense data, return empty array
    if (incomeTransactions.length < 5 || expenseTransactions.length < 5) {
      return [];
    }
    
    // Group by date to find days with historically good cash flow
    const dailyCashFlow = {};
    
    // Process income
    incomeTransactions.forEach(t => {
      const date = new Date(t.date).getDay(); // 0-6 for day of week
      if (!dailyCashFlow[date]) dailyCashFlow[date] = { income: 0, expense: 0 };
      dailyCashFlow[date].income += t.amount;
    });
    
    // Process expenses
    expenseTransactions.forEach(t => {
      const date = new Date(t.date).getDay(); // 0-6 for day of week
      if (!dailyCashFlow[date]) dailyCashFlow[date] = { income: 0, expense: 0 };
      dailyCashFlow[date].expense += t.amount;
    });
    
    // Calculate net cash flow for each day of week
    Object.keys(dailyCashFlow).forEach(day => {
      dailyCashFlow[day].net = dailyCashFlow[day].income - dailyCashFlow[day].expense;
    });
    
    // Sort days by net cash flow
    const bestDaysOfWeek = Object.entries(dailyCashFlow)
      .map(([day, data]) => ({ day: parseInt(day), ...data }))
      .filter(day => day.net > 0) // Only include days with positive net cash flow
      .sort((a, b) => b.net - a.net)
      .slice(0, 3);
    
    // If no days with positive cash flow, return empty array
    if (bestDaysOfWeek.length === 0) {
      return [];
    }
    
    // Get upcoming dates for these days of week
    const today = new Date();
    const nextDates = bestDaysOfWeek.map(dayData => {
      const targetDay = dayData.day;
      const currentDay = today.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Move to next week if day already passed
      
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + daysToAdd);
      
      return {
        date: formatDate(targetDate),
        cashFlow: dayData.net,
        reason: `Historically good day for cash flow based on past transactions (simple recommendation)`
      };
    });
    
    return nextDates;
  } catch (error) {
    console.error('Error generating simple recommendations:', error);
    return []; // Return empty array instead of mock data
  }
}; 