import type { Express } from "express";
import { createServer, type Server } from "http";
import { FirebaseStorage } from "./firebase-storage";
import { insertApplicationSchema, insertContactSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import verificationRoutes from "./verification-routes";
import { auth, getUserByEmail, createUserAndSendVerification } from "./auth";
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

  // Create new application
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
        intent: 'translator', // Ensure this is set for translator applications
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

  // Get applications (for admin)
  app.get("/api/applications", async (req, res) => {
    try {
      const { status } = req.query;
      const applications = await storage.getApplications(status as string);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Update application status (approve/reject)
  app.patch("/api/applications/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const application = await storage.updateApplicationStatus(id, status);
      
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      
      // If approved, create service provider
      if (status === 'approved') {
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
          intent: (application.intent || 'translator') as 'translator' | 'tour_guide' | 'both',
        };
        
        await storage.createServiceProvider(providerData);
      }
      
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application status" });
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
      const allProviders = await storage.getServiceProviders();
      const applications = await storage.getApplications();
      const contacts = await storage.getContacts();
      
      const stats = {
        totalTranslators: allProviders.length,
        verifiedTranslators: allProviders.filter(p => p.isVerified).length,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        totalTransactions: contacts.length,
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
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

        // Generate JWT token for application user
        const token = jwt.sign(
          { 
            uid: (userApplication as any).firebaseUid || userApplication.id, 
            email: userApplication.email,
            emailVerified: true // Application users are considered verified
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        let userRole = 'user';
        if (userApplication.status === 'approved') {
          userRole = 'translator';
        }

        console.log(`✅ Application login successful for: ${email}, role: ${userRole}`);

        return res.json({
          token,
          user: {
            uid: (userApplication as any).firebaseUid || userApplication.id,
            email: userApplication.email,
            name: userApplication.name,
            role: userRole,
            emailVerified: true
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

  // Add verification routes
  app.use("/api", verificationRoutes);

  const httpServer = createServer(app);
  return httpServer;
}
