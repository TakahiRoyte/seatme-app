import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { previewConfiguration } from './previewConfig';

// A compile-time branch lets Vite remove production values from Preview output.
const preview = import.meta.env.MODE === 'apew-preview'
  ? previewConfiguration('apew-preview', window.location.origin)
  : null;
const firebaseConfig = import.meta.env.MODE === 'apew-preview' ? preview!.firebase : {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(preview?.firebase ?? firebaseConfig);

// Initialize Firestore
export const db = preview ? initializeFirestore(app, preview.firestore) : getFirestore(app);
