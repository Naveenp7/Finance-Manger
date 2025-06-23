# Deployment Guide for Panekkatt Money Tracker

This guide explains how to deploy the Panekkatt Money Tracker application to Firebase Hosting.

## Prerequisites

1. Node.js and npm installed
2. Firebase account and project created
3. Firebase CLI installed (`npm install -g firebase-tools`)

## Step 1: Build the Application

First, create an optimized production build of the application:

```bash
npm run build
```

This will create a `build` folder with the production-ready files.

## Step 2: Firebase Login

Login to Firebase:

```bash
firebase login
```

## Step 3: Initialize Firebase Hosting

Initialize Firebase for the project:

```bash
firebase init
```

- Select the "Hosting" option
- Select your Firebase project
- When asked about the public directory, enter `build`
- Configure as a single-page application (SPA) by answering "Yes" to rewrite all URLs to /index.html
- Choose not to overwrite the existing index.html file

## Step 4: Deploy to Firebase

Deploy the application:

```bash
firebase deploy
```

After deployment, Firebase will provide a URL where the application is hosted.

## Step 5: Configure Firebase Security Rules

Go to the Firebase Console:

1. Navigate to Firestore Database
2. Go to the "Rules" tab
3. Update the rules to secure your data:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can access
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Users can only read and write their own profile data
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only read and write their own transactions
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Users can only read and write their own categories
    match /categories/{categoryId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

4. Publish the rules

## Step 6: Enable Authentication

In the Firebase Console:

1. Navigate to Authentication
2. Go to the "Sign-in method" tab
3. Enable the "Email/Password" provider

## Step 7: Custom Domain (Optional)

To use a custom domain:

1. Go to Firebase Hosting
2. Click "Connect domain"
3. Follow the instructions to verify domain ownership and set up DNS records

## Maintenance and Updates

To update the deployed application:

1. Make your changes in the code
2. Run `npm run build` to create a new production build
3. Run `firebase deploy` to deploy the updated version

## Troubleshooting

- If you encounter permission issues, make sure you have the correct Firebase project selected
- If the application doesn't load correctly, check the browser's console for errors
- For authentication issues, verify your Firebase configuration in the app

## Contact

For assistance with deployment, contact the Panekkatt IT department. 