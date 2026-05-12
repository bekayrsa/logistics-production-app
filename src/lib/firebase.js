// (RS) Logistics Production App
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if we have a valid-looking API key
const hasFirebaseConfig = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== 'your-api-key' &&
  firebaseConfig.apiKey !== '';

let app;
let auth;
let database;
let analytics;

let secondaryApp;
let secondaryAuth;

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getDatabase(app);
    
    // Create secondary app for user management (so admin doesn't get logged out)
    secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
    secondaryAuth = getAuth(secondaryApp);

    // Analytics is only supported in browser environments
    isSupported().then(supported => {
      if (supported) analytics = getAnalytics(app);
    });
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
} else {
  console.warn("Firebase credentials missing or invalid. App will only function in Demo Mode.");
}

export { auth, database, analytics, secondaryAuth };
