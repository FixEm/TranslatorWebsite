import 'dotenv/config';
import { type ServiceProvider, type InsertServiceProvider, type Application, type InsertApplication, type Contact, type InsertContact, type User, type InsertUser } from "@shared/schema";
import { db } from "./firebase";
import { IStorage } from "./storage-interface";

export class FirebaseStorage implements IStorage {
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

  async getServiceProviders(filters?: { city?: string; services?: string[]; minRating?: number }): Promise<ServiceProvider[]> {
    console.log("🔥 Firebase: Getting service providers with filters:", filters);
    
    // Temporarily remove the isVerified filter to see all data
    let query: any = this.serviceProvidersCollection;
    
    if (filters?.city) {
      query = query.where('city', '==', filters.city);
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
    const newProvider: ServiceProvider = {
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
    };
    
    const docRef = await this.serviceProvidersCollection.add(newProvider);
    return { ...newProvider, id: docRef.id };
  }

  async updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | undefined> {
    const updatedData = { ...updates, updatedAt: new Date() };
    await this.serviceProvidersCollection.doc(id).update(updatedData);
    
    const doc = await this.serviceProvidersCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as ServiceProvider;
  }

  async getApplications(status?: string): Promise<Application[]> {
    let query = this.applicationsCollection.orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status) as any;
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Application));
  }

  async getApplication(id: string): Promise<Application | undefined> {
    const doc = await this.applicationsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Application;
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const newApplication: Application = {
      ...application,
      id: '', // Will be set after creation
      status: "pending",
      profileImage: application.profileImage || null,
      identityDocument: application.identityDocument || null,
      certificates: application.certificates || null,
      createdAt: new Date(),
    };
    
    const docRef = await this.applicationsCollection.add(newApplication);
    return { ...newApplication, id: docRef.id };
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    await this.applicationsCollection.doc(id).update({ status });
    
    const doc = await this.applicationsCollection.doc(id).get();
    if (!doc.exists) return undefined;
    return { id: doc.id, ...doc.data() } as Application;
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
}

export const storage = new FirebaseStorage();