import type { Express } from "express";
import { createServer, type Server } from "http";
import { FirebaseStorage } from "./firebase-storage";
import { insertApplicationSchema, insertContactSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import verificationRoutes from "./verification-routes";
import { auth, getUserByEmail, createUserAndSendVerification, calculateCompletenessScore, isAccountActivated, isReadyForReview } from "./auth";
import { sendVerificationEmail } from "./email-service";

// Create Firebase storage instance
const storage = new FirebaseStorage();

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all service providers with optional filters
  app.get("/api/service-providers", async (req, res) => {
    try {
      console.log("📡 API called: /api/service-providers");
      const { city, services, minRating } = req.query;
      
      const filters: any = {};
      if (city) filters.city = city as string;
      if (services) filters.services = (services as string).split(',');
      if (minRating) filters.minRating = parseFloat(minRating as string);
      
      console.log("🔍 Filters:", filters);
      const providers = await storage.getServiceProviders(filters);
      console.log("🔥 Firebase returned providers:", providers.length);
      res.json(providers);
    } catch (error) {
      console.error("❌ Error fetching providers:", error);
      res.status(500).json({ message: "Failed to fetch service providers" });
    }
  });

  // Get single service provider
  app.get("/api/service-providers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await storage.getServiceProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Service provider not found" });
      }
      
      res.json(provider);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service provider" });
    }
  });

  // Create new application (JSON endpoint without files)
  app.post("/api/applications/submit", async (req, res) => {
    try {
      console.log('📥 [JSON APPLICATION] Request body received:', {
        ...req.body,
        password: req.body.password ? '[HIDDEN]' : 'NO PASSWORD'
      });
      
      // First validate the raw data (including password confirmation)
      console.log('🔍 [JSON APPLICATION] Validating raw data...');
      
      try {
        const rawValidation = insertApplicationSchema.parse(req.body);
        console.log('✅ [JSON APPLICATION] Raw validation successful');
      } catch (validationError) {
        console.log('❌ [JSON APPLICATION] Raw validation failed:', validationError);
        if (validationError && typeof validationError === 'object' && 'issues' in validationError) {
          const issues = (validationError as any).issues;
          console.log('🔍 [JSON APPLICATION] Validation issues:', JSON.stringify(issues, null, 2));
          return res.status(400).json({ 
            message: "Validation error", 
            errors: issues.map((issue: any) => ({
              field: issue.path?.join('.'),
              message: issue.message,
              code: issue.code
            }))
          });
        }
        throw validationError;
      }
      
      // Hash password after validation
      let hashedPassword = undefined;
      if (req.body.password) {
        hashedPassword = await bcrypt.hash(req.body.password, 10);
      }
      
      const applicationData = {
        ...req.body,
        password: hashedPassword,
        // Ensure intent is properly set from the request
        intent: req.body.intent || 'translator',
        profileImage: null, // No files in this endpoint
        identityDocument: null,
        certificates: []
      };

      console.log('📝 [JSON APPLICATION] Application data being saved:', {
        ...applicationData,
        password: applicationData.password ? '[HASHED]' : 'NO PASSWORD',
        intent: applicationData.intent
      });

      // Remove confirmPassword from data before saving to database
      delete applicationData.confirmPassword;
      
      const application = await storage.createApplication(applicationData);
      
      // Create Firebase user and send verification email
      try {
        const { createUserAndSendVerification } = await import('./auth');
        const { uid, emailSent } = await createUserAndSendVerification(
          applicationData.email, 
          applicationData.name, 
          application.id
        );
        
        // Update application with Firebase UID
        await storage.updateApplicationEmailVerification(application.id, uid);
        
        console.log(`📧 Email verifikasi Firebase ${emailSent ? 'terkirim' : 'dicoba kirim'} ke ${applicationData.email}`);
        
        res.status(201).json({
          ...application,
          emailVerificationSent: emailSent,
          message: emailSent ? 'Silakan cek email Anda untuk verifikasi akun' : 'Akun berhasil dibuat'
        });
      } catch (userError: any) {
        console.error('Gagal membuat pengguna Firebase atau mengirim verifikasi:', userError);
        res.status(201).json({ 
          ...application,
          emailVerificationSent: false,
          message: 'Akun berhasil dibuat tetapi gagal mengirim email verifikasi'
        });
      }
    } catch (error) {
      console.log('❌ [JSON APPLICATION] Error:', error);
      if (error && typeof error === 'object' && 'errors' in error) {
        return res.status(400).json({ message: "Validation error", errors: (error as any).errors });
      }
      res.status(500).json({ message: "Failed to create application" });
    }
  });

  // Create new application with file uploads (multipart form data)
  app.post("/api/applications", upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'identityDocument', maxCount: 1 },
    { name: 'certificates', maxCount: 5 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Parse services from form data
      const services = req.body.services ? JSON.parse(req.body.services) : [];
      
      const applicationData = {
        ...req.body,
        services,
        pricePerDay: req.body.pricePerDay,
        profileImage: files?.profileImage?.[0]?.path,
        identityDocument: files?.identityDocument?.[0]?.path,
        certificates: files?.certificates?.map(file => file.path) || []
      };

      const validated = insertApplicationSchema.parse(applicationData);
      const application = await storage.createApplication(validated);
      
      res.status(201).json(application);
    } catch (error) {
      console.error('Application creation error:', error);
      res.status(400).json({ message: "Invalid application data" });
    }
  });

  // Create new translator application (with password support)
  app.post("/api/applications/translator", upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'identityDocument', maxCount: 1 },
    { name: 'certificates', maxCount: 5 }
  ]), async (req, res) => {
    try {
      console.log('📥 [TRANSLATOR] Request body received:', {
        ...req.body,
        password: req.body.password ? '[HIDDEN]' : 'NO PASSWORD'
      });
      
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      // Parse services from form data safely
      let services = [];
      if (req.body.services) {
        try {
          if (typeof req.body.services === 'string') {
            services = JSON.parse(req.body.services);
          } else if (Array.isArray(req.body.services)) {
            services = req.body.services;
          }
        } catch (parseError) {
          console.warn('⚠️ [TRANSLATOR] Failed to parse services, using empty array:', req.body.services);
          services = [];
        }
      }
      
      console.log('📋 [TRANSLATOR] Services parsed:', services);
      
      // Hash password if provided
      let hashedPassword = undefined;
      if (req.body.password) {
        console.log('🔒 [TRANSLATOR] Original password:', req.body.password);
        hashedPassword = await bcrypt.hash(req.body.password, 10);
        console.log('🔒 [TRANSLATOR] Hashed password:', hashedPassword);
      }
      
      const applicationData = {
        ...req.body,
        password: hashedPassword, // Store hashed password
        services,
        intent: req.body.selectedRole || req.body.intent || 'translator', // Use selected role from frontend
        pricePerDay: req.body.pricePerDay,
        profileImage: files?.profileImage?.[0]?.path,
        identityDocument: files?.identityDocument?.[0]?.path,
        certificates: files?.certificates?.map(file => file.path) || []
      };

      console.log('📝 [TRANSLATOR] Application data being saved:', {
        ...applicationData,
        password: applicationData.password ? '[HASHED]' : 'NO PASSWORD'
      });

      // Remove confirmPassword from data before saving
      delete applicationData.confirmPassword;

      const application = await storage.createApplication(applicationData);
      
      // Create Firebase Auth user and send verification email if password was provided
      if (req.body.password && req.body.email) {
        try {
          const { uid, emailSent } = await createUserAndSendVerification(
            req.body.email,
            req.body.name,
            application.id
          );

          console.log('✅ [TRANSLATOR] Firebase user created:', uid, 'for', req.body.email);

          // Store the Firebase UID in the application
          await storage.updateApplicationEmailVerification(application.id, uid);

          if (emailSent) {
            console.log('📧 [TRANSLATOR] Email verifikasi terkirim ke', req.body.email);
          } else {
            console.log('📧 [TRANSLATOR] Email sudah diverifikasi sebelumnya');
          }
          
        } catch (firebaseError: any) {
          console.error('❌ [TRANSLATOR] Firebase user creation failed:', firebaseError.message);
          
          // Continue with application creation even if Firebase fails
          if (firebaseError.code === 'auth/email-already-in-use') {
            console.log('📧 [TRANSLATOR] Email already exists in Firebase, linking to existing user');
            try {
              const existingUser = await getUserByEmail(req.body.email);
              if (existingUser) {
                await storage.updateApplicationEmailVerification(application.id, existingUser.uid);
              }
            } catch (linkError) {
              console.error('❌ [TRANSLATOR] Failed to link existing user:', linkError);
            }
          }
        }
      }
      
      res.status(201).json({ 
        success: true, 
        application,
        message: 'Aplikasi penerjemah berhasil dikirim! Silakan periksa email untuk verifikasi.'
      });
    } catch (error) {
      console.error('❌ [TRANSLATOR] Application creation error:', error);
      res.status(500).json({ message: "Gagal mengirim aplikasi penerjemah" });
    }
  });

  // Get translator application by email
  app.get("/api/applications/translator", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ message: "Email parameter is required" });
      }
      
      const applications = await storage.getApplications();
      const application = applications.find(app => app.email === email);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      res.json(application);
    } catch (error) {
      console.error('❌ Error fetching translator application:', error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Get applications (for admin)
  app.get("/api/applications", async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getApplications(status as string);
      console.log('🔍 Applications from Firebase:', JSON.stringify(applications, null, 2));
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get verified users (applications with approved status and isVerified flag)
  app.get("/api/applications/verified", async (req, res) => {
    try {
      console.log("📡 API called: /api/applications/verified");
      const allApplications = await storage.getApplications();
      
      // Filter for verified applications (approved status and admin approved)
      const verifiedUsers = allApplications.filter(app => {
        const verificationSteps = app.verificationSteps as any || {};
        return app.status === 'approved' && verificationSteps.adminApproved === true;
      });
      
      console.log(`🔥 Found ${verifiedUsers.length} verified users from ${allApplications.length} total applications`);
      res.json(verifiedUsers);
    } catch (error) {
      console.error("❌ Error fetching verified users:", error);
      res.status(500).json({ message: "Failed to fetch verified users" });
    }
  });

  // Update application status (approve/reject)
  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      console.log("🔄 UPDATE APPLICATION STATUS:", { id: req.params.id, status: req.body.status });
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['approved', 'rejected', 'pending', 'needs_changes'].includes(status)) {
        console.log("❌ Invalid status:", status);
        return res.status(400).json({ message: "Invalid status" });
      }
      
      console.log("🔍 Updating application status...");
      const application = await storage.updateApplicationStatus(id, status);
      
      if (!application) {
        console.log("❌ Application not found:", id);
        return res.status(404).json({ message: "Application not found" });
      }
      
      console.log("✅ Application status updated:", application);
      
      // If approved, create service provider (only if not already created)
      if (status === 'approved') {
        console.log("🎯 Creating service provider for approved application...");
        
        // Check if service provider already exists
        const existingProviders = await storage.getServiceProviders({ email: application.email });
        if (existingProviders.length === 0) {
          const providerData = {
            name: application.name,
            email: application.email,
            whatsapp: application.whatsapp,
            city: application.city,
            services: Array.isArray(application.services) ? application.services : [],
            experience: application.experience,
            pricePerDay: application.pricePerDay,
            description: application.description,
            languages: [], // Default empty, can be updated later
            profileImage: application.profileImage,
            identityDocument: application.identityDocument,
            certificates: Array.isArray(application.certificates) ? application.certificates : [],
            introVideo: application.introVideo, // Include intro video URL
            intent: (application.intent || 'translator') as 'translator' | 'tour_guide' | 'both',
          };
          
          console.log("📝 Provider data:", providerData);
          await storage.createServiceProvider(providerData);
          console.log("✅ Service provider created successfully");
        } else {
          console.log("ℹ️ Service provider already exists, skipping creation");
        }
      }
      
      res.json(application);
    } catch (error) {
      console.error("❌ Error updating application status:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ message: "Failed to update application status", error: errorMessage });
    }
  });

  // Final approval endpoint (sets adminApproved to true)
  app.patch("/api/applications/:id/final-approval", async (req, res) => {
    try {
      console.log("🎯 FINAL APPROVAL:", { id: req.params.id });
      const { id } = req.params;
      
      // Get the current application to update verificationSteps properly
      console.log("🔄 Getting current application data...");
      const currentApp = await storage.getApplication(id);
      if (!currentApp) {
        console.log("❌ Application not found:", id);
        return res.status(404).json({ message: "Application not found" });
      }
      
      console.log("📋 Current verificationSteps:", currentApp.verificationSteps);
      
      // Update verificationSteps with adminApproved
      const updatedVerificationSteps = {
        ...(currentApp as any).verificationSteps,
        adminApproved: true
      };
      
      console.log("🔄 Updating all fields in a single operation...");
      
      // Update all fields using the existing updateApplicationField method
      await storage.updateApplicationField(id, 'verificationSteps', updatedVerificationSteps);
      await storage.updateApplicationField(id, 'finalStatus', 'approved');
      await storage.updateApplicationField(id, 'recruitmentStatus', 'accepted');
      await storage.updateApplicationField(id, 'status', 'approved');
      
      console.log("✅ All fields updated successfully");
      
      // Get the updated application to return
      const updatedApplication = await storage.getApplication(id);
      
      console.log("✅ Final approval completed for:", updatedApplication?.email);
      res.json({ message: "Application finally approved", application: updatedApplication });
    } catch (error) {
      console.error("❌ Error in final approval:", error);
      res.status(500).json({ message: "Failed to process final approval" });
    }
  });

  // Update recruitment status endpoint
  app.patch("/api/applications/:id/recruitment-status", async (req, res) => {
    try {
      console.log("🎯 UPDATE RECRUITMENT STATUS:", { id: req.params.id, status: req.body.recruitmentStatus });
      const { id } = req.params;
      const { recruitmentStatus } = req.body;
      
      if (!['pending', 'approved', 'rejected'].includes(recruitmentStatus)) {
        console.log("❌ Invalid recruitment status:", recruitmentStatus);
        return res.status(400).json({ message: "Invalid recruitment status" });
      }
      
      // Update recruitment status
      await storage.updateApplicationField(id, 'recruitmentStatus', recruitmentStatus);
      
      // If approved, also set adminApproved to true in verificationSteps
      if (recruitmentStatus === 'approved') {
        const currentApp = await storage.getApplication(id);
        const currentVerificationSteps = (currentApp as any)?.verificationSteps || {};
        
        await storage.updateApplicationField(id, 'verificationSteps', {
          ...currentVerificationSteps,
          adminApproved: true
        });
        console.log("✅ Set adminApproved to true for approved candidate");
      }
      
      // Get the updated application to return
      const updatedApplication = await storage.getApplication(id);
      
      console.log("✅ Recruitment status updated for:", updatedApplication?.email);
      res.json({ message: "Recruitment status updated", application: updatedApplication });
    } catch (error) {
      console.error("❌ Error updating recruitment status:", error);
      res.status(500).json({ message: "Failed to update recruitment status" });
    }
  });

  // Revoke verification for an application
  app.patch("/api/applications/:id/revoke-verification", async (req, res) => {
    try {
      console.log("🚫 REVOKE VERIFICATION:", { id: req.params.id });
      const { id } = req.params;
      
      // Get the current application to update verificationSteps properly
      console.log("🔄 Getting current application data...");
      const currentApp = await storage.getApplication(id);
      if (!currentApp) {
        console.log("❌ Application not found:", id);
        return res.status(404).json({ message: "Application not found" });
      }
      
      console.log("📋 Current application status:", {
        name: currentApp.name,
        status: currentApp.status,
        finalStatus: (currentApp as any).finalStatus,
        recruitmentStatus: (currentApp as any).recruitmentStatus
      });
      
      // Update verificationSteps to revoke admin approval
      const updatedVerificationSteps = {
        ...(currentApp as any).verificationSteps,
        adminApproved: false
      };
      
      console.log("🔄 Revoking verification and clearing accept/reject status...");
      
      // Update all fields to revoke verification and reset accept/reject status
      console.log("🔄 Updating verificationSteps...");
      await storage.updateApplicationField(id, 'verificationSteps', updatedVerificationSteps);
      console.log("✅ verificationSteps updated");
      
      console.log("🔄 Updating finalStatus to pending...");
      await storage.updateApplicationField(id, 'finalStatus', 'pending'); // Clear approved/rejected status
      console.log("✅ finalStatus updated");
      
      console.log("🔄 Updating recruitmentStatus to pending_interview...");
      await storage.updateApplicationField(id, 'recruitmentStatus', 'pending_interview'); // Reset to initial recruitment stage
      console.log("✅ recruitmentStatus updated");
      
      console.log("🔄 Updating status to approved...");
      await storage.updateApplicationField(id, 'status', 'approved'); // Keep basic approval but remove final decision
      console.log("✅ status updated");
      
      console.log("✅ Verification revoked successfully");
      
      // Get the updated application to return
      const updatedApplication = await storage.getApplication(id);
      
      console.log("✅ Verification revoked for:", updatedApplication?.email);
      res.json({ message: "Verification revoked successfully", application: updatedApplication });
    } catch (error) {
      console.error("❌ Error revoking verification:", error);
      res.status(500).json({ message: "Failed to revoke verification" });
    }
  });

  // Request changes for specific documents
  app.patch("/api/applications/:id/request-changes", async (req, res) => {
    try {
      console.log("📝 REQUEST CHANGES:", { id: req.params.id, changes: req.body.changes });
      const { id } = req.params;
      const { changes, message } = req.body;
      
      if (!changes || !Array.isArray(changes) || changes.length === 0) {
        return res.status(400).json({ message: "Changes array is required" });
      }
      
      // Get the current application
      const currentApp = await storage.getApplication(id);
      if (!currentApp) {
        console.log("❌ Application not found:", id);
        return res.status(404).json({ message: "Application not found" });
      }
      
      console.log("📋 Current application:", {
        name: currentApp.name,
        email: currentApp.email
      });
      
      // Delete files from Firebase Storage for requested documents
      console.log("🗑️ Deleting files from storage for requested changes...");
      try {
        await storage.deleteApplicationDocuments(id, changes);
        console.log("✅ Files deleted successfully");
      } catch (deleteError) {
        console.error("⚠️ Error deleting files (continuing anyway):", deleteError);
        // Continue even if file deletion fails - the important part is the change request
      }
      
      // Create change requests object
      const changeRequests = {
        requests: changes.map((change: string) => ({
          type: change,
          message: message || `Please resubmit your ${
            change === 'hsk' ? 'HSK Certificate' : 
            change === 'studentId' ? 'Student ID Document' : 
            change === 'cv' ? 'CV/Resume' : 'document'
          }`,
          requestedAt: new Date().toISOString(),
          status: 'pending'
        })),
        createdAt: new Date().toISOString()
      };
      
      // Update verificationSteps to mark requested documents as needing changes and reset upload status
      const updatedVerificationSteps = {
        ...(currentApp as any).verificationSteps
      };
      
      changes.forEach((change: string) => {
        if (change === 'hsk') {
          updatedVerificationSteps.hskStatus = 'changes_requested';
          updatedVerificationSteps.hskUploaded = false; // Reset upload status
        } else if (change === 'studentId') {
          updatedVerificationSteps.studentIdStatus = 'changes_requested';
          updatedVerificationSteps.studentIdUploaded = false; // Reset upload status
        } else if (change === 'cv') {
          updatedVerificationSteps.cvStatus = 'changes_requested';
          updatedVerificationSteps.cvUploaded = false; // Reset upload status
        }
      });
      
      console.log("🔄 Updating verification steps and change requests...");
      await storage.updateApplicationField(id, 'verificationSteps', updatedVerificationSteps);
      await storage.updateApplicationField(id, 'changeRequests', changeRequests);
      
      console.log("✅ Change requests created successfully");
      
      // Get the updated application to return
      const updatedApplication = await storage.getApplication(id);
      
      res.json({ 
        message: "Change requests sent successfully", 
        application: updatedApplication,
        changeRequests 
      });
    } catch (error) {
      console.error("❌ Error creating change requests:", error);
      res.status(500).json({ message: "Failed to create change requests" });
    }
  });

  // Update HSK level
  app.put("/api/applications/:id/hsk-level", async (req, res) => {
    try {
      console.log("📚 Updating HSK level:", { id: req.params.id, hskLevel: req.body.hskLevel });
      const { id } = req.params;
      const { hskLevel } = req.body;
      
      if (!hskLevel) {
        return res.status(400).json({ message: "HSK level is required" });
      }
      
      // Update HSK level in the application
      await storage.updateApplicationField(id, 'hskLevel', hskLevel);
      
      console.log("✅ HSK level updated successfully");
      res.json({ message: "HSK level updated successfully", hskLevel });
    } catch (error) {
      console.error("❌ Error updating HSK level:", error);
      res.status(500).json({ message: "Failed to update HSK level" });
    }
  });

  // General application update endpoint
  app.patch("/api/applications/:id", async (req, res) => {
    try {
      console.log("🔄 Updating application:", { id: req.params.id, updates: req.body });
      const { id } = req.params;
      const updates = req.body;
      
      // Get current application first
      const currentApp = await storage.getApplication(id);
      if (!currentApp) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // Update each field provided in the request body
      for (const [field, value] of Object.entries(updates)) {
        await storage.updateApplicationField(id, field, value);
      }
      
      // Get updated application
      const updatedApp = await storage.getApplication(id);
      
      console.log("✅ Application updated successfully");
      res.json({ message: "Application updated successfully", application: updatedApp });
    } catch (error) {
      console.error("❌ Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Create contact/inquiry
  app.post("/api/contacts", async (req, res) => {
    try {
      const validated = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validated);
      res.status(201).json(contact);
    } catch (error) {
      res.status(400).json({ message: "Invalid contact data" });
    }
  });

  // Get contacts (for admin)
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      console.log("📊 STATS ENDPOINT CALLED - Starting calculation...");
      const applications = await storage.getApplications();
      const contacts = await storage.getContacts();
      
      console.log("📊 Raw applications data:", applications.length, "total");
      
      // Count total translators (all applications since they're all applying to be translators)
      const totalTranslators = applications.length;
      
      // Count verified translators (applications that are approved and have completed verification)
      const verifiedTranslators = applications.filter(app => {
        const verificationSteps = (app as any).verificationSteps || {};
        const isVerified = app.status === 'approved' && 
               verificationSteps.emailVerified && 
               verificationSteps.adminApproved &&
               (app as any).finalStatus === 'approved';
        
        console.log(`📊 Checking ${app.name}:`, {
          status: app.status,
          emailVerified: verificationSteps.emailVerified,
          adminApproved: verificationSteps.adminApproved,
          finalStatus: (app as any).finalStatus,
          isVerified
        });
        
        return isVerified;
      }).length;
      
      // Count pending applications (not yet approved by admin)
      const pendingApplications = applications.filter(app => {
        const verificationSteps = (app as any).verificationSteps || {};
        return app.status === 'pending' || !verificationSteps.adminApproved;
      }).length;
      
      // Keep total transactions as contacts for now
      const totalTransactions = contacts.length;
      
      const stats = {
        totalTranslators,
        verifiedTranslators,
        pendingApplications,
        totalTransactions,
      };
      
      console.log("📊 Final stats calculated:", stats);
      
      res.json(stats);
    } catch (error) {
      console.error("❌ Error calculating stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Recent activities endpoint
  app.get("/api/recent-activities", async (req, res) => {
    try {
      const applications = await storage.getApplications();
      
      // Sort applications by most recent updates and take the last 5
      const recentApps = applications
        .sort((a, b) => new Date((b as any).updatedAt || b.createdAt).getTime() - new Date((a as any).updatedAt || a.createdAt).getTime())
        .slice(0, 5);
      
      const activities = recentApps.map(app => {
        const verificationSteps = (app as any).verificationSteps || {};
        const finalStatus = (app as any).finalStatus;
        const recruitmentStatus = (app as any).recruitmentStatus;
        
        let activityType = "registration";
        let message = `${app.name} mendaftar sebagai penerjemah`;
        let status = "new";
        
        if (finalStatus === 'approved') {
          activityType = "approval";
          message = `${app.name} telah disetujui dan diverifikasi`;
          status = "approved";
        } else if (finalStatus === 'rejected') {
          activityType = "rejection";
          message = `${app.name} ditolak dari rekrutmen`;
          status = "rejected";
        } else if (verificationSteps.adminApproved) {
          activityType = "verification";
          message = `${app.name} telah diverifikasi`;
          status = "verified";
        } else if (verificationSteps.emailVerified) {
          activityType = "email_verified";
          message = `${app.name} memverifikasi email`;
          status = "progress";
        }
        
        return {
          id: app.id,
          type: activityType,
          message,
          timestamp: (app as any).updatedAt || app.createdAt,
          status
        };
      });
      
      res.json(activities);
    } catch (error) {
      console.error("❌ Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email dan password wajib diisi" });
      }

      console.log('🔐 Login attempt for:', email);

      // Test login credentials
      if (email === "test@example.com" && password === "test123") {
        const token = jwt.sign(
          { 
            uid: 'test-user-id', 
            email: 'test@example.com',
            emailVerified: true 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            uid: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User',
            role: 'user',
            emailVerified: true
          }
        });
      }

      // Admin login
      if (email === "admin@penerjemahchina.com" && password === "admin123") {
        const token = jwt.sign(
          { 
            uid: 'admin-user-id', 
            email: 'admin@penerjemahchina.com',
            emailVerified: true 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            uid: 'admin-user-id',
            email: 'admin@penerjemahchina.com',
            name: 'Admin',
            role: 'admin',
            emailVerified: true
          }
        });
      }

      // First priority: Check our application system (with encrypted passwords)
      const applications = await storage.getApplications();
      const userApplication = applications.find(app => app.email === email);
      
      if (userApplication && userApplication.password) {
        // Verify encrypted password
        const passwordMatch = await bcrypt.compare(password, userApplication.password);
        
        if (!passwordMatch) {
          console.log('❌ Password mismatch for application user:', email);
          return res.status(401).json({ message: "Email atau password salah" });
        }

        // Check Firebase email verification status
        let emailVerified = false;
        try {
          const firebaseUser = await getUserByEmail(email);
          emailVerified = firebaseUser ? firebaseUser.emailVerified : false;
        } catch (error) {
          console.log('Could not get Firebase user verification status:', error);
          emailVerified = false;
        }

        // Generate JWT token for application user
        const token = jwt.sign(
          { 
            uid: (userApplication as any).firebaseUid || userApplication.id, 
            email: userApplication.email,
            emailVerified: emailVerified
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        let userRole = 'user';
        if (userApplication.status === 'approved') {
          userRole = 'translator';
        }

        console.log(`✅ Application login successful for: ${email}, role: ${userRole}, emailVerified: ${emailVerified}`);

        return res.json({
          token,
          user: {
            uid: (userApplication as any).firebaseUid || userApplication.id,
            email: userApplication.email,
            name: userApplication.name,
            role: userRole,
            emailVerified: emailVerified
          }
        });
      }

      // Second priority: Check Firebase Auth users (legacy)
      try {
        const userRecord = await getUserByEmail(email);
        
        if (userRecord) {
          // Check if user is verified
          if (!userRecord.emailVerified) {
            return res.status(401).json({ message: "Email belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu." });
          }

          // For Firebase Auth users, we can't verify password directly
          // This would need additional implementation
          console.log('Firebase Auth user found, but password verification not implemented');
        }
      } catch (firebaseError) {
        console.log('No Firebase Auth user found for:', email);
      }

      // If no user found in either system
      console.log('❌ No user found for:', email);
      return res.status(401).json({ message: "Email atau password salah" });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Terjadi kesalahan saat login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      res.json({ message: "Logout berhasil" });
    } catch (error) {
      res.status(500).json({ message: "Terjadi kesalahan saat logout" });
    }
  });

  // Document verification endpoints
  app.patch("/api/applications/:id/documents/:documentType/status", async (req, res) => {
    try {
      const { id, documentType } = req.params;
      const { status, adminNotes } = req.body;

      console.log('📝 Document status update request:', { id, documentType, status, adminNotes });

      if (!['pending', 'approved', 'rejected', 'needs_changes'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Map document types to verification fields
      const documentFieldMap: { [key: string]: string } = {
        'hsk': 'hskStatus',
        'studentId': 'studentIdStatus',
        'cv': 'cvStatus'
      };

      const statusField = documentFieldMap[documentType];
      if (!statusField) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      console.log('🔄 Updating field:', `verificationSteps.${statusField}`, 'to:', status);

      // Update document verification status in verificationSteps
      await storage.updateApplicationField(id, `verificationSteps.${statusField}`, status);

      if (adminNotes) {
        await storage.updateApplicationField(id, `${documentType}AdminNotes`, adminNotes);
      }

      // Update overall verification progress
      const application = await storage.getApplicationById(id);
      if (application) {
        const verificationSteps = application.verificationSteps as any || {};
        let completedSteps = 0;
        const totalSteps = 4; // email, studentId, hsk, cv

        console.log('📊 Current verification steps:', verificationSteps);

        if (verificationSteps.emailVerified) completedSteps++;
        if (verificationSteps.studentIdUploaded && verificationSteps.studentIdStatus === 'approved') completedSteps++;
        if (verificationSteps.hskUploaded && verificationSteps.hskStatus === 'approved') completedSteps++;
        if (verificationSteps.cvUploaded && verificationSteps.cvStatus === 'approved') completedSteps++;

        const progress = Math.round((completedSteps / totalSteps) * 100);
        console.log('📈 Calculated progress:', progress, 'from steps:', completedSteps, '/', totalSteps);
        
        await storage.updateApplicationField(id, 'completenessScore', progress);
      }

      console.log('✅ Document status update completed successfully');
      res.json({ message: "Document status updated successfully" });
    } catch (error) {
      console.error('❌ Error updating document status:', error);
      res.status(500).json({ message: "Failed to update document status" });
    }
  });

  // Get application by ID for detailed view
  app.get("/api/applications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const application = await storage.getApplicationById(id);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      res.json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ message: "Failed to fetch application" });
    }
  });

  // Add verification routes
  app.use("/api", verificationRoutes);

  // Check email verification status
  app.get("/api/auth/verify-status", async (req, res) => {
    try {
      const { email } = req.query;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Check Firebase email verification status
      try {
        const firebaseUser = await getUserByEmail(email as string);
        const emailVerified = firebaseUser ? firebaseUser.emailVerified : false;
        
        res.json({ emailVerified });
      } catch (error) {
        console.log('Could not get Firebase user verification status:', error);
        res.json({ emailVerified: false });
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      res.status(500).json({ message: "Failed to check verification status" });
    }
  });

  // Update application availability
  app.put("/api/applications/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const availabilityData = req.body;

      console.log('📅 Updating availability for application:', id);
      console.log('📊 Availability data:', availabilityData);

      // Update availability in Firebase
      await storage.updateApplicationAvailability(id, availabilityData);

      res.json({ 
        message: "Availability updated successfully",
        availability: availabilityData 
      });
    } catch (error) {
      console.error('❌ Error updating availability:', error);
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  // Get application availability
  app.get("/api/applications/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;

      console.log('📅 Getting availability for application:', id);

      // Get availability from Firebase
      const availability = await storage.getApplicationAvailability(id);

      res.json(availability);
    } catch (error) {
      console.error('❌ Error getting availability:', error);
      res.status(500).json({ message: "Failed to get availability" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
