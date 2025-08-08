import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { sendVerificationEmail } from './email-service';

// Initialize Firebase Admin if not already initialized
if (!getApps().length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

export const auth = getAuth();
export const db = getFirestore();

// Email validation patterns
export const emailPatterns = {
  studentAcId: /@student\.ac\.id$/,
  eduCn: /\.edu\.cn$/,
  indonesianUniversities: /@(ui\.ac\.id|ugm\.ac\.id|itb\.ac\.id|unair\.ac\.id|undip\.ac\.id|student\.ac\.id)$/,
  chineseUniversities: /@(tsinghua\.edu\.cn|pku\.edu\.cn|fudan\.edu\.cn|sjtu\.edu\.cn|zju\.edu\.cn|nju\.edu\.cn|ustc\.edu\.cn|hit\.edu\.cn|xjtu\.edu\.cn|nwpu\.edu\.cn|buaa\.edu\.cn|bit\.edu\.cn|bnu\.edu\.cn|ruc\.edu\.cn|cuhk\.edu\.cn|hku\.edu\.cn)$/
};

// Helper function to check if email is from Indonesian student
export function isIndonesianStudentEmail(email: string): boolean {
  return emailPatterns.studentAcId.test(email) || 
         emailPatterns.indonesianUniversities.test(email);
}

// Helper function to check if email is from Chinese university
export function isChineseUniversityEmail(email: string): boolean {
  return emailPatterns.eduCn.test(email) || 
         emailPatterns.chineseUniversities.test(email);
}

// Helper function to check if email is from any recognized student/university
export function isStudentEmail(email: string): boolean {
  return isIndonesianStudentEmail(email) || isChineseUniversityEmail(email);
}

// Helper function to calculate profile completeness
export function calculateCompletenessScore(verificationSteps: any): number {
  const steps = {
    emailVerified: 30,
    studentIdUploaded: 20,
    hskUploaded: 15,
    introVideoUploaded: 20,
    adminApproved: 15
  };
  
  let score = 0;
  Object.entries(verificationSteps).forEach(([step, completed]) => {
    if (completed && steps[step as keyof typeof steps]) {
      score += steps[step as keyof typeof steps];
    }
  });
  
  return Math.min(score, 100);
}

// Create Firebase user and send email verification with token
export async function createUserAndSendVerification(email: string, name: string, applicationId: string): Promise<{ uid: string; emailSent: boolean }> {
  try {
    // Check if it's a student email
    if (!isStudentEmail(email)) {
      throw new Error("Please use your student email (@student.ac.id or @edu.cn) for verification.");
    }

    // Generate a secure password for the user
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + '!A1';
    
    // Create user account using Firebase Admin
    const userRecord = await auth.createUser({
      email: email,
      password: tempPassword,
      displayName: name,
      emailVerified: false,
    });
    
    console.log(`✅ Firebase user created: ${userRecord.uid} for ${email}`);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Store verification info in Firestore for tracking
    await db.collection('email_verifications').doc(userRecord.uid).set({
      email,
      applicationId,
      verified: false,
      verificationToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });
    
    // Send verification email using nodemailer
    const emailSent = await sendVerificationEmail(email, name, verificationToken, applicationId);
    
    return {
      uid: userRecord.uid,
      emailSent
    };
  } catch (error: any) {
    console.error('Error creating user or sending verification:', error);
    
    // If user already exists, try to send verification email
    if (error.code === 'auth/email-already-in-use') {
      try {
        const userRecord = await auth.getUserByEmail(email);
        
        if (!userRecord.emailVerified) {
          // Generate new verification token
          const verificationToken = crypto.randomBytes(32).toString('hex');
          
          // Update verification info
          await db.collection('email_verifications').doc(userRecord.uid).set({
            email,
            applicationId,
            verified: false,
            verificationToken,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
          });
          
          // Send verification email
          const emailSent = await sendVerificationEmail(email, name, verificationToken, applicationId);
          
          return {
            uid: userRecord.uid,
            emailSent
          };
        }
        
        return {
          uid: userRecord.uid,
          emailSent: false // Already verified
        };
      } catch (adminError) {
        console.error('Error handling existing user:', adminError);
        throw new Error('Failed to send verification email');
      }
    }
    
    throw error;
  }
}

// Verify email token
export async function verifyEmailToken(token: string, applicationId: string): Promise<{ success: boolean; uid?: string; message: string }> {
  try {
    // Find verification record by token
    const snapshot = await db.collection('email_verifications')
      .where('verificationToken', '==', token)
      .where('applicationId', '==', applicationId)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return { success: false, message: 'Invalid verification token' };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Check if token has expired
    if (data.expiresAt.toDate() < new Date()) {
      return { success: false, message: 'Verification token has expired' };
    }
    
    // Check if already verified
    if (data.verified) {
      return { success: false, message: 'Email already verified' };
    }
    
    // Mark as verified
    await markEmailAsVerified(doc.id);
    
    return { 
      success: true, 
      uid: doc.id,
      message: 'Email verified successfully' 
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return { success: false, message: 'Failed to verify email' };
  }
}

// Check if email is verified using Firebase Auth
export async function isEmailVerified(uid: string): Promise<boolean> {
  try {
    const userRecord = await auth.getUser(uid);
    return userRecord.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
}

// Mark email as verified and update application
export async function markEmailAsVerified(uid: string): Promise<void> {
  try {
    // Update Firebase user record
    await auth.updateUser(uid, {
      emailVerified: true
    });
    
    // Update verification record
    await db.collection('email_verifications').doc(uid).update({
      verified: true,
      verifiedAt: new Date()
    });
    
    console.log(`✅ Email marked as verified for user: ${uid}`);
  } catch (error) {
    console.error('Error marking email as verified:', error);
    throw error;
  }
}

// Get user by email
export async function getUserByEmail(email: string): Promise<any> {
  try {
    const userRecord = await auth.getUserByEmail(email);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return null;
    }
    throw error;
  }
}
