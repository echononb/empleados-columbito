import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration with fallback values
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789:web:abcdef123456"
};

// Check if we have valid Firebase config
const hasValidConfig = process.env.REACT_APP_FIREBASE_API_KEY &&
                      process.env.REACT_APP_FIREBASE_API_KEY !== "demo-api-key";

console.log('Firebase config check:', {
  hasValidConfig,
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY ? '***configured***' : 'not set',
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID
});

// Initialize Firebase only if we have valid config
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let functions: any = null;

if (hasValidConfig) {
  try {
    console.log('Initializing Firebase with config:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain
    });
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error);
  }
} else {
  console.warn('Firebase not configured. Using demo mode. Set REACT_APP_FIREBASE_* environment variables for full functionality.');
}

export { auth, db, storage, functions };
export default app;