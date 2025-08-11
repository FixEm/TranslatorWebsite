import 'dotenv/config';
import { type ServiceProvider, type InsertServiceProvider, type Application, type InsertApplication, type Contact, type InsertContact, type User, type InsertUser } from "@shared/schema";
import { db, storage as firebaseStorage } from "./firebase";

export class FirebaseStorage {
  private usersCollection = db.collection('users');
  private serviceProvidersCollection = db.collection('service_providers');
  private applicationsCollection = db.collection('applications');
  private contactsCollection = db.collection('contacts');

  async getUser(id: string): Promise<User | undefined> {
    const doc = await this.usersCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const snapshot = await this.usersCollection.where('username', '==', username).get();
    if (snapshot.empty) return undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const docRef = await this.usersCollection.add(user);
    return { id: docRef.id, ...user };
  }

  async getServiceProviders(filters?: { city?: string; services?: string[]; minRating?: number; email?: string }): Promise<ServiceProvider[]> {
    console.log("🔥 Firebase: Getting service providers with filters:", filters);
    
    // Temporarily remove the isVerified filter to see all data
    let query: any = this.serviceProvidersCollection;
    
    if (filters?.city) {
      query = query.where('city', '==', filters.city);
    }
    
    if (filters?.email) {
      query = query.where('email', '==', filters.email);
    }
    
    console.log("🔥 Firebase: Executing query...");
    const snapshot = await query.get();
    console.log("🔥 Firebase: Query returned", snapshot.docs.length, "documents");
    
    let providers = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      console.log("🔥 Firebase: Document data:", { 
        docId: doc.id, 
        dataId: data.id,
        isVerified: data.isVerified, 
        name: data.name, 
        rating: data.rating 
      });
      
      // Remove the id field from data to prevent overwriting
      const { id: _, ...cleanData } = data;
      
      return {
        ...cleanData,
        id: doc.id
      } as ServiceProvider;
    });
    
    console.log("🔥 Firebase: Mapped providers:", providers.length);
    
    // Apply additional filters that Firestore doesn't support directly
    if (filters?.services && filters.services.length > 0) {
      providers = providers.filter((p: ServiceProvider) =>
        p.services && Array.isArray(p.services) && p.services.some((service: string) => filters.services!.includes(service))
      );
    }
    
    if (filters?.minRating) {
      providers = providers.filter((p: ServiceProvider) => parseFloat(p.rating || "0") >= filters.minRating!);
    }
    
    return providers;
  }

  async getServiceProvider(id: string): Promise<ServiceProvider | undefined> {
    const doc = await this.serviceProvidersCollection.doc(id).get();
    if (!doc.exists) return undefined;
    
    const data = doc.data() || {};
    const { id: _, ...cleanData } = data;
    
    return {
      ...cleanData,
      id: doc.id
    } as ServiceProvider;
  }

  async createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider> {
    // Filter out undefined values to avoid Firestore errors
    const cleanProvider = Object.fromEntries(
      Object.entries(provider).filter(([_, value]) => value !== undefined)
    ) as InsertServiceProvider;

    const newProvider = {
      ...cleanProvider,
      id: '', // Will be set after creation
      isVerified: false,
      rating: "0",
      reviewCount: 0,
      profileImage: cleanProvider.profileImage || null,
      identityDocument: cleanProvider.identityDocument || null,
      certificates: cleanProvider.certificates || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // New verification workflow fields
      googleId: cleanProvider.googleId || null,
      studentIdDocument: null,
      hskCertificate: null,
      introVideo: null,
      verificationSteps: {
        emailVerified: false,
        studentIdUploaded: false,
        hskUploaded: false,
        introVideoUploaded: false,
        adminApproved: false
      },
      completenessScore: 0,
      intent: cleanProvider.intent || 'translator',
      studentEmail: cleanProvider.studentEmail || null,
      yearsInChina: cleanProvider.yearsInChina || null
    };
    
    const docRef = await this.serviceProvidersCollection.add(newProvider);
    return { ...newProvider, id: docRef.id } as ServiceProvider;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    // Filter out undefined values to avoid Firestore errors
    const cleanApplication = Object.fromEntries(
      Object.entries(application).filter(([_, value]) => value !== undefined)
    ) as InsertApplication;

    const newApplication = {
      ...cleanApplication,
      id: '', // Will be set after creation
      status: "pending",
      profileImage: cleanApplication.profileImage || null,
      identityDocument: cleanApplication.identityDocument || null,
      certificates: cleanApplication.certificates || null,
      createdAt: new Date(),
      // New verification workflow fields
      googleId: cleanApplication.googleId || null,
      studentIdDocument: null,
      hskCertificate: null,
      introVideo: null,
      verificationSteps: {
        emailVerified: false,
        studentIdUploaded: false,
        hskUploaded: false,
        introVideoUploaded: false,
        adminApproved: false
      },
      completenessScore: 0,
      intent: cleanApplication.intent || 'translator',
      studentEmail: cleanApplication.studentEmail || null,
      yearsInChina: cleanApplication.yearsInChina || null,
      adminNotes: null
    };
    
    const docRef = await this.applicationsCollection.add(newApplication);
    return { ...newApplication, id: docRef.id } as Application;
  }

  // New methods for verification workflow
  async verifyEmail(userId: string): Promise<void> {
    await this.applicationsCollection.doc(userId).update({
      'verificationSteps.emailVerified': true,
      verifiedAt: new Date().toISOString()
    });
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const doc = await this.applicationsCollection.doc(id).get();
    
    if (!doc.exists) {
      return undefined;
    }
    
    return {
      id: doc.id,
      ...doc.data()
    } as Application;
  }

  async getApplications(status?: string): Promise<Application[]> {
    let query = this.applicationsCollection.orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status) as any;
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data() || {};
      const { id: _, ...cleanData } = data;
      
      // Convert Firestore timestamps to JavaScript Date objects
      const convertedData = { ...cleanData };
      if (convertedData.createdAt && convertedData.createdAt.toDate) {
        convertedData.createdAt = convertedData.createdAt.toDate();
      }
      if (convertedData.updatedAt && convertedData.updatedAt.toDate) {
        convertedData.updatedAt = convertedData.updatedAt.toDate();
      }
      
      return {
        ...convertedData,
        id: doc.id
      } as Application;
    });
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    console.log("🔄 Firebase: Updating application status:", { id, status });
    
    try {
      await this.applicationsCollection.doc(id).update({ status, updatedAt: new Date() });
      console.log("✅ Firebase: Status update successful");
      
      const doc = await this.applicationsCollection.doc(id).get();
      if (!doc.exists) {
        console.log("❌ Firebase: Document not found after update");
        return undefined;
      }
      
      const data = doc.data() || {};
      const { id: _, ...cleanData } = data;
      
      const result = {
        ...cleanData,
        id: doc.id
      } as Application;
      
      console.log("✅ Firebase: Returning updated application:", result);
      return result;
    } catch (error) {
      console.error("❌ Firebase: Error updating application status:", error);
      throw error;
    }
  }

  async updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | undefined> {
    const updatedData = { ...updates, updatedAt: new Date() };
    await this.serviceProvidersCollection.doc(id).update(updatedData);
    
    const doc = await this.serviceProvidersCollection.doc(id).get();
    if (!doc.exists) return undefined;
    
    const data = doc.data() || {};
    const { id: _, ...cleanData } = data;
    
    return {
      ...cleanData,
      id: doc.id
    } as ServiceProvider;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const newContact: Contact = {
      ...contact,
      id: '', // Will be set after creation
      clientPhone: contact.clientPhone || null,
      createdAt: new Date(),
    };
    
    const docRef = await this.contactsCollection.add(newContact);
    return { ...newContact, id: docRef.id };
  }

  async getContacts(): Promise<Contact[]> {
    const snapshot = await this.contactsCollection.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Contact));
  }

  // Email verification methods for applications
  async updateApplicationEmailVerification(id: string, firebaseUid?: string): Promise<void> {
    const updateData: any = {
      'verificationSteps.emailVerified': true,
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date()
    };
    
    if (firebaseUid) {
      updateData.firebaseUid = firebaseUid;
    }
    
    await this.applicationsCollection.doc(id).update(updateData);
  }

  async getApplicationByEmail(email: string): Promise<Application | undefined> {
    const snapshot = await this.applicationsCollection.where('email', '==', email).get();
    if (snapshot.empty) return undefined;
    
    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Application;
  }

  // Document upload methods for applications
  async updateStudentDocument(id: string, documentUrl: string): Promise<void> {
    console.log(`📄 FirebaseStorage: Updating student document for ${id}`);
    
    // Get current application to check for change requests
    const application = await this.getApplication(id);
    const updateData: any = {
      studentIdDocument: documentUrl,
      'verificationSteps.studentIdUploaded': true,
      'verificationSteps.studentIdStatus': 'pending', // Reset status to pending for admin review
      updatedAt: new Date()
    };

    // Clear change requests if this document was requested for changes
    if (application && (application as any).changeRequests?.requests) {
      const filteredRequests = (application as any).changeRequests.requests.filter(
        (req: any) => req.type !== 'studentId'
      );
      
      if (filteredRequests.length === 0) {
        // No more change requests, remove the field entirely
        updateData.changeRequests = null;
      } else {
        // Update with remaining requests
        updateData.changeRequests = {
          ...(application as any).changeRequests,
          requests: filteredRequests
        };
      }
      console.log(`✅ FirebaseStorage: Cleared studentId change request for ${id}`);
    }

    await this.applicationsCollection.doc(id).update(updateData);
    console.log(`✅ FirebaseStorage: Student document updated for ${id}`);
  }

  async updateHskCertificate(id: string, certificateUrl: string): Promise<void> {
    console.log(`📄 FirebaseStorage: Updating HSK certificate for ${id}`);
    
    // Get current application to check for change requests
    const application = await this.getApplication(id);
    const updateData: any = {
      hskCertificate: certificateUrl,
      'verificationSteps.hskUploaded': true,
      'verificationSteps.hskStatus': 'pending', // Reset status to pending for admin review
      updatedAt: new Date()
    };

    // Clear change requests if this document was requested for changes
    if (application && (application as any).changeRequests?.requests) {
      const filteredRequests = (application as any).changeRequests.requests.filter(
        (req: any) => req.type !== 'hsk'
      );
      
      if (filteredRequests.length === 0) {
        // No more change requests, remove the field entirely
        updateData.changeRequests = null;
      } else {
        // Update with remaining requests
        updateData.changeRequests = {
          ...(application as any).changeRequests,
          requests: filteredRequests
        };
      }
      console.log(`✅ FirebaseStorage: Cleared HSK change request for ${id}`);
    }

    await this.applicationsCollection.doc(id).update(updateData);
    console.log(`✅ FirebaseStorage: HSK certificate updated for ${id}`);
  }

  async updateIntroVideo(id: string, videoUrl: string): Promise<void> {
    await this.applicationsCollection.doc(id).update({
      introVideo: videoUrl,
      'verificationSteps.introVideoUploaded': true,
      updatedAt: new Date()
    });
  }

  async approveApplication(id: string, adminNotes?: string): Promise<void> {
    await this.applicationsCollection.doc(id).update({
      'verificationSteps.adminApproved': true,
      isVerified: true,
      status: 'approved',
      adminNotes,
      approvedAt: new Date().toISOString(),
      updatedAt: new Date()
    });
  }

  async rejectApplication(id: string, adminNotes?: string): Promise<void> {
    await this.applicationsCollection.doc(id).update({
      'verificationSteps.adminApproved': false,
      isVerified: false,
      status: 'rejected',
      adminNotes,
      rejectedAt: new Date().toISOString(),
      updatedAt: new Date()
    });
  }

  // Generic method to update any field in an application
  async updateApplicationField(id: string, field: string, value: any): Promise<void> {
    console.log(`🔄 FirebaseStorage: Updating field '${field}' for application ${id} with value:`, value);
    
    const updateData: any = {
      updatedAt: new Date()
    };
    updateData[field] = value;
    
    console.log(`🔄 FirebaseStorage: Update data:`, updateData);
    
    try {
      await this.applicationsCollection.doc(id).update(updateData);
      console.log(`✅ FirebaseStorage: Field '${field}' updated successfully for application ${id}`);
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error updating field '${field}' for application ${id}:`, error);
      throw error;
    }
  }

  // Alias for getApplication to match expected naming
  async getApplicationById(id: string): Promise<Application | undefined> {
    return this.getApplication(id);
  }

  // Delete file from Firebase Storage
  async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      console.log(`🗑️ FirebaseStorage: Attempting to delete file: ${fileUrl}`);
      
      // Extract the file path from the URL
      // URL format: https://storage.googleapis.com/bucket-name/path/to/file
      const urlParts = fileUrl.split('/');
      const bucketName = urlParts[3]; // Get bucket name
      const filePath = urlParts.slice(4).join('/'); // Get file path
      
      console.log(`🗑️ FirebaseStorage: Bucket: ${bucketName}, Path: ${filePath}`);
      
      const bucket = firebaseStorage.bucket();
      const file = bucket.file(filePath);
      
      await file.delete();
      console.log(`✅ FirebaseStorage: File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error deleting file ${fileUrl}:`, error);
      throw error;
    }
  }

  // Delete specific document files for an application
  async deleteApplicationDocuments(applicationId: string, documentTypes: string[]): Promise<void> {
    try {
      console.log(`🗑️ FirebaseStorage: Deleting documents for application ${applicationId}, types: ${documentTypes.join(', ')}`);
      
      // Get the current application to find file URLs
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const updateData: any = {
        updatedAt: new Date()
      };

      // Process each document type
      for (const docType of documentTypes) {
        if (docType === 'hsk' && (application as any).hskCertificate) {
          console.log(`🗑️ FirebaseStorage: Deleting HSK certificate: ${(application as any).hskCertificate}`);
          await this.deleteFileFromStorage((application as any).hskCertificate);
          updateData.hskCertificate = null;
        }
        
        if (docType === 'studentId' && (application as any).studentIdDocument) {
          console.log(`🗑️ FirebaseStorage: Deleting Student ID document: ${(application as any).studentIdDocument}`);
          await this.deleteFileFromStorage((application as any).studentIdDocument);
          updateData.studentIdDocument = null;
        }

        if (docType === 'cv' && (application as any).cvDocument) {
          console.log(`🗑️ FirebaseStorage: Deleting CV document: ${(application as any).cvDocument}`);
          await this.deleteFileFromStorage((application as any).cvDocument);
          updateData.cvDocument = null;
        }
      }

      // Update the application to remove file references
      await this.applicationsCollection.doc(applicationId).update(updateData);
      console.log(`✅ FirebaseStorage: Document references cleared for application ${applicationId}`);
      
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error deleting documents for application ${applicationId}:`, error);
      throw error;
    }
  }

  // Availability management methods
  async updateApplicationAvailability(applicationId: string, availabilityData: any): Promise<void> {
    try {
      console.log(`📅 FirebaseStorage: Updating availability for application ${applicationId}`);
      
      // Clean undefined values from the availability data
      const cleanAvailabilityData = Object.fromEntries(
        Object.entries({
          ...availabilityData,
          lastUpdated: new Date()
        }).filter(([_, value]) => value !== undefined)
      );

      await this.applicationsCollection.doc(applicationId).update({
        availability: cleanAvailabilityData
      });
      
      console.log(`✅ FirebaseStorage: Availability updated for application ${applicationId}`);
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error updating availability for application ${applicationId}:`, error);
      throw error;
    }
  }

  async getApplicationAvailability(applicationId: string): Promise<any> {
    try {
      console.log(`📅 FirebaseStorage: Getting availability for application ${applicationId}`);
      
      const doc = await this.applicationsCollection.doc(applicationId).get();
      if (!doc.exists) {
        throw new Error(`Application ${applicationId} not found`);
      }

      const applicationData = doc.data();
      const availability = applicationData?.availability || {
        isAvailable: true,
        schedule: [],
        recurringPatterns: [],
        unavailablePeriods: [],
        lastUpdated: new Date()
      };

      console.log(`✅ FirebaseStorage: Retrieved availability for application ${applicationId}`);
      return availability;
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error getting availability for application ${applicationId}:`, error);
      throw error;
    }
  }

  // Update service provider availability
  async updateServiceProviderAvailability(serviceProviderId: string, availabilityData: any): Promise<void> {
    try {
      console.log(`📅 FirebaseStorage: Updating availability for service provider ${serviceProviderId}`);
      
      // Clean undefined values from the availability data
      const cleanAvailabilityData = Object.fromEntries(
        Object.entries({
          ...availabilityData,
          lastUpdated: new Date()
        }).filter(([_, value]) => value !== undefined)
      );

      await this.serviceProvidersCollection.doc(serviceProviderId).update({
        availability: cleanAvailabilityData
      });
      
      console.log(`✅ FirebaseStorage: Availability updated for service provider ${serviceProviderId}`);
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error updating availability for service provider ${serviceProviderId}:`, error);
      throw error;
    }
  }

  async getServiceProviderAvailability(serviceProviderId: string): Promise<any> {
    try {
      console.log(`📅 FirebaseStorage: Getting availability for service provider ${serviceProviderId}`);
      
      const doc = await this.serviceProvidersCollection.doc(serviceProviderId).get();
      if (!doc.exists) {
        throw new Error(`Service provider ${serviceProviderId} not found`);
      }

      const serviceProviderData = doc.data();
      const availability = serviceProviderData?.availability || {
        isAvailable: true,
        schedule: [],
        recurringPatterns: [],
        unavailablePeriods: [],
        lastUpdated: new Date(),
        timezone: 'Asia/Shanghai'
      };

      console.log(`✅ FirebaseStorage: Retrieved availability for service provider ${serviceProviderId}`);
      return availability;
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error getting availability for service provider ${serviceProviderId}:`, error);
      throw error;
    }
  }
}

export const storage = new FirebaseStorage();