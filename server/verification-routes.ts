import express from 'express';
import { storage } from './firebase-storage';
import { auth, isIndonesianStudentEmail, isChineseUniversityEmail, isStudentEmail, getUserByEmail, createUserAndSendVerification, isEmailVerified, markEmailAsVerified, verifyEmailToken } from './auth';
import multer from 'multer';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Google Sign-In endpoint
router.post('/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Verify the Google ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;
    
    // Check if email is from Indonesian student or Chinese university
    const isStudentEmailType = email ? isStudentEmail(email) : false;
    const emailType = email ? 
      (isIndonesianStudentEmail(email) ? 'indonesian_student' : 
       isChineseUniversityEmail(email) ? 'chinese_university' : 'other') : 'other';
    
    // Create or update user in Firebase
    let user;
    try {
      user = await auth.getUser(uid);
    } catch (error) {
      // User doesn't exist, create new one
      user = await auth.createUser({
        uid,
        email,
        displayName: name,
        photoURL: picture,
      });
    }
    
    // Store additional user data in Firestore
    await storage.createUser({
      username: email || uid,
      password: '', // Not needed for Google Sign-In
      googleId: uid,
      email,
      profileImage: picture,
      role: 'translator'
    });
    
    res.json({
      success: true,
      user: {
        id: uid,
        email,
        name,
        picture,
        isStudentEmail: isStudentEmailType,
        emailType
      }
    });
  } catch (error) {
    console.error('Google Sign-In error:', error);
    res.status(400).json({ error: 'Invalid token' });
  }
});

// Create new translator application
router.post('/applications/translator', async (req, res) => {
  try {
    const applicationData = req.body;
    
    // Validate required fields
    if (!applicationData.name || !applicationData.email || !applicationData.intent) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if email is already registered
    const existingProviders = await storage.getServiceProviders({ email: applicationData.email });
    if (existingProviders.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create application first
    const application = await storage.createApplication(applicationData);
    
    // Create Firebase user and send verification email
    try {
      const { uid, emailSent } = await createUserAndSendVerification(
        applicationData.email, 
        applicationData.name, 
        application.id
      );
      
      // Update application with Firebase UID
      await storage.updateApplicationEmailVerification(application.id, uid);
      
      console.log(`📧 Firebase verification email ${emailSent ? 'sent' : 'attempted'} to ${applicationData.email}`);
      
      res.json({
        ...application,
        emailVerificationSent: emailSent,
        message: emailSent ? 'Please check your email to verify your account' : 'Account created successfully'
      });
    } catch (userError: any) {
      console.error('Failed to create Firebase user or send verification:', userError);
      res.status(400).json({ 
        error: userError.message || 'Failed to send verification email',
        application: application
      });
    }
  } catch (error) {
    console.error('Error creating translator application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Email verification endpoint (handles token verification)
router.get('/verify-email', async (req, res) => {
  try {
    const { token, applicationId } = req.query;
    
    if (!token || !applicationId) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Verification Failed</h1>
            <p>Invalid verification link. Token or Application ID is missing.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Verify the token
    const result = await verifyEmailToken(token as string, applicationId as string);
    
    if (!result.success) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ ${result.message}</h1>
            <p>Please try requesting a new verification email.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Update application verification status
    await storage.updateApplicationEmailVerification(applicationId as string);
    
    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified Successfully</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 0; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 500px; 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
          }
          .success { color: #059669; font-size: 24px; margin-bottom: 20px; font-weight: 600; }
          .celebration { font-size: 64px; margin-bottom: 20px; }
          .message { color: #64748b; line-height: 1.6; margin-bottom: 30px; }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 600; 
            transition: all 0.3s ease;
          }
          .button:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="celebration">🎉</div>
          <h1 class="success">✅ Email Verified Successfully!</h1>
          <p class="message">
            Congratulations! Your student email has been verified. 
            You can now continue with the registration process by uploading your documents and introduction video.
          </p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/translator/signup?step=2&applicationId=${applicationId}" class="button">
            Continue Registration
          </a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing email verification:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Verification Error</h1>
          <p>An error occurred while processing your email verification.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Email verification success callback
router.get('/verify-success', async (req, res) => {
  try {
    const { applicationId } = req.query;
    
    if (!applicationId) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
            .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
            .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">❌ Verification Failed</h1>
            <p>Application ID not found.</p>
          </div>
        </body>
        </html>
      `);
    }
    
    // Get application details
    const application = await storage.getApplication(applicationId as string);
    if (!application) {
      return res.status(404).send('Application not found');
    }
    
    // Type assertion to access firebaseUid
    const firebaseApp = application as any;
    
    // Check if Firebase user is verified
    if (firebaseApp.firebaseUid) {
      const verified = await isEmailVerified(firebaseApp.firebaseUid);
      
      if (verified) {
        // Mark email as verified in our system
        await markEmailAsVerified(firebaseApp.firebaseUid);
        await storage.updateApplicationEmailVerification(applicationId as string);
      }
    }
    
    // Return success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Email Verified Successfully</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 0; 
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container { 
            max-width: 500px; 
            background: white; 
            padding: 40px; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
          }
          .success { color: #059669; font-size: 24px; margin-bottom: 20px; font-weight: 600; }
          .celebration { font-size: 64px; margin-bottom: 20px; }
          .message { color: #64748b; line-height: 1.6; margin-bottom: 30px; }
          .button { 
            display: inline-block; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 16px 32px; 
            text-decoration: none; 
            border-radius: 12px; 
            font-weight: 600; 
            transition: all 0.3s ease;
          }
          .button:hover { transform: translateY(-2px); }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="celebration">🎉</div>
          <h1 class="success">✅ Email Verified Successfully!</h1>
          <p class="message">
            Congratulations! Your student email has been verified using Firebase Authentication. 
            You can now continue with the registration process by uploading your documents and introduction video.
          </p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/translator/signup?step=2&applicationId=${applicationId}" class="button">
            Continue Registration
          </a>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing email verification:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Verification Error</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; background: #f8fafc; }
          .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
          .error { color: #dc2626; font-size: 20px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="error">❌ Verification Error</h1>
          <p>An error occurred while processing your email verification.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Resend verification email (updated)
router.post('/applications/:id/resend-verification', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await storage.getApplication(id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Type assertion to access firebaseUid
    const firebaseApp = application as any;
    
    // Check if already verified
    if (firebaseApp.firebaseUid && await isEmailVerified(firebaseApp.firebaseUid)) {
      return res.status(400).json({ error: 'Email already verified' });
    }
    
    // Resend verification email
    try {
      const { uid, emailSent } = await createUserAndSendVerification(
        application.email,
        application.name,
        id
      );
      
      // Update application with Firebase UID if not exists
      if (!firebaseApp.firebaseUid) {
        await storage.updateApplicationEmailVerification(id, uid);
      }
      
      if (emailSent) {
        res.json({ success: true, message: 'Verification email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send verification email' });
      }
    } catch (error: any) {
      console.error('Error resending verification email:', error);
      res.status(500).json({ error: error.message || 'Failed to send verification email' });
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Upload student ID document
router.post('/applications/:id/upload/student-id', upload.single('studentId'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Upload to Firebase Storage
    const fileName = `student-ids/${id}-${Date.now()}-${file.originalname}`;
    const storageRef = ref(getStorage(), fileName);
    
    await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update application with student ID document
    await storage.updateStudentDocument(id, downloadURL);
    
    res.json({
      success: true,
      message: 'Student ID document uploaded successfully',
      documentUrl: downloadURL
    });
  } catch (error) {
    console.error('Error uploading student ID:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Upload HSK certificate
router.post('/applications/:id/upload/hsk', upload.single('hskCertificate'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const fileName = `hsk-certificates/${id}-${Date.now()}-${file.originalname}`;
    const storageRef = ref(getStorage(), fileName);
    
    await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(storageRef);
    
    await storage.updateHskCertificate(id, downloadURL);
    
    res.json({
      success: true,
      message: 'HSK certificate uploaded successfully',
      certificateUrl: downloadURL
    });
  } catch (error) {
    console.error('Error uploading HSK certificate:', error);
    res.status(500).json({ error: 'Failed to upload certificate' });
  }
});

// Upload intro video
router.post('/applications/:id/upload/intro-video', upload.single('introVideo'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Validate file type (video)
    if (!file.mimetype.startsWith('video/')) {
      return res.status(400).json({ error: 'File must be a video' });
    }
    
    const fileName = `intro-videos/${id}-${Date.now()}-${file.originalname}`;
    const storageRef = ref(getStorage(), fileName);
    
    await uploadBytes(storageRef, file.buffer);
    const downloadURL = await getDownloadURL(storageRef);
    
    await storage.updateIntroVideo(id, downloadURL);
    
    res.json({
      success: true,
      message: 'Intro video uploaded successfully',
      videoUrl: downloadURL
    });
  } catch (error) {
    console.error('Error uploading intro video:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Verify email
router.post('/applications/:id/verify-email', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProvider = await storage.verifyEmail(id);
    
    res.json({
      success: true,
      provider: updatedProvider
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Get application status
router.get('/applications/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const application = await storage.getApplication(id);
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error getting application status:', error);
    res.status(500).json({ error: 'Failed to get application status' });
  }
});

// Admin routes for review
router.get('/admin/applications/pending', async (req, res) => {
  try {
    const applications = await storage.getApplications('pending');
    res.json(applications);
  } catch (error) {
    console.error('Error getting pending applications:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Admin approve application
router.post('/admin/applications/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    await storage.approveApplication(id, adminNotes);
    
    res.json({
      success: true,
      message: 'Application approved successfully'
    });
  } catch (error) {
    console.error('Error approving application:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// Admin reject application
router.post('/admin/applications/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    await storage.rejectApplication(id, adminNotes);
    
    res.json({
      success: true,
      message: 'Application rejected'
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

export default router;
