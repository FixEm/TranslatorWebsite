import { type ServiceProvider, type InsertServiceProvider, type Application, type InsertApplication, type Contact, type InsertContact, type User, type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getServiceProviders(filters?: { city?: string; services?: string[]; minRating?: number }): Promise<ServiceProvider[]>;
  getServiceProvider(id: string): Promise<ServiceProvider | undefined>;
  createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider>;
  updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | undefined>;
  
  getApplications(status?: string): Promise<Application[]>;
  getApplication(id: string): Promise<Application | undefined>;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplicationStatus(id: string, status: string): Promise<Application | undefined>;
  
  createContact(contact: InsertContact): Promise<Contact>;
  getContacts(): Promise<Contact[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private serviceProviders: Map<string, ServiceProvider>;
  private applications: Map<string, Application>;
  private contacts: Map<string, Contact>;

  constructor() {
    this.users = new Map();
    this.serviceProviders = new Map();
    this.applications = new Map();
    this.contacts = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed with some sample verified service providers
    const providers: ServiceProvider[] = [
      {
        id: "1",
        name: "Andi Pratama",
        email: "andi.pratama@email.com",
        whatsapp: "+86 138 0013 8000",
        city: "Shanghai",
        services: ["translator", "tour_guide"],
        experience: "6-10",
        pricePerDay: "300.00",
        description: "Penerjemah profesional dengan pengalaman 8 tahun di China. Spesialisasi dalam bidang bisnis, hukum, dan teknologi. Telah menangani lebih dari 200 proyek terjemahan dan interpretasi untuk perusahaan multinasional dan delegasi pemerintah.",
        languages: [
          { language: "Indonesia", level: "Native" },
          { language: "Mandarin", level: "Fluent" },
          { language: "English", level: "Advanced" },
          { language: "Cantonese", level: "Intermediate" }
        ],
        profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        identityDocument: null,
        certificates: [],
        isVerified: true,
        rating: "5.0",
        reviewCount: 24,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "Sari Dewi",
        email: "sari.dewi@email.com",
        whatsapp: "+86 138 0013 8001",
        city: "Beijing",
        services: ["tour_guide"],
        experience: "4-5",
        pricePerDay: "250.00",
        description: "Spesialis tour guide wisata budaya dan sejarah. Memiliki sertifikat resmi dari pemerintah China dan pengalaman 5 tahun.",
        languages: [
          { language: "Indonesia", level: "Native" },
          { language: "Mandarin", level: "Fluent" },
          { language: "English", level: "Intermediate" }
        ],
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        identityDocument: null,
        certificates: [],
        isVerified: true,
        rating: "4.9",
        reviewCount: 18,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Rahman Hakim",
        email: "rahman.hakim@email.com",
        whatsapp: "+86 138 0013 8002",
        city: "Guangzhou",
        services: ["translator"],
        experience: "6-10",
        pricePerDay: "400.00",
        description: "Ahli dalam bidang teknologi dan manufaktur. Pengalaman mendampingi delegasi bisnis dan pameran dagang internasional.",
        languages: [
          { language: "Indonesia", level: "Native" },
          { language: "Mandarin", level: "Fluent" },
          { language: "English", level: "Advanced" }
        ],
        profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
        identityDocument: null,
        certificates: [],
        isVerified: true,
        rating: "4.8",
        reviewCount: 31,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    providers.forEach(provider => {
      this.serviceProviders.set(provider.id, provider);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getServiceProviders(filters?: { city?: string; services?: string[]; minRating?: number }): Promise<ServiceProvider[]> {
    let providers = Array.from(this.serviceProviders.values()).filter(p => p.isVerified);
    
    if (filters?.city) {
      providers = providers.filter(p => p.city.toLowerCase() === filters.city!.toLowerCase());
    }
    
    if (filters?.services && filters.services.length > 0) {
      providers = providers.filter(p => 
        filters.services!.some(service => (p.services as string[]).includes(service))
      );
    }
    
    if (filters?.minRating) {
      providers = providers.filter(p => parseFloat(p.rating || "0") >= filters.minRating!);
    }
    
    return providers;
  }

  async getServiceProvider(id: string): Promise<ServiceProvider | undefined> {
    return this.serviceProviders.get(id);
  }

  async createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider> {
    const id = randomUUID();
    const newProvider: ServiceProvider = {
      ...provider,
      id,
      isVerified: false,
      rating: "0",
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.serviceProviders.set(id, newProvider);
    return newProvider;
  }

  async updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | undefined> {
    const provider = this.serviceProviders.get(id);
    if (!provider) return undefined;
    
    const updated = { ...provider, ...updates, updatedAt: new Date() };
    this.serviceProviders.set(id, updated);
    return updated;
  }

  async getApplications(status?: string): Promise<Application[]> {
    let applications = Array.from(this.applications.values());
    
    if (status) {
      applications = applications.filter(app => app.status === status);
    }
    
    return applications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getApplication(id: string): Promise<Application | undefined> {
    return this.applications.get(id);
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const id = randomUUID();
    const newApplication: Application = {
      ...application,
      id,
      status: "pending",
      createdAt: new Date(),
    };
    this.applications.set(id, newApplication);
    return newApplication;
  }

  async updateApplicationStatus(id: string, status: string): Promise<Application | undefined> {
    const application = this.applications.get(id);
    if (!application) return undefined;
    
    const updated = { ...application, status };
    this.applications.set(id, updated);
    return updated;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const newContact: Contact = {
      ...contact,
      id,
      createdAt: new Date(),
    };
    this.contacts.set(id, newContact);
    return newContact;
  }

  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
