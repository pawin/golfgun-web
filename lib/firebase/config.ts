import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// Initialize on client side only
if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} else {
  // Server-side: create mock objects that throw errors if used
  auth = {} as Auth;
  db = {} as Firestore;
  storage = {} as FirebaseStorage;
}

/**
 * Check if Firebase is initialized on the client side
 * @returns true if Firebase is properly initialized, false otherwise
 */
export function isFirebaseInitialized(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  // Check if auth has the onAuthStateChanged method, which indicates it's a real Auth instance
  return !!auth && typeof auth.onAuthStateChanged === 'function';
}

/**
 * Get the auth instance, ensuring it's initialized
 * @returns Auth instance if initialized, throws error otherwise
 */
export function getAuthInstance(): Auth {
  if (!isFirebaseInitialized()) {
    throw new Error('Firebase Auth is not initialized. Make sure you are on the client side.');
  }
  return auth;
}

export { app, auth, db, storage };

