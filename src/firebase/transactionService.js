import { 
  collection, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from './config';

const COLLECTION_NAME = 'transactions';

// Convert Firebase timestamp to ISO string date
const convertTimestampToDate = (transaction) => {
  return {
    ...transaction,
    date: transaction.date.toDate().toISOString().split('T')[0]
  };
};

// Format transaction for Firebase
const formatForFirebase = (transaction) => {
  const userId = auth.currentUser ? auth.currentUser.uid : null;
  
  if (!userId) {
    throw new Error('User must be authenticated to perform this action');
  }
  
  return {
    ...transaction,
    userId,
    date: Timestamp.fromDate(new Date(transaction.date)),
    amount: Number(transaction.amount),
    createdAt: transaction.createdAt || Timestamp.now(),
    updatedAt: Timestamp.now()
  };
};

// Get all transactions with optional filters
export const fetchTransactions = async (filters = {}) => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    
    if (!userId) {
      throw new Error('User must be authenticated to fetch transactions');
    }
    
    // Start with user's transactions
    const transactionsRef = collection(db, COLLECTION_NAME);
    let conditions = [where('userId', '==', userId)];
    
    // Add filter conditions
    if (filters.type) {
      conditions.push(where('type', '==', filters.type));
    }
    
    if (filters.category) {
      conditions.push(where('category', '==', filters.category));
    }
    
    if (filters.start_date && filters.end_date) {
      const startDate = Timestamp.fromDate(new Date(filters.start_date));
      const endDate = Timestamp.fromDate(new Date(filters.end_date));
      conditions.push(where('date', '>=', startDate));
      conditions.push(where('date', '<=', endDate));
    }
    
    // Apply conditions to query
    let q = query(transactionsRef, ...conditions, orderBy('date', 'desc'));
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Process results
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...convertTimestampToDate(data)
      });
    });
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Add a new transaction
export const addTransaction = async (transaction) => {
  try {
    const formattedTransaction = formatForFirebase(transaction);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), formattedTransaction);
    
    return {
      id: docRef.id,
      ...transaction
    };
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Update an existing transaction
export const updateTransaction = async (id, transaction) => {
  try {
    const formattedTransaction = formatForFirebase(transaction);
    const transactionRef = doc(db, COLLECTION_NAME, id);
    
    // Remove userId from update as it shouldn't change
    const { userId, ...updateData } = formattedTransaction;
    
    await updateDoc(transactionRef, updateData);
    
    return {
      id,
      ...transaction
    };
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Delete a transaction
export const deleteTransaction = async (id) => {
  try {
    const transactionRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(transactionRef);
    
    return { id };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// Get all transactions for a user
export const getTransactions = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch transactions');
    }
    
    const transactionsRef = collection(db, COLLECTION_NAME);
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...convertTimestampToDate(data)
      });
    });
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Get transactions by date range
export const getTransactionsByDateRange = async (userId, startDate, endDate) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch transactions by date range');
    }
    
    // Convert string dates to Firebase Timestamps
    const startTimestamp = Timestamp.fromDate(new Date(startDate));
    const endTimestamp = Timestamp.fromDate(new Date(endDate));
    
    // Create query with date range filter
    const transactionsRef = collection(db, COLLECTION_NAME);
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      where('date', '>=', startTimestamp),
      where('date', '<=', endTimestamp),
      orderBy('date', 'desc')
    );
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Process results
    const transactions = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        ...convertTimestampToDate(data)
      });
    });
    
    return transactions;
  } catch (error) {
    console.error('Error fetching transactions by date range:', error);
    throw error;
  }
};

// Helper to get all transactions for current user (for AI agent)
export const getAllUserTransactions = async () => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    if (!userId) throw new Error('User must be authenticated');
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...convertTimestampToDate(doc.data()) }));
  } catch (err) {
    return [];
  }
};