import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import 'dotenv/config';

// Initialize Firebase Admin (server-side)
if (!getApps().length) {
  console.log('🔧 Initializing Firebase Admin SDK...');
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: 'translatorwebsite-d753a.firebasestorage.app',
  });
  console.log('✅ Firebase Admin SDK initialized successfully');
} else {
  console.log('✅ Firebase Admin SDK already initialized');
}

export const db = getFirestore();
export const storage = getStorage();
export const app = getApp();
