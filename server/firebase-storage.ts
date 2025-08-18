import 'dotenv/config';
import { type ServiceProvider, type InsertServiceProvider, type Application, type InsertApplication, type Contact, type InsertContact, type User, type InsertUser } from "@shared/schema";
import { db, storage as firebaseStorage } from "./firebase";

export class FirebaseStorage {
  private usersCollection = db.collection('users');
  private serviceProvidersCollection = db.collection('service_providers');
  private applicationsCollection = db.collection('applications');
  private contactsCollection = db.collection('contacts');
  private jobsCollection = db.collection('jobs');
  private bookingsCollection = db.collection('bookings');
  private providerCalendarsCollection = db.collection('provider_calendars');

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
    return { id: docRef.id, ...user, status: 'pending' as const };
  }

  async getServiceProviders(filters?: { city?: string; services?: string[]; minRating?: number; email?: string }): Promise<ServiceProvider[]> {
    console.log("🔥 Firebase: Getting service providers with filters:", filters);
    
    // Only return admin-approved service providers for public search
    let query: any = this.serviceProvidersCollection;
    
    // Add admin approval filter for public searches (when no email filter is specified)
    if (!filters?.email) {
      query = query.where('verificationSteps.adminApproved', '==', true);
    }
    
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
      cvDocument: null,
      introVideo: null,
      verificationSteps: {
        emailVerified: false,
        studentIdUploaded: false,
        hskUploaded: false,
        cvUploaded: false,
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
      cvDocument: null,
      verificationSteps: {
        emailVerified: false,
        studentIdUploaded: false,
        hskUploaded: false,
        cvUploaded: false,
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

  async getApplicationByFirebaseUid(firebaseUid: string): Promise<Application | undefined> {
    console.log(`🔍 FirebaseStorage: Searching for application with Firebase UID: ${firebaseUid}`);
    
    const snapshot = await this.applicationsCollection
      .where('firebaseUid', '==', firebaseUid)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      console.log(`❌ FirebaseStorage: No application found with Firebase UID: ${firebaseUid}`);
      return undefined;
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data() || {};
    const { id: _, ...cleanData } = data;
    
    return {
      ...cleanData,
      id: doc.id
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

  async updateCvDocument(id: string, documentUrl: string): Promise<void> {
    console.log(`📄 FirebaseStorage: Updating CV document for ${id}`);
    
    // Get current application to check for change requests
    const application = await this.getApplication(id);
    const updateData: any = {
      cvDocument: documentUrl,
      'verificationSteps.cvUploaded': true,
      'verificationSteps.cvStatus': 'pending', // Reset status to pending for admin review
      updatedAt: new Date()
    };

    // Clear change requests if this document was requested for changes
    if (application && (application as any).changeRequests?.requests) {
      const filteredRequests = (application as any).changeRequests.requests.filter(
        (req: any) => req.type !== 'cv'
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
      console.log(`✅ FirebaseStorage: Cleared CV change request for ${id}`);
    }

    await this.applicationsCollection.doc(id).update(updateData);
    console.log(`✅ FirebaseStorage: CV document updated for ${id}`);
  }

  async updateKtpDocument(id: string, documentUrl: string): Promise<void> {
    console.log(`📄 FirebaseStorage: Updating KTP document for ${id}`);
    
    // Get current application to check for change requests
    const application = await this.getApplication(id);
    const updateData: any = {
      ktpDocument: {
        url: documentUrl,
        status: 'pending'
      },
      'verificationSteps.ktpUploaded': true,
      'verificationSteps.ktpStatus': 'pending', // Reset status to pending for admin review
      updatedAt: new Date()
    };

    // Clear change requests if this document was requested for changes
    if (application && (application as any).changeRequests?.requests) {
      const filteredRequests = (application as any).changeRequests.requests.filter(
        (req: any) => req.type !== 'ktp'
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
      console.log(`✅ FirebaseStorage: Cleared KTP change request for ${id}`);
    }

    await this.applicationsCollection.doc(id).update(updateData);
    console.log(`✅ FirebaseStorage: KTP document updated for ${id}`);
  }

  async updateIntroVideo(id: string, videoUrl: string): Promise<void> {
    console.log(`🎬 FirebaseStorage: Storing intro video URL in Firestore for application ${id}`);
    
    // Get current application to check for change requests
    const application = await this.getApplication(id);
    const updateData: any = {
      introVideo: videoUrl, // Store the Google Drive URL directly in Firestore
      'verificationSteps.introVideoUploaded': true,
      'verificationSteps.introVideoStatus': 'pending', // Reset status to pending for admin review
      updatedAt: new Date()
    };

    // Clear change requests if this video was requested for changes
    if (application && (application as any).changeRequests?.requests) {
      const filteredRequests = (application as any).changeRequests.requests.filter(
        (req: any) => req.type !== 'introVideo'
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
      console.log(`✅ FirebaseStorage: Cleared intro video change request for ${id}`);
    }

    await this.applicationsCollection.doc(id).update(updateData);
    console.log(`✅ FirebaseStorage: Intro video URL stored in Firestore for application ${id}`);
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
      // URL format: https://storage.googleapis.com/bucket-name/path/to/file?query=params
      // or: https://firebasestorage.googleapis.com/v0/b/bucket-name/o/encoded-path?alt=media&token=...
      
      let filePath: string;
      
      if (fileUrl.includes('firebasestorage.googleapis.com')) {
        // Handle Firebase Storage download URLs with encoded paths
        const urlParts = fileUrl.split('/o/');
        if (urlParts.length >= 2) {
          const encodedPath = urlParts[1].split('?')[0]; // Remove query parameters
          filePath = decodeURIComponent(encodedPath);
        } else {
          throw new Error('Invalid Firebase Storage URL format');
        }
      } else if (fileUrl.includes('storage.googleapis.com')) {
        // Handle direct storage URLs
        const urlParts = fileUrl.split('/');
        if (urlParts.length >= 5) {
          const pathParts = urlParts.slice(4); // Remove protocol, domain, and bucket
          // Remove query parameters from the last part
          const lastPart = pathParts[pathParts.length - 1].split('?')[0];
          pathParts[pathParts.length - 1] = lastPart;
          filePath = pathParts.join('/');
        } else {
          throw new Error('Invalid storage URL format');
        }
      } else {
        throw new Error('Unsupported storage URL format');
      }
      
      console.log(`🗑️ FirebaseStorage: Extracted file path: ${filePath}`);
      
      const bucket = firebaseStorage.bucket();
      const file = bucket.file(filePath);
      
      // Check if file exists before attempting to delete
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`⚠️ FirebaseStorage: File does not exist: ${filePath}`);
        return; // Don't throw error if file doesn't exist
      }
      
      await file.delete();
      console.log(`✅ FirebaseStorage: File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error deleting file ${fileUrl}:`, error);
      // Don't throw error for file deletion failures - log and continue
      // This ensures the document reference is still cleared from the database
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
        try {
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

          if (docType === 'introVideo' && (application as any).introVideo) {
            console.log(`🗑️ FirebaseStorage: Clearing intro video URL from Firestore: ${(application as any).introVideo}`);
            // For intro video, we just clear the URL from Firestore since it's stored externally (Google Drive)
            updateData.introVideo = null;
            updateData['verificationSteps.introVideoUploaded'] = false;
          }

          if (docType === 'ktp' && (application as any).ktpDocument?.url) {
            console.log(`🗑️ FirebaseStorage: Deleting KTP document: ${(application as any).ktpDocument.url}`);
            await this.deleteFileFromStorage((application as any).ktpDocument.url);
            updateData.ktpDocument = null;
          }
        } catch (fileDeleteError) {
          console.error(`⚠️ FirebaseStorage: Error deleting ${docType} file (continuing anyway):`, fileDeleteError);
          // Still clear the document reference even if file deletion fails
          if (docType === 'hsk') {
            updateData.hskCertificate = null;
          } else if (docType === 'studentId') {
            updateData.studentIdDocument = null;
          } else if (docType === 'cv') {
            updateData.cvDocument = null;
          } else if (docType === 'introVideo') {
            updateData.introVideo = null;
            updateData['verificationSteps.introVideoUploaded'] = false;
          } else if (docType === 'ktp') {
            updateData.ktpDocument = null;
          }
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

  // NEW: Job methods
  async createJob(jobData: any): Promise<any> {
    const newJob = {
      ...jobData,
      id: '',
      status: 'active',
      applicationsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.jobsCollection.add(newJob);
    const createdJob = { ...newJob, id: docRef.id };
    
    return createdJob;
  }

  async getJobs(filters?: { userId?: string; status?: string; category?: string }): Promise<any[]> {
    let query: any = this.jobsCollection;
    
    if (filters?.userId) {
      query = query.where('userId', '==', filters.userId);
    }
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    
    if (filters?.category) {
      query = query.where('category', '==', filters.category);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const { id: _, ...cleanData } = data;
      
      return {
        ...cleanData,
        id: doc.id
      };
    });
  }

  async getJob(id: string): Promise<any | undefined> {
    const doc = await this.jobsCollection.doc(id).get();
    
    if (!doc.exists) {
      return undefined;
    }
    
    const data = doc.data() || {};
    const { id: _, ...cleanData } = data;
    
    return {
      ...cleanData,
      id: doc.id
    };
  }

  // NEW: Booking methods
  async createBooking(bookingData: any): Promise<any> {
    // Normalize requested dates (single-day or multi-day)
    const requestedDates = this.extractRequestedDates(bookingData);
    if (!bookingData.providerId) {
      throw new Error('providerId is required');
    }

    // Conflict check against pending + confirmed bookings
    const hasConflict = await this.doesConflictExist(bookingData.providerId, requestedDates);
    if (hasConflict) {
      const error: any = new Error('Requested date(s) are unavailable');
      error.code = 'date_conflict';
      throw error;
    }

    // Build payload while avoiding undefined fields
    const baseData: any = { ...bookingData };
    // Remove potentially conflicting date fields from input
    delete baseData.date;
    delete baseData.dateRange;
    
    let payload: any = {
      ...baseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (requestedDates.length > 1) {
      payload.dateRange = requestedDates;
    } else if (requestedDates.length === 1) {
      payload.date = requestedDates[0];
    }
    // Compute total price based on number of days
    const numDays = Math.max(requestedDates.length || 1, 1);
    const pricePerDay = Number(bookingData.pricePerDay) || 0;
    payload.totalPrice = pricePerDay * numDays;
    // Strip undefined values
    payload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

    const docRef = await this.bookingsCollection.add(payload);

    // Rebuild provider calendar cache
    await this.rebuildAndSaveProviderCalendar(bookingData.providerId);
    
    return { id: docRef.id, ...payload };
  }

  async getBookings(filters?: { status?: string; providerId?: string; clientEmail?: string }): Promise<any[]> {
    let query: any = this.bookingsCollection;
    
    if (filters?.status) {
      query = query.where('status', '==', filters.status);
    }
    
    if (filters?.providerId) {
      query = query.where('providerId', '==', filters.providerId);
    }
    
    if (filters?.clientEmail) {
      query = query.where('clientEmail', '==', filters.clientEmail);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      };
    });
  }

  async getBookingsByProvider(providerId: string): Promise<any[]> {
    const snapshot = await this.bookingsCollection
      .where('providerId', '==', providerId)
      .orderBy('createdAt', 'desc')
      .get();
    
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      };
    });
  }

  async getBooking(id: string): Promise<any | undefined> {
    const doc = await this.bookingsCollection.doc(id).get();
    
    if (!doc.exists) {
      return undefined;
    }
    
    const data = doc.data() || {};
    return {
      ...data,
      id: doc.id
    };
  }

  async updateBookingStatus(id: string, status: string, adminNotes?: string): Promise<any> {
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }
    // Read booking to get providerId before update
    const existing = await this.getBooking(id);
    await this.bookingsCollection.doc(id).update(updateData);
    
    const updatedBooking = await this.getBooking(id);
    
    // Rebuild provider calendar cache after status change
    if (existing?.providerId) {
      await this.rebuildAndSaveProviderCalendar(existing.providerId);
    }
    
    return updatedBooking;
  }

  // Compute unavailable dates for provider from pending + confirmed bookings
  private async computeUnavailableDates(providerId: string): Promise<string[]> {
    let query: any = this.bookingsCollection.where('providerId', '==', providerId);
    const snapshot = await query.get();
    const dates: string[] = [];
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'cancelled') return;
      if (Array.isArray(data.dateRange) && data.dateRange.length > 0) {
        data.dateRange.forEach((d: string) => dates.push(d));
      } else if (data.date) {
        dates.push(data.date);
      }
    });
    // Unique + sorted
    const unique = Array.from(new Set(dates));
    unique.sort();
    return unique;
  }

  private extractRequestedDates(bookingData: any): string[] {
    // If dateRange provided, expand when it's [start, end];
    // if it's a list of explicit dates, return as-is
    if (Array.isArray(bookingData.dateRange)) {
      if (
        bookingData.dateRange.length === 2 &&
        typeof bookingData.dateRange[0] === 'string' &&
        typeof bookingData.dateRange[1] === 'string'
      ) {
        return this.expandDateRange(bookingData.dateRange[0], bookingData.dateRange[1]);
      }
      // Treat as explicit list of dates
      return bookingData.dateRange.map((d: any) => String(d));
    }
    // Support alternate field names
    if (bookingData.startDate && bookingData.endDate) {
      return this.expandDateRange(String(bookingData.startDate), String(bookingData.endDate));
    }
    if (bookingData.bookingDate) {
      return [String(bookingData.bookingDate)];
    }
    // Fallback to single date
    if (bookingData.date) {
      return [String(bookingData.date)];
    }
    return [];
  }

  private expandDateRange(start: string, end: string): string[] {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const dates: string[] = [];
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return dates;
    for (
      let d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      d <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      d.setDate(d.getDate() + 1)
    ) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    return dates;
  }

  private async doesConflictExist(providerId: string, requestedDates: string[]): Promise<boolean> {
    if (requestedDates.length === 0) return false;
    const snapshot = await this.bookingsCollection.where('providerId', '==', providerId).get();
    const activeDates: Set<string> = new Set();
    snapshot.forEach((doc: any) => {
      const data = doc.data();
      if (data.status === 'cancelled') return;
      if (Array.isArray(data.dateRange) && data.dateRange.length > 0) {
        data.dateRange.forEach((d: string) => activeDates.add(String(d)));
      } else if (data.date) {
        activeDates.add(String(data.date));
      } else if (data.bookingDate) {
        activeDates.add(String(data.bookingDate));
      }
    });
    return requestedDates.some(d => activeDates.has(String(d)));
  }

  async rebuildAndSaveProviderCalendar(providerId: string): Promise<void> {
    const unavailableDates = await this.computeUnavailableDates(providerId);
    const docRef = this.providerCalendarsCollection.doc(providerId);
    await docRef.set({
      providerId,
      unavailableDates,
      lastUpdated: new Date()
    }, { merge: true });
  }

  async getProviderCalendar(providerId: string): Promise<{ providerId: string; unavailableDates: string[]; lastUpdated: any } | undefined> {
    const doc = await this.providerCalendarsCollection.doc(providerId).get();
    if (!doc.exists) return undefined;
    const data = doc.data() || {};
    return {
      providerId: data.providerId || providerId,
      unavailableDates: Array.isArray(data.unavailableDates) ? data.unavailableDates : [],
      lastUpdated: data.lastUpdated || new Date()
    };
  }

  // NEW: File upload method
  async uploadFileToStorage(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      console.log(`📤 FirebaseStorage: Uploading file to ${folder}:`, file.originalname);
      
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      
      const bucket = firebaseStorage.bucket();
      const fileUpload = bucket.file(fileName);
      
      const stream = fileUpload.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
        resumable: false
      });
      
      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          console.error(`❌ FirebaseStorage: Upload error for ${fileName}:`, error);
          reject(error);
        });
        
        stream.on('finish', async () => {
          try {
            await fileUpload.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            console.log(`✅ FirebaseStorage: File uploaded successfully: ${publicUrl}`);
            resolve(publicUrl);
          } catch (error) {
            console.error(`❌ FirebaseStorage: Error making file public:`, error);
            reject(error);
          }
        });
        
        stream.end(file.buffer);
      });
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error in uploadFileToStorage:`, error);
      throw error;
    }
  }
}

export const storage = new FirebaseStorage();