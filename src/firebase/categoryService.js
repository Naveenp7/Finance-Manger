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
  getDoc
} from 'firebase/firestore';
import { db, auth } from './config';

const COLLECTION_NAME = 'categories';

// Get all categories by type (income or expense)
export const fetchCategories = async (type = null) => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    
    if (!userId) {
      throw new Error('User must be authenticated to fetch categories');
    }
    
    // Query for user's categories
    const categoriesRef = collection(db, COLLECTION_NAME);
    let conditions = [where('userId', '==', userId)];
    
    // Filter by type if specified
    if (type) {
      conditions.push(where('type', '==', type));
    }
    
    // Apply conditions to query
    let q = query(categoriesRef, ...conditions, orderBy('name'));
    
    // Execute query
    const querySnapshot = await getDocs(q);
    
    // Process results
    const categories = [];
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Add a new category
export const addCategory = async (category) => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    
    if (!userId) {
      throw new Error('User must be authenticated to add a category');
    }
    
    const categoryData = {
      ...category,
      userId,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), categoryData);
    
    return {
      id: docRef.id,
      ...categoryData
    };
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Update an existing category
export const updateCategory = async (id, category) => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    
    if (!userId) {
      throw new Error('User must be authenticated to update a category');
    }
    
    const categoryRef = doc(db, COLLECTION_NAME, id);
    
    // Get the category to check ownership
    const docSnap = await getDoc(categoryRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      throw new Error('Category not found or you do not have permission to update it');
    }
    
    const updateData = {
      ...category,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(categoryRef, updateData);
    
    return {
      id,
      ...updateData
    };
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id) => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    
    if (!userId) {
      throw new Error('User must be authenticated to delete a category');
    }
    
    const categoryRef = doc(db, COLLECTION_NAME, id);
    
    // Get the category to check ownership
    const docSnap = await getDoc(categoryRef);
    
    if (!docSnap.exists() || docSnap.data().userId !== userId) {
      throw new Error('Category not found or you do not have permission to delete it');
    }
    
    await deleteDoc(categoryRef);
    
    return { id };
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Initialize default categories for a new user
export const initializeDefaultCategories = async () => {
  try {
    const userId = auth.currentUser ? auth.currentUser.uid : null;
    
    if (!userId) {
      throw new Error('User must be authenticated to initialize categories');
    }
    
    // Check if user already has categories
    const existingCategories = await fetchCategories();
    
    if (existingCategories.length > 0) {
      // User already has categories, no need to initialize
      return existingCategories;
    }
    
    // Default income categories
    const incomeCategories = [
      { name: 'Salary', type: 'income', icon: '💰' },
      { name: 'Business', type: 'income', icon: '🏢' },
      { name: 'Investment', type: 'income', icon: '📈' },
      { name: 'Rent', type: 'income', icon: '🏠' },
      { name: 'Other', type: 'income', icon: '✨' }
    ];
    
    // Default expense categories
    const expenseCategories = [
      { name: 'Food', type: 'expense', icon: '🍔' },
      { name: 'Transport', type: 'expense', icon: '🚗' },
      { name: 'Housing', type: 'expense', icon: '🏡' },
      { name: 'Utilities', type: 'expense', icon: '💡' },
      { name: 'Shopping', type: 'expense', icon: '🛍️' },
      { name: 'Entertainment', type: 'expense', icon: '🎬' },
      { name: 'Healthcare', type: 'expense', icon: '⚕️' },
      { name: 'Education', type: 'expense', icon: '📚' },
      { name: 'Personal', type: 'expense', icon: '👤' },
      { name: 'Raw Materials', type: 'expense', icon: '🏭' },
      { name: 'Other', type: 'expense', icon: '📝' }
    ];
    
    // Combine and add all categories
    const allCategories = [...incomeCategories, ...expenseCategories];
    const createdCategories = [];
    
    for (const category of allCategories) {
      const result = await addCategory(category);
      createdCategories.push(result);
    }
    
    return createdCategories;
  } catch (error) {
    console.error('Error initializing default categories:', error);
    throw error;
  }
};

// Get all categories for a user (alias for fetchCategories for compatibility)
export const getCategories = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch categories');
    }
    
    // If we have a logged-in user, verify it matches the requested userId
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.uid !== userId) {
      throw new Error('User ID mismatch. Cannot fetch categories for a different user.');
    }
    
    // Set the auth user temporarily if needed
    const tempUser = !currentUser ? { uid: userId } : null;
    if (tempUser) auth.currentUser = tempUser;
    
    // Use the existing fetchCategories function
    const categories = await fetchCategories();
    
    // Reset if we set a temporary user
    if (tempUser) auth.currentUser = null;
    
    return categories;
  } catch (error) {
    console.error('Error in getCategories:', error);
    throw error;
  }
};