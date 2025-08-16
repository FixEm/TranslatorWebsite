import 'dotenv/config';
import { type FirebaseServiceProvider, type InsertServiceProvider, type FirebaseApplication, type InsertApplication, type FirebaseContact, type InsertContact, type User, type InsertUser, type Job, type InsertJob } from "@shared/schema";
import { db, storage as firebaseStorage } from "./firebase";

export class FirebaseStorage {
  private usersCollection = db.collection('users');
  private serviceProvidersCollection = db.collection('service_providers');
  private applicationsCollection = db.collection('applications');
  private contactsCollection = db.collection('contacts');
  private jobsCollection = db.collection('jobs');
  private bookingsCollection = db.collection('bookings');

  // User methods
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
    return { id: docRef.id, status: 'pending', ...user };
  }

  // Service Provider methods
  async getServiceProviders(filters?: { city?: string; services?: string[]; minRating?: number; email?: string }): Promise<FirebaseServiceProvider[]> {
    console.log("🔥 Firebase: Getting service providers with filters:", filters);
    
    let query: any = this.serviceProvidersCollection;
    
    if (!filters?.email) {
      query = query.where('verificationSteps.adminApproved', '==', true);
    }
    
    if (filters?.city) {
      query = query.where('city', '==', filters.city);
    }
    
    if (filters?.email) {
      query = query.where('email', '==', filters.email);
    }
    
    const snapshot = await query.get();
    let providers = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const { id: _, ...cleanData } = data;
      
      return {
        ...cleanData,
        id: doc.id
      } as FirebaseServiceProvider;
    });
    
    if (filters?.services && filters.services.length > 0) {
      providers = providers.filter((p: FirebaseServiceProvider) =>
        p.services && Array.isArray(p.services) && p.services.some((service: string) => filters.services!.includes(service))
      );
    }
    
    if (filters?.minRating) {
      providers = providers.filter((p: FirebaseServiceProvider) => parseFloat(p.rating || "0") >= filters.minRating!);
    }
    
    return providers;
  }

  async getServiceProvider(id: string): Promise<FirebaseServiceProvider | undefined> {
    const doc = await this.serviceProvidersCollection.doc(id).get();
    if (!doc.exists) return undefined;
    
    const data = doc.data() || {};
    const { id: _, ...cleanData } = data;
    
    return {
      ...cleanData,
      id: doc.id
    } as FirebaseServiceProvider;
  }

  async createServiceProvider(provider: InsertServiceProvider): Promise<FirebaseServiceProvider> {
    const docRef = await this.serviceProvidersCollection.add({
      ...provider,
      isVerified: false,
      rating: "0",
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationSteps: {
        emailVerified: false,
        studentIdUploaded: false,
        hskUploaded: false,
        cvUploaded: false,
        introVideoUploaded: false,
        adminApproved: false
      },
      completenessScore: 0
    });
    return { id: docRef.id, ...provider } as FirebaseServiceProvider;
  }

  // Application methods
  async createApplication(application: InsertApplication): Promise<FirebaseApplication> {
    const docRef = await this.applicationsCollection.add({
      ...application,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
      verificationSteps: {
        emailVerified: false,
        adminApproved: false,
        studentIdUploaded: false,
        hskUploaded: false,
        cvUploaded: false,
        introVideoUploaded: false,
      },
      recruitmentStatus: 'pending_interview',
      finalStatus: 'pending',
      completenessScore: 0,
      changeRequests: [],
      adminNotes: '',
      profileImage: null,
      identityDocument: null,
      certificates: [],
      availability: {
        isAvailable: true,
        schedule: [],
        recurringPatterns: [],
        unavailablePeriods: [],
        lastUpdated: new Date(),
        timezone: 'Asia/Shanghai'
      }
    });
    
    const createdApp = {
      id: docRef.id,
      ...application,
      status: 'pending',
      createdAt: new Date(),
      verificationSteps: {
        emailVerified: false,
        adminApproved: false,
        studentIdUploaded: false,
        hskUploaded: false,
        cvUploaded: false,
        introVideoUploaded: false,
      },
      completenessScore: 0
    };
    return createdApp as FirebaseApplication;
  }

  async getApplication(id: string): Promise<FirebaseApplication | undefined> {
    const doc = await this.applicationsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    
    const data = doc.data() || {};
    const { id: _, ...cleanData } = data;
    
    return {
      ...cleanData,
      id: doc.id
    } as FirebaseApplication;
  }

  async getApplications(status?: string): Promise<FirebaseApplication[]> {
    let query: any = this.applicationsCollection;
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const { id: _, ...cleanData } = data;
      
      return {
        ...cleanData,
        id: doc.id
      } as FirebaseApplication;
    });
  }

  async updateApplicationField(id: string, field: string, value: any): Promise<void> {
    const updateData: any = {};
    updateData[field] = value;
    updateData.updatedAt = new Date();
    
    await this.applicationsCollection.doc(id).update(updateData);
  }

  async updateApplicationStatus(id: string, status: string): Promise<FirebaseApplication> {
    await this.updateApplicationField(id, 'status', status);
    const updatedApplication = await this.getApplication(id);
    if (!updatedApplication) {
      throw new Error('Failed to retrieve updated application');
    }
    return updatedApplication;
  }

  async updateApplicationEmailVerification(applicationId: string, uid: string): Promise<void> {
    await this.updateApplicationField(applicationId, 'uid', uid);
    await this.updateApplicationField(applicationId, 'verificationSteps.emailVerified', true);
  }

  // Contact methods
  async createContact(contact: InsertContact): Promise<FirebaseContact> {
    const docRef = await this.contactsCollection.add({
      ...contact,
      createdAt: new Date(),
      status: 'pending'
    });
    
    const createdContact = {
      id: docRef.id,
      ...contact,
      createdAt: new Date(),
      status: 'pending'
    };
    return createdContact as FirebaseContact;
  }

  async getContacts(): Promise<FirebaseContact[]> {
    const snapshot = await this.contactsCollection.orderBy('createdAt', 'desc').get();
    
    return snapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      } as FirebaseContact;
    });
  }

  // Job methods
  async createJob(jobData: InsertJob): Promise<Job> {
    const newJob = {
      ...jobData,
      id: '',
      status: 'active' as const,
      applicationsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await this.jobsCollection.add(newJob);
    const createdJob = { ...newJob, id: docRef.id } as Job;
    
    return createdJob;
  }

  async getJobs(filters?: { userId?: string; status?: string; category?: string }): Promise<Job[]> {
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
      } as Job;
    });
  }

  async getJob(id: string): Promise<Job | undefined> {
    const doc = await this.jobsCollection.doc(id).get();
    
    if (!doc.exists) {
      return undefined;
    }
    
    const data = doc.data() || {};
    const { id: _, ...cleanData } = data;
    
    return {
      ...cleanData,
      id: doc.id
    } as Job;
  }

  // Booking methods
  async createBooking(bookingData: any): Promise<any> {
    const docRef = await this.bookingsCollection.add({
      ...bookingData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return { id: docRef.id, ...bookingData };
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
    
    await this.bookingsCollection.doc(id).update(updateData);
    
    const updatedBooking = await this.getBooking(id);
    return updatedBooking;
  }

  // File upload methods
  async uploadFileToStorage(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      console.log(`📤 FirebaseStorage: Uploading file to ${folder}:`, file.originalname);
      
      // Create a unique filename to prevent conflicts
      const timestamp = Date.now();
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${timestamp}_${Math.random().toString(36).substring(2)}.${fileExtension}`;
      
      // Upload file to Firebase Storage
      const bucket = firebaseStorage.bucket();
      const fileUpload = bucket.file(fileName);
      
      console.log(`📤 FirebaseStorage: Bucket name: ${bucket.name}`);
      console.log(`📤 FirebaseStorage: File path: ${fileName}`);
      console.log(`📤 FirebaseStorage: File size: ${file.size} bytes`);
      console.log(`📤 FirebaseStorage: File mimetype: ${file.mimetype}`);
      
      // Create write stream and upload file
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
            console.log(`📤 FirebaseStorage: File upload finished, making public...`);
            // Make the file publicly readable
            await fileUpload.makePublic();
            
            // Get the public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            console.log(`✅ FirebaseStorage: File uploaded successfully: ${publicUrl}`);
            resolve(publicUrl);
          } catch (error) {
            console.error(`❌ FirebaseStorage: Error making file public:`, error);
            reject(error);
          }
        });
        
        // Write the file buffer to the stream
        stream.end(file.buffer);
      });
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error in uploadFileToStorage:`, error);
      throw error;
    }
  }

  // File deletion methods
  async deleteFileFromStorage(fileUrl: string): Promise<void> {
    try {
      console.log(`🗑️ FirebaseStorage: Attempting to delete file: ${fileUrl}`);
      
      let filePath: string;
      
      if (fileUrl.includes('firebasestorage.googleapis.com')) {
        const urlParts = fileUrl.split('/o/');
        if (urlParts.length >= 2) {
          const encodedPath = urlParts[1].split('?')[0];
          filePath = decodeURIComponent(encodedPath);
        } else {
          throw new Error('Invalid Firebase Storage URL format');
        }
      } else if (fileUrl.includes('storage.googleapis.com')) {
        const urlParts = fileUrl.split('/');
        if (urlParts.length >= 5) {
          const pathParts = urlParts.slice(4);
          const lastPart = pathParts[pathParts.length - 1].split('?')[0];
          pathParts[pathParts.length - 1] = lastPart;
          filePath = pathParts.join('/');
        } else {
          throw new Error('Invalid storage URL format');
        }
      } else {
        throw new Error('Unsupported storage URL format');
      }
      
      const bucket = firebaseStorage.bucket();
      const file = bucket.file(filePath);
      
      const [exists] = await file.exists();
      if (!exists) {
        console.log(`⚠️ FirebaseStorage: File does not exist: ${filePath}`);
        return;
      }
      
      await file.delete();
      console.log(`✅ FirebaseStorage: File deleted successfully: ${filePath}`);
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error deleting file ${fileUrl}:`, error);
    }
  }

  async deleteApplicationDocuments(applicationId: string, documentTypes: string[]): Promise<void> {
    try {
      const application = await this.getApplication(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const updateData: any = {
        updatedAt: new Date()
      };

      for (const docType of documentTypes) {
        try {
          if (docType === 'hsk' && (application as any).hskCertificate) {
            await this.deleteFileFromStorage((application as any).hskCertificate);
            updateData.hskCertificate = null;
          }
          
          if (docType === 'studentId' && (application as any).studentIdDocument) {
            await this.deleteFileFromStorage((application as any).studentIdDocument);
            updateData.studentIdDocument = null;
          }

          if (docType === 'cv' && (application as any).cvDocument) {
            await this.deleteFileFromStorage((application as any).cvDocument);
            updateData.cvDocument = null;
          }

          if (docType === 'introVideo' && (application as any).introVideo) {
            updateData.introVideo = null;
            updateData['verificationSteps.introVideoUploaded'] = false;
          }
        } catch (fileDeleteError) {
          console.error(`⚠️ FirebaseStorage: Error deleting ${docType} file (continuing anyway):`, fileDeleteError);
          if (docType === 'hsk') {
            updateData.hskCertificate = null;
          } else if (docType === 'studentId') {
            updateData.studentIdDocument = null;
          } else if (docType === 'cv') {
            updateData.cvDocument = null;
          } else if (docType === 'introVideo') {
            updateData.introVideo = null;
            updateData['verificationSteps.introVideoUploaded'] = false;
          }
        }
      }

      await this.applicationsCollection.doc(applicationId).update(updateData);
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error deleting documents for application ${applicationId}:`, error);
      throw error;
    }
  }

  // Availability methods
  async updateApplicationAvailability(applicationId: string, availabilityData: any): Promise<void> {
    try {
      const cleanAvailabilityData = Object.fromEntries(
        Object.entries({
          ...availabilityData,
          lastUpdated: new Date()
        }).filter(([_, value]) => value !== undefined)
      );

      await this.applicationsCollection.doc(applicationId).update({
        availability: cleanAvailabilityData
      });
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error updating availability for application ${applicationId}:`, error);
      throw error;
    }
  }

  async getApplicationAvailability(applicationId: string): Promise<any> {
    try {
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

      return availability;
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error getting availability for application ${applicationId}:`, error);
      throw error;
    }
  }

  async updateServiceProviderAvailability(serviceProviderId: string, availabilityData: any): Promise<void> {
    try {
      const cleanAvailabilityData = Object.fromEntries(
        Object.entries({
          ...availabilityData,
          lastUpdated: new Date()
        }).filter(([_, value]) => value !== undefined)
      );

      await this.serviceProvidersCollection.doc(serviceProviderId).update({
        availability: cleanAvailabilityData
      });
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error updating availability for service provider ${serviceProviderId}:`, error);
      throw error;
    }
  }

  async getServiceProviderAvailability(serviceProviderId: string): Promise<any> {
    try {
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

      return availability;
    } catch (error) {
      console.error(`❌ FirebaseStorage: Error getting availability for service provider ${serviceProviderId}:`, error);
      throw error;
    }
  }

  // Alias for getApplication to match expected naming
  async getApplicationById(id: string): Promise<FirebaseApplication | undefined> {
    return this.getApplication(id);
  }
}

export const storage = new FirebaseStorage();
