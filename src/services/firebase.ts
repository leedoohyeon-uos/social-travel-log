/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * src/services/firebase.ts
 * Unified Firebase integration layer for Travel Log.
 * Supports live Firebase Cloud services when configured,
 * with graceful offline/local fallback.
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import firebaseAppletConfig from '../../firebase-applet-config.json';
import {
  getAuth,
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  collection,
  collectionGroup,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import {
  getStorage,
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

// Configuration from environment variables or provisioned firebase-applet-config.json
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseAppletConfig.apiKey || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig.authDomain || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseAppletConfig.projectId || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig.storageBucket || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig.messagingSenderId || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseAppletConfig.appId || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    const databaseId = (firebaseAppletConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
    db = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);
    storage = getStorage(app);
  } catch (err) {
    console.warn('Firebase initialization error, operating in local state mode:', err);
  }
}

export {
  app,
  auth,
  db,
  storage,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  doc,
  collection,
  collectionGroup,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  ref,
  uploadBytes,
  getDownloadURL,
};
export type { FirebaseUser };
