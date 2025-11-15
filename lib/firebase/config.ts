import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAODrdizLuvn9pgz9JQiIyzTxkrzddfTHU',
  appId: '1:945398676274:web:ae6e27efd0c8da4095752b',
  messagingSenderId: '945398676274',
  projectId: 'golfgun',
  authDomain: 'golfgun-69870.firebaseapp.com',
  databaseURL: 'https://golfgun-default-rtdb.asia-southeast1.firebasedatabase.app',
  storageBucket: 'golfgun.appspot.com',
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

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

export { app, auth, db, storage };

