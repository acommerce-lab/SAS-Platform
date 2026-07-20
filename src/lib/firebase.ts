import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs,
  limit,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

// Import config directly
// @ts-ignore
import config from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (config ? config.apiKey : ''),
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (config ? config.authDomain : ''),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (config ? config.projectId : ''),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (config ? config.storageBucket : ''),
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (config ? config.messagingSenderId : ''),
  appId: import.meta.env.VITE_FIREBASE_APP_ID || (config ? config.appId : '')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export Firestore operations
export { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs,
  limit,
  Timestamp,
  deleteDoc,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};
