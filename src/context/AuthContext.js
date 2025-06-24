import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { auth } from '../firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { signIn, signUp, logout } from '../firebase/authService';
import { getUserProfile, saveUserProfile } from '../firebase/userProfileService';
import { initializeDefaultCategories } from '../firebase/categoryService';
import { getAuthUser, saveToStorage, getFromStorage } from '../data/localStorageUtils';
import { isTensorFlowAvailable } from '../services/ai/tensorFlowFallback';

// Create auth context
const AuthContext = createContext();

// Context provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [aiFeatureEnabled, setAiFeatureEnabled] = useState(false); // Default to false until checked

  // Check AI compatibility on mount
  useEffect(() => {
    const checkCompatibility = async () => {
      try {
        // Try to get from localStorage first for faster loading
        const storedSetting = localStorage.getItem('ai_feature_enabled');
        if (storedSetting !== null) {
          setAiFeatureEnabled(storedSetting === 'true');
          return;
        }
        
        // If not in localStorage, check TensorFlow compatibility
        const isCompatible = await isTensorFlowAvailable();
        setAiFeatureEnabled(isCompatible);
        
        // Save to localStorage to avoid repeated checks
        localStorage.setItem('ai_feature_enabled', isCompatible.toString());
      } catch (error) {
        console.error('Error checking AI compatibility:', error);
        setAiFeatureEnabled(false); // Disable on error
      }
    };
    
    checkCompatibility();
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch user profile when user is authenticated
  const fetchUserProfile = useCallback(async (user) => {
    if (user) {
      try {
        // Try to get profile from Firestore
        let profile = null;
        
        // If online, fetch from Firebase
        if (isOnline) {
          try {
            profile = await getUserProfile(user.uid);
            
            // Save to local storage if we got a profile
            if (profile) {
              saveToStorage('USER_PROFILE', profile);
            }
          } catch (err) {
            console.error('Error fetching profile from Firebase:', err);
            // If there's an error, try to get from local storage
            profile = getFromStorage('USER_PROFILE');
          }
        } else {
          // In offline mode, get from local storage
          profile = getFromStorage('USER_PROFILE');
        }

        if (profile) {
          setUserProfile(profile);
        } else if (isOnline) {
          // Create a basic profile if none exists and we're online
          const newProfile = {
            displayName: user.displayName || '',
            email: user.email,
            createdAt: new Date().toISOString()
          };
          await saveUserProfile(user.uid, newProfile);
          setUserProfile(newProfile);
          saveToStorage('USER_PROFILE', newProfile);
          
          // Initialize default categories for new users
          await initializeDefaultCategories();
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    } else {
      setUserProfile(null);
    }
  }, [isOnline]); // Added isOnline as a dependency

  // Listen to auth state changes
  useEffect(() => {
    // First try to get user from local storage for faster load
    const cachedUser = getAuthUser();
    if (cachedUser) {
      setCurrentUser(cachedUser);
      fetchUserProfile(cachedUser);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserProfile(user);
      }
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, [fetchUserProfile]); // Added fetchUserProfile dependency

  // Sign up handler
  const handleSignUp = async (email, password, displayName) => {
    setError(null);
    try {
      const user = await signUp(email, password, displayName);
      
      // Create user profile
      await saveUserProfile(user.uid, {
        displayName,
        email,
        createdAt: new Date().toISOString()
      });
      
      // Categories will be initialized when profile is fetched
      
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign in handler
  const handleSignIn = async (email, password) => {
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    setError(null);
    try {
      await logout();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Context value
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    isOnline,
    aiFeatureEnabled, // Expose AI feature flag
    signUp: handleSignUp,
    signIn: handleSignIn,
    logout: handleLogout,
    refreshProfile: () => fetchUserProfile(currentUser)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};