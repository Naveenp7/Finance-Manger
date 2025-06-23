# Money Tracker

A modern financial management application for Shops with transaction tracking, reporting, and financial analytics.

## Features

- User authentication and profile management
- Transaction management (income and expenses)
- Financial dashboard with visualizations
- Expense and income category management
- Financial reports and data export
- Mobile-responsive design

## Technologies Used

- React.js for the frontend
- Firebase for authentication, database, and hosting
- React Router for navigation
- Bootstrap & React-Bootstrap for UI components
- Chart.js for data visualization
- Firebase Firestore for cloud database

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file in the root directory with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-app-id
   ```
4. Start the development server:
   ```
   npm start
   ```

## Deployment

### Firebase Deployment

1. Install Firebase CLI:
   ```
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```
   firebase login
   ```

3. Initialize Firebase in your project:
   ```
   firebase init
   ```

4. Build your project:
   ```
   npm run build
   ```

5. Deploy to Firebase:
   ```
   firebase deploy
   ```

## Usage

1. Register a new account or log in with existing credentials
2. Navigate through the dashboard to view financial summary
3. Add, edit or delete transactions
4. Filter transactions by date, category or type
5. View reports and export data as needed
6. Update profile information in the profile section

## Firebase Security Rules

Add these security rules to your Firebase console to secure your data:

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

## License

This project is proprietary and owned by Panekkatt Oil Mill.

## Contact

For support, please contact the Panekkatt IT department. 
