Detaiiled firebase set up by naveen 

# Firebase Integration Guide for Panekkatt Money Tracker

This document provides detailed information about the Firebase integration in the Panekkatt Money Tracker application.

## Firebase Services Used

1. **Firebase Authentication**
   - Email/Password authentication
   - User profile management
   - Persistent session management

2. **Cloud Firestore**
   - Transaction data storage
   - User profiles
   - Categories management

3. **Firebase Hosting**
   - Application deployment
   - Custom domain support

## Firebase Configuration

The application connects to Firebase using the configuration in `src/firebase/config.js`:

```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "your-project-id.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "your-project-id.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "your-messaging-sender-id",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
```

## Data Structure

### User Profiles

User profiles are stored in the `userProfiles` collection:

```
userProfiles/
  {userId}/
    displayName: string
    email: string
    phoneNumber: string (optional)
    role: string (optional)
    companyName: string (optional)
    createdAt: timestamp
    updatedAt: timestamp (optional)
```

### Transactions

Transactions are stored in the `transactions` collection:

```
transactions/
  {transactionId}/
    userId: string (reference to user)
    date: timestamp
    type: string ("income" or "expense")
    category: string
    amount: number
    description: string (optional)
    createdAt: timestamp
    updatedAt: timestamp
```

### Categories

Categories are stored in the `categories` collection:

```
categories/
  {categoryId}/
    userId: string (reference to user)
    name: string
    type: string ("income" or "expense")
    icon: string (emoji)
    createdAt: timestamp
    updatedAt: timestamp (optional)
```

## Firebase Services Implementation

### Authentication

The application uses the Firebase Authentication service through the `authService.js` file, which provides:

- User sign-up with email and password
- User sign-in
- Password reset
- User session persistence
- User profile management

### Firestore Database

Firestore is used as the primary database through multiple service files:

1. `transactionService.js` - Manages transaction CRUD operations
2. `userProfileService.js` - Handles user profile data
3. `categoryService.js` - Manages expense and income categories

### Security Rules

The application uses Firebase security rules to protect data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read and write their own data
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    match /categories/{categoryId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

## Offline Support

The application provides limited offline support through:

1. **Local Storage** - Critical data is cached in local storage
2. **Online/Offline Detection** - The application detects and responds to connectivity changes
3. **Offline UI Indicators** - Users are informed when offline

## Key Improvements

1. **Authenticated Routes** - Protected routes ensure only authenticated users can access the application
2. **Real-time Data** - Firebase provides real-time data updates
3. **User-specific Data** - Each user can only access their own data
4. **Profile Management** - Users can manage their profiles
5. **Category Management** - Users can create custom categories with icons
6. **Offline Support** - Basic functionality works offline

## Setup Instructions

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore Database
4. Copy your Firebase configuration to `.env.local` file:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

5. Run `npm install` to install dependencies
6. Run `npm start` to start the application

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions. 