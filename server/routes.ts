import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertApplicationSchema, insertContactSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

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
      const { city, services, minRating } = req.query;
      
      const filters: any = {};
      if (city) filters.city = city as string;
      if (services) filters.services = (services as string).split(',');
      if (minRating) filters.minRating = parseFloat(minRating as string);
      
      const providers = await storage.getServiceProviders(filters);
      res.json(providers);
    } catch (error) {
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
          services: application.services,
          experience: application.experience,
          pricePerDay: application.pricePerDay,
          description: application.description,
          languages: [], // Default empty, can be updated later
          profileImage: application.profileImage,
          identityDocument: application.identityDocument,
          certificates: application.certificates,
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

  const httpServer = createServer(app);
  return httpServer;
}
