import { FirebaseStorage } from "./firebase-storage";
import { ServiceProvider } from "@shared/schema";
import 'dotenv/config';

async function seedFirebaseData() {
  const firebaseStorage = new FirebaseStorage();
  
  console.log("🌱 Seeding Firebase with initial data...");
  
  // Sample verified service providers
  const providers: Omit<ServiceProvider, 'id'>[] = [
    {
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
      certificates: null,
      isVerified: true,
      rating: "5.0",
      reviewCount: 24,
      verificationSteps: [],
      completenessScore: 100,
      intent: "business",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
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
      certificates: null,
      isVerified: true,
      rating: "4.9",
      reviewCount: 18,
      verificationSteps: [],
      completenessScore: 100,
      intent: "tourism",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
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
      certificates: null,
      isVerified: true,
      rating: "4.8",
      reviewCount: 31,
      verificationSteps: [],
      completenessScore: 100,
      intent: "technology",
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ];

  try {
    for (const provider of providers) {
      // Check if provider already exists
      const existingProviders = await firebaseStorage.getServiceProviders();
      const exists = existingProviders.find(p => p.email === provider.email);
      
      if (!exists) {
        await firebaseStorage.createServiceProvider(provider as any);
        console.log(`✅ Created provider: ${provider.name}`);
      } else {
        console.log(`⏭️  Provider already exists: ${provider.name}`);
      }
    }
    
    console.log("🎉 Firebase seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Firebase:", error);
    process.exit(1);
  }
}

// Run if called directly
seedFirebaseData();
