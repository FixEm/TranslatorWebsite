// Simple script to create Firebase Storage bucket
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import 'dotenv/config';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  console.log('🔧 Initializing Firebase Admin SDK...');
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
  console.log('✅ Firebase Admin SDK initialized');
}

async function createBucket() {
  try {
    console.log('📦 Attempting to create storage bucket...');
    
    const storage = getStorage();
    const bucketName = `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;
    
    // Try to access the bucket first
    const bucket = storage.bucket(bucketName);
    
    try {
      const [exists] = await bucket.exists();
      if (exists) {
        console.log('✅ Storage bucket already exists:', bucketName);
        return;
      }
    } catch (err) {
      console.log('📦 Bucket does not exist, creating...');
    }
    
    // Create the bucket
    await bucket.create({
      location: 'US', // or 'asia-southeast1' for Asia
    });
    
    console.log('✅ Storage bucket created successfully:', bucketName);
    
  } catch (error) {
    console.error('❌ Error creating bucket:', error.message);
    console.log('ℹ️ You may need to create the bucket manually in Firebase Console');
    console.log('ℹ️ Go to: https://console.firebase.google.com/project/translatorwebsite-d753a/storage');
  }
}

createBucket().then(() => {
  console.log('🏁 Bucket creation process completed');
  process.exit(0);
});
