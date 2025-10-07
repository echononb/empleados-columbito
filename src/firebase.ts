import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration - Required environment variables
const getRequiredEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Please check your .env file.`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: getRequiredEnvVar('REACT_APP_FIREBASE_API_KEY'),
  authDomain: getRequiredEnvVar('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  projectId: getRequiredEnvVar('REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: getRequiredEnvVar('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRequiredEnvVar('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRequiredEnvVar('REACT_APP_FIREBASE_APP_ID')
};

// Validate Firebase configuration
const hasValidConfig = (() => {
  try {
    // Ensure all required variables are present and not demo values
    const requiredVars = [
      'REACT_APP_FIREBASE_API_KEY',
      'REACT_APP_FIREBASE_AUTH_DOMAIN',
      'REACT_APP_FIREBASE_PROJECT_ID',
      'REACT_APP_FIREBASE_STORAGE_BUCKET',
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      'REACT_APP_FIREBASE_APP_ID'
    ];

    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value || value.includes('demo') || value.length < 10) {
        console.error(`❌ Invalid Firebase configuration: ${varName} appears to be a demo/placeholder value`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Firebase configuration validation failed:', error);
    return false;
  }
})();

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

  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    console.error('This usually means:');
    console.error('1. Invalid API key or project ID');
    console.error('2. Project does not exist');
    console.error('3. Wrong credentials copied from Firebase Console');
    throw new Error('Firebase initialization failed. Please check your configuration.');
  }
} else {
  console.error('❌ Firebase configuration is invalid or missing required environment variables.');
  console.error('Please check your .env file and ensure all REACT_APP_FIREBASE_* variables are set correctly.');
  throw new Error('Firebase configuration is required but not properly configured.');
}

export { auth, db, storage, functions };
export default app;