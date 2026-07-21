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
  getDocFromCache,
  getDocFromServer,
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
  enableIndexedDbPersistence
} from 'firebase/firestore';

// Import config directly
// @ts-ignore
import config from '../../firebase-applet-config.json';

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || (config ? config.apiKey : ''),
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || (config ? config.authDomain : ''),
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || (config ? config.projectId : ''),
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || (config ? config.storageBucket : ''),
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || (config ? config.messagingSenderId : ''),
  appId: metaEnv.VITE_FIREBASE_APP_ID || (config ? config.appId : '')
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const dbId = metaEnv.VITE_FIREBASE_DATABASE_ID || (config ? config.firestoreDatabaseId : '');
export const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore offline persistence: Multiple tabs open, persistence enabled in another tab.");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore offline persistence: Current browser doesn't support offline storage.");
    } else {
      console.warn("Firestore offline persistence could not be enabled:", err);
    }
  });
} catch (e) {
  console.warn("Failed to initialize Firestore offline persistence:", e);
}

/**
 * A wrapper for getDoc that attempts to fetch from Firestore, falling back to cache if offline.
 */
export async function safeGetDoc(docRef: any): Promise<any> {
  try {
    return await getDoc(docRef);
  } catch (err) {
    try {
      const cacheSnap = await getDocFromCache(docRef);
      if (cacheSnap.exists()) {
        return cacheSnap;
      }
    } catch (cacheErr) {
      // Ignore cache error
    }
    return {
      exists: () => false,
      data: () => null,
      id: docRef.id,
      ref: docRef
    };
  }
}

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
