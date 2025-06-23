// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyABCmprcNBNvQOo3kcx30HgV1cItVAhNMM",
  authDomain: "panekkatt-money-tracker.firebaseapp.com",
  projectId: "panekkatt-money-tracker",
  storageBucket: "panekkatt-money-tracker.appspot.com",
  messagingSenderId: "772202958486",
  appId: "1:772202958486:web:f9d254f7d4e6916366bcb7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Log to help with debugging
console.log("Firebase initialized with config:", {
  apiKey: firebaseConfig.apiKey ? "Provided" : "Missing",
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket
});

export { db, auth, storage }; 