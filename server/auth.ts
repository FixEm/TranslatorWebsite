import 'dotenv/config';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import crypto from 'crypto';
import { sendVerificationEmail } from './email-service';
import { sendClientVerificationEmail } from './email-service-client';

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
    emailVerified: 25,
    studentIdUploaded: 20,
    hskUploaded: 25,
    cvUploaded: 20,
    introVideoUploaded: 10,
    adminApproved: 0  // Admin approval doesn't add points, but is required for activation
  };
  
  let score = 0;
  Object.entries(verificationSteps).forEach(([step, completed]) => {
    if (completed && steps[step as keyof typeof steps]) {
      score += steps[step as keyof typeof steps];
    }
  });
  
  return Math.min(score, 100);
}

// Helper function to check if account should be activated
export function isAccountActivated(verificationSteps: any): boolean {
  // Account is only activated when admin approves, regardless of point total
  return Boolean(verificationSteps?.adminApproved);
}

// Helper function to check if account is ready for admin review
export function isReadyForReview(verificationSteps: any): boolean {
  const completenessScore = calculateCompletenessScore(verificationSteps);
  // Ready for review when has enough points and all required documents are uploaded
  return completenessScore >= 80 && !verificationSteps?.adminApproved;
}

// Create Firebase user and send email verification with token
export async function createUserAndSendVerification(email: string, name: string, applicationId: string): Promise<{ uid: string; emailSent: boolean }> {
  try {
    // Check if it's a student email
    if (!isStudentEmail(email)) {
      throw new Error("Silakan gunakan email mahasiswa Anda (@student.ac.id atau @edu.cn) untuk verifikasi.");
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
        throw new Error('Gagal mengirim email verifikasi');
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
      return { success: false, message: 'Token verifikasi tidak valid' };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Check if token has expired
    if (data.expiresAt.toDate() < new Date()) {
      return { success: false, message: 'Token verifikasi telah kedaluwarsa' };
    }
    
    // Check if already verified
    if (data.verified) {
      return { success: false, message: 'Email sudah diverifikasi' };
    }
    
    // Mark as verified
    await markEmailAsVerified(doc.id);
    
    return { 
      success: true, 
      uid: doc.id,
      message: 'Email berhasil diverifikasi' 
    };
  } catch (error) {
    console.error('Error verifying email token:', error);
    return { success: false, message: 'Gagal memverifikasi email' };
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

// Create Firebase user for clients (no student email requirement) and send verification email
export async function createUserWithoutStudentEmailCheck(
  email: string,
  name: string,
  applicationId: string
): Promise<{ uid: string; emailSent: boolean }> {
  try {
    const tempPassword = Math.random().toString(36).slice(-8) +
      Math.random().toString(36).slice(-8) + '!A1';

    const userRecord = await auth.createUser({
      email,
      password: tempPassword,
      displayName: name,
      emailVerified: false,
    });

    const verificationToken = crypto.randomBytes(32).toString('hex');

    await db.collection('email_verifications').doc(userRecord.uid).set({
      email,
      applicationId,
      verified: false,
      verificationToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    const emailSent = await sendClientVerificationEmail(
      email,
      name,
      verificationToken,
      applicationId
    );

    return { uid: userRecord.uid, emailSent };
  } catch (error: any) {
    // If user already exists, try to resend verification if not verified
    if (error.code === 'auth/email-already-in-use') {
      const existing = await auth.getUserByEmail(email);
      if (!existing.emailVerified) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await db.collection('email_verifications').doc(existing.uid).set({
          email,
          applicationId,
          verified: false,
          verificationToken,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        const emailSent = await sendClientVerificationEmail(
          email,
          name,
          verificationToken,
          applicationId
        );
        return { uid: existing.uid, emailSent };
      }
      return { uid: existing.uid, emailSent: false };
    }
    throw error;
  }
}
