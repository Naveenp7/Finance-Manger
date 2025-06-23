import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';
import { db, auth } from './firebase/config';

// Ensure Firebase is initialized
console.log('Firebase initialized:', !!db && !!auth);

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        // Ignore service worker errors in production
        console.log('ServiceWorker registration failed, but app will still work: ', error);
      });
      
    // Unregister service worker if it's causing problems
    if (window.location.hostname !== 'localhost') {
      // In production, add listener for service worker errors
      window.addEventListener('error', function(event) {
        if (event.message && event.message.includes('chrome-extension')) {
          // If we get chrome-extension errors, unregister the service worker
          navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
              registration.unregister();
              console.log('Unregistered problematic service worker');
            }
          });
        }
      });
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 