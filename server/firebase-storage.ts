import 'dotenv/config';
import { type ServiceProvider, type InsertServiceProvider, type Application, type InsertApplication, type Contact, type InsertContact, type User, type InsertUser } from "@shared/schema";
import { db } from "./firebase";

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
    const newProvider = {
      ...provider,
      id: '', // Will be set after creation
      isVerified: false,
      rating: "0",
      reviewCount: 0,
      profileImage: provider.profileImage || null,
      identityDocument: provider.identityDocument || null,
      certificates: provider.certificates || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      // New verification workflow fields
      googleId: provider.googleId || null,
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
      intent: provider.intent || 'translator',
      studentEmail: provider.studentEmail || null,
      yearsInChina: provider.yearsInChina || null
    };
    
    const docRef = await this.serviceProvidersCollection.add(newProvider);
    return { ...newProvider, id: docRef.id } as ServiceProvider;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const newApplication = {
      ...application,
      id: '', // Will be set after creation
      status: "pending",
      profileImage: application.profileImage || null,
      identityDocument: application.identityDocument || null,
      certificates: application.certificates || null,
      createdAt: new Date(),
      // New verification workflow fields
      googleId: application.googleId || null,
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
      intent: application.intent || 'translator',
      studentEmail: application.studentEmail || null,
      yearsInChina: application.yearsInChina || null,
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
    await this.applicationsCollection.doc(id).update({
      studentIdDocument: documentUrl,
      'verificationSteps.studentIdUploaded': true,
      updatedAt: new Date()
    });
  }

  async updateHskCertificate(id: string, certificateUrl: string): Promise<void> {
    await this.applicationsCollection.doc(id).update({
      hskCertificate: certificateUrl,
      'verificationSteps.hskUploaded': true,
      updatedAt: new Date()
    });
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
    const updateData: any = {
      updatedAt: new Date()
    };
    updateData[field] = value;
    
    await this.applicationsCollection.doc(id).update(updateData);
  }

  // Alias for getApplication to match expected naming
  async getApplicationById(id: string): Promise<Application | undefined> {
    return this.getApplication(id);
  }
}

export const storage = new FirebaseStorage();