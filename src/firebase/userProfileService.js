import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './config';

const COLLECTION_NAME = 'userProfiles';

// Create or update user profile in Firestore
export const saveUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, COLLECTION_NAME, userId);
    await setDoc(userRef, profileData, { merge: true });
    return { id: userId, ...profileData };
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

// Get user profile from Firestore
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return { id: userId, ...docSnap.data() };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile in Firestore
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(userRef, profileData);
    return { id: userId, ...profileData };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 