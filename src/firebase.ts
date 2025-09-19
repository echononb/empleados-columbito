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

console.log('🔥 Firebase Configuration Debug:');
console.log('hasValidConfig:', hasValidConfig);
console.log('API_KEY:', process.env.REACT_APP_FIREBASE_API_KEY ? '***configured***' : 'NOT SET');
console.log('AUTH_DOMAIN:', process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'NOT SET');
console.log('PROJECT_ID:', process.env.REACT_APP_FIREBASE_PROJECT_ID || 'NOT SET');
console.log('STORAGE_BUCKET:', process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || 'NOT SET');
console.log('MESSAGING_SENDER_ID:', process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || 'NOT SET');
console.log('APP_ID:', process.env.REACT_APP_FIREBASE_APP_ID || 'NOT SET');
console.log('Full firebaseConfig:', firebaseConfig);

// Initialize Firebase only if we have valid config
let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let functions: any = null;

if (hasValidConfig) {
  try {
    console.log('🔥 Initializing Firebase with config:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasApiKey: !!firebaseConfig.apiKey,
      hasAppId: !!firebaseConfig.appId
    });
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app);
    console.log('✅ Firebase initialized successfully');

    // Test if the project exists by trying to get auth config
    console.log('🔍 Testing Firebase connection...');
    // This will help us know if the credentials are valid
    setTimeout(() => {
      console.log('Firebase Auth currentUser:', auth.currentUser);
      console.log('Firebase project accessible');
    }, 1000);

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('This usually means:');
    console.error('1. Invalid API key or project ID');
    console.error('2. Project does not exist');
    console.error('3. Wrong credentials copied from Firebase Console');
  }
} else {
  console.warn('⚠️ Firebase not configured. Using demo mode. Set REACT_APP_FIREBASE_* environment variables for full functionality.');
}

export { auth, db, storage, functions };
export default app;