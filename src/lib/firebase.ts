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
export const db = getFirestore(app);

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
 * A safe wrapper for getDoc that prevents hanging if the client is offline
 * or if there are connection/gRPC issues. It tries to load from cache first
 * and then tries the server with a 2-second timeout.
 */
export async function safeGetDoc(docRef: any, timeoutMs: number = 2000): Promise<any> {
  // 1. Try Cache First (instant response if available)
  try {
    const cacheSnap = await getDocFromCache(docRef);
    if (cacheSnap.exists()) {
      console.log(`[safeGetDoc] Found document ${docRef.id} in offline cache.`);
      return cacheSnap;
    }
  } catch (cacheErr) {
    // Cache miss or persistence not initialized, proceed to server
  }

  // 2. Race Server Fetch with a Timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("OFFLINE_TIMEOUT")), timeoutMs)
  );

  try {
    const serverSnap = await Promise.race([
      getDocFromServer(docRef),
      timeoutPromise
    ]);
    return serverSnap;
  } catch (serverErr: any) {
    console.warn(`[safeGetDoc] Server fetch failed or timed out for ${docRef.id}, returning a safe offline mock:`, serverErr.message || serverErr);
    
    // Instead of calling standard getDoc which can hang indefinitely,
    // return a safe mock snapshot that signals the document is missing/offline.
    // This allows the app to proceed instantly with fallback offline profiles.
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
