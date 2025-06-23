// Local storage keys
const KEYS = {
  USER_PROFILE: 'panekkatt_user_profile',
  TRANSACTIONS: 'panekkatt_transactions',
  CATEGORIES: 'panekkatt_categories',
  LAST_SYNC: 'panekkatt_last_sync',
  AUTH_USER: 'panekkatt_auth_user'
};

// Get data from local storage
export const getFromStorage = (key) => {
  try {
    const data = localStorage.getItem(KEYS[key]);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error retrieving ${key} from local storage:`, error);
    return null;
  }
};

// Save data to local storage
export const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to local storage:`, error);
    return false;
  }
};

// Remove data from local storage
export const removeFromStorage = (key) => {
  try {
    localStorage.removeItem(KEYS[key]);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from local storage:`, error);
    return false;
  }
};

// Clear all app data from local storage
export const clearAllStorage = () => {
  try {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    return true;
  } catch (error) {
    console.error('Error clearing local storage:', error);
    return false;
  }
};

// Save auth user to local storage
export const saveAuthUser = (user) => {
  if (!user) return false;
  
  // Only store essential user info, not the entire Firebase user object
  const userData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    lastLoginAt: new Date().toISOString()
  };
  
  return saveToStorage('AUTH_USER', userData);
};

// Get auth user from local storage
export const getAuthUser = () => {
  return getFromStorage('AUTH_USER');
};

// Remove auth user from local storage (for logout)
export const removeAuthUser = () => {
  return removeFromStorage('AUTH_USER');
};

// Update last sync timestamp
export const updateLastSync = () => {
  return saveToStorage('LAST_SYNC', { timestamp: new Date().toISOString() });
};

// Get last sync timestamp
export const getLastSync = () => {
  const sync = getFromStorage('LAST_SYNC');
  return sync ? sync.timestamp : null;
}; 