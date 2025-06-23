import { ref, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { getTransactions } from '../firebase/transactionService';
import { getCategories } from '../firebase/categoryService';
import { getUserProfile } from '../firebase/userProfileService';

/**
 * Service for creating and managing backups of user data to Firebase Storage
 */

// Generate a backup name with timestamp
const generateBackupName = (userId) => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  return `${userId}/backups/backup_${timestamp}.json`;
};

// Create backup for a specific user
export const createBackup = async (userId) => {
  try {
    // Collect all user data
    const [transactions, categories, profile] = await Promise.all([
      getTransactions(userId),
      getCategories(userId),
      getUserProfile(userId)
    ]);
    
    // Create backup data structure
    const backupData = {
      createdAt: new Date().toISOString(),
      userId,
      profile,
      transactions,
      categories,
      metadata: {
        transactionCount: transactions.length,
        categoryCount: categories.length,
        version: '2.0'
      }
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(backupData, null, 2);
    
    // Create blob from JSON
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // Generate backup name
    const backupName = generateBackupName(userId);
    
    // Create a reference to the storage location
    const backupRef = ref(storage, backupName);
    
    // Upload blob to Firebase Storage
    await uploadBytes(backupRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(backupRef);
    
    return {
      success: true,
      backupName,
      downloadURL,
      createdAt: backupData.createdAt,
      size: blob.size,
      metadata: backupData.metadata
    };
  } catch (error) {
    console.error('Error creating backup:', error);
    throw new Error(`Backup failed: ${error.message}`);
  }
};

// List all backups for a specific user
export const listBackups = async (userId) => {
  try {
    // Create a reference to the user's backup folder
    const backupsRef = ref(storage, `${userId}/backups`);
    
    // List all items in the folder
    const result = await listAll(backupsRef);
    
    // Get metadata and download URLs for each backup
    const backups = await Promise.all(
      result.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        const name = itemRef.name;
        
        // Extract timestamp from name
        const timestamp = name.replace('backup_', '').replace('.json', '');
        const date = new Date(timestamp.replace(/-/g, ':').replace('T-', 'T:'));
        
        return {
          name,
          path: itemRef.fullPath,
          downloadURL,
          createdAt: date.toISOString(),
          formattedDate: date.toLocaleString()
        };
      })
    );
    
    // Sort by creation date (newest first)
    return backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Error listing backups:', error);
    
    // If error is about folder not existing, return empty array
    if (error.code === 'storage/object-not-found') {
      return [];
    }
    
    throw new Error(`Listing backups failed: ${error.message}`);
  }
};

// Download a specific backup by its path
export const downloadBackup = async (backupPath) => {
  try {
    // Create a reference to the backup file
    const backupRef = ref(storage, backupPath);
    
    // Get download URL
    const downloadURL = await getDownloadURL(backupRef);
    
    // Fetch the backup data
    const response = await fetch(downloadURL);
    
    if (!response.ok) {
      throw new Error(`Failed to download backup: ${response.statusText}`);
    }
    
    // Parse the JSON data
    const backupData = await response.json();
    
    return backupData;
  } catch (error) {
    console.error('Error downloading backup:', error);
    throw new Error(`Download failed: ${error.message}`);
  }
};

// Restore data from a backup
export const restoreFromBackup = async (backupData) => {
  // This function would restore the data to Firestore
  // Implementation would depend on the specific needs of the application
  // and would typically involve batch writes to Firestore
  
  // This is a placeholder that demonstrates the concept
  console.log('Restore from backup would be implemented here');
  console.log('Backup data contains:', {
    transactionCount: backupData.transactions.length,
    categoryCount: backupData.categories.length,
    profileData: backupData.profile
  });
  
  return {
    success: true,
    message: 'Backup restoration would happen here',
    timestamp: new Date().toISOString()
  };
};

// Delete a specific backup
export const deleteBackup = async (backupPath) => {
  try {
    // Create a reference to the backup file
    const backupRef = ref(storage, backupPath);
    
    // Delete the file from Firebase Storage
    await deleteObject(backupRef);
    
    return {
      success: true,
      message: 'Backup deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting backup:', error);
    throw new Error(`Deletion failed: ${error.message}`);
  }
};

// Create a scheduled backup
export const scheduleBackup = (userId, interval = 'daily') => {
  // In a real application, this would be implemented as a Firebase Cloud Function
  // with a scheduled trigger
  
  // For client-side demonstration, we'll just create a backup right away
  return createBackup(userId);
}; 