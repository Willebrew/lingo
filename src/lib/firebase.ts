import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase only if it hasn't been initialized yet
let app;
if (getApps().length === 0) {
  // For build time, initialize with minimal config
  app = initializeApp(firebaseConfig.apiKey ? firebaseConfig : {
    apiKey: 'build-time-placeholder',
    authDomain: 'build-time-placeholder',
    projectId: 'build-time-placeholder',
    storageBucket: 'build-time-placeholder',
    messagingSenderId: 'build-time-placeholder',
    appId: 'build-time-placeholder',
  });
} else {
  app = getApps()[0];
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
