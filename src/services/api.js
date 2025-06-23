import { 
  fetchTransactions as fetchTransactionsFirebase,
  addTransaction as addTransactionFirebase,
  updateTransaction as updateTransactionFirebase,
  deleteTransaction as deleteTransactionFirebase
} from '../firebase/transactionService';
import {
  getUserProfile as getUserProfileFirebase,
  saveUserProfile as saveUserProfileFirebase,
  updateUserProfile as updateUserProfileFirebase
} from '../firebase/userProfileService';
import {
  fetchCategories as fetchCategoriesFirebase,
  addCategory as addCategoryFirebase,
  updateCategory as updateCategoryFirebase,
  deleteCategory as deleteCategoryFirebase,
  initializeDefaultCategories as initializeDefaultCategoriesFirebase
} from '../firebase/categoryService';
import { utils, write } from 'xlsx';
import { saveAs } from 'file-saver';

// Transaction Services

// Get transactions with filters
export const fetchTransactions = async (filters = {}) => {
  try {
    return await fetchTransactionsFirebase(filters);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Add a new transaction
export const addTransaction = async (transaction) => {
  try {
    return await addTransactionFirebase(transaction);
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

// Update an existing transaction
export const updateTransaction = async (id, transaction) => {
  try {
    return await updateTransactionFirebase(id, transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

// Delete a transaction
export const deleteTransaction = async (id) => {
  try {
    return await deleteTransactionFirebase(id);
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

// User Profile Services

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    return await getUserProfileFirebase(userId);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Save user profile
export const saveUserProfile = async (userId, profileData) => {
  try {
    return await saveUserProfileFirebase(userId, profileData);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userId, profileData) => {
  try {
    return await updateUserProfileFirebase(userId, profileData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Category Services

// Get categories
export const fetchCategories = async (type = null) => {
  try {
    return await fetchCategoriesFirebase(type);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Add a new category
export const addCategory = async (category) => {
  try {
    return await addCategoryFirebase(category);
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Update a category
export const updateCategory = async (id, category) => {
  try {
    return await updateCategoryFirebase(id, category);
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id) => {
  try {
    return await deleteCategoryFirebase(id);
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Initialize default categories
export const initializeDefaultCategories = async () => {
  try {
    return await initializeDefaultCategoriesFirebase();
  } catch (error) {
    console.error('Error initializing default categories:', error);
    throw error;
  }
};

// Export to Excel using client-side generation
export const exportToExcel = async () => {
  try {
    // Fetch all transactions
    const transactions = await fetchTransactionsFirebase({});
    
    // Create a workbook and worksheet
    const workbook = utils.book_new();
    
    // Convert transactions to worksheet data
    const worksheetData = transactions.map(t => ({
      'Date': t.date,
      'Type': t.type === 'income' ? 'Income' : 'Expense',
      'Category': t.category,
      'Amount': t.amount,
      'Description': t.description || ''
    }));
    
    // Create worksheet and add to workbook
    const worksheet = utils.json_to_sheet(worksheetData);
    utils.book_append_sheet(workbook, worksheet, 'Transactions');
    
    // Generate Excel file
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
    
    // Create Blob and return
    const blob = new Blob([excelBuffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
    return blob;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}; 