import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from './config';
import { saveAuthUser, removeAuthUser } from '../data/localStorageUtils';

// Sign up a new user
export const signUp = async (email, password, displayName) => {
  try {
    console.log('Attempting to create user with email:', email);
    
    if (!auth) {
      throw new Error('Firebase auth is not initialized');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('User created successfully, adding display name');
    
    // Add display name to user profile
    await updateProfile(userCredential.user, {
      displayName: displayName
    });
    
    // Save user to local storage for offline access
    saveAuthUser(userCredential.user);
    
    console.log('User profile updated and saved to local storage');
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing up:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Handle specific error cases
    if (error.code === 'auth/configuration-not-found') {
      console.error('Firebase auth configuration not found. Make sure Email/Password authentication is enabled in the Firebase console.');
    } else if (error.code === 'auth/email-already-in-use') {
      console.error('Email is already in use by another account.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('Email address is not valid.');
    } else if (error.code === 'auth/operation-not-allowed') {
      console.error('Email/Password accounts are not enabled in Firebase console.');
    } else if (error.code === 'auth/weak-password') {
      console.error('Password is too weak. It should be at least 6 characters.');
    }
    
    throw error;
  }
};

// Sign in an existing user
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Save user to local storage for offline access
    saveAuthUser(userCredential.user);
    
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign out the current user
export const logout = async () => {
  try {
    await signOut(auth);
    
    // Remove user from local storage
    removeAuthUser();
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    }, reject);
  });
}; 