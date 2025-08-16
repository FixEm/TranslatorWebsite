import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Firebase-compatible types (for when not using Drizzle)
// Job interface for student translators to create job postings
export interface Job {
  id: string;
  userId: string; // Reference to the user who created the job
  title: string;
  description: string;
  budget: number;
  deadline: string; // ISO date string
  category: string;
  skills: string[];
  status: 'active' | 'in-progress' | 'completed' | 'cancelled';
  difficulty?: 'easy' | 'medium' | 'hard';
  // User data from verification (populated when creating job)
  translatorName: string;
  translatorCity: string;
  translatorHskLevel?: string;
  translatorExperience: string;
  translatorServices: string[];
  // Availability for this specific job
  availability: {
    isAvailable: boolean;
    schedule: Array<{
      date: string; // YYYY-MM-DD format
      timeSlots: Array<{
        startTime: string; // HH:mm format
        endTime: string; // HH:mm format
        isAvailable: boolean;
      }>;
    }>;
    timezone?: string;
  };
  applicationsCount: number;
  rating?: number;
  isBookmarked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsertJob {
  userId: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  skills: string[];
  translatorName: string;
  translatorCity: string;
  translatorHskLevel?: string;
  translatorExperience: string;
  translatorServices: string[];
  availability: {
    isAvailable: boolean;
    schedule: Array<{
      date: string;
      timeSlots: Array<{
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }>;
    }>;
    timezone?: string;
  };
}

export interface FirebaseServiceProvider {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  city: string;
  services: string[]; // Firebase stores as array
  experience: string;
  pricePerDay: string;
  description: string;
  languages: Array<{ language: string; level: string }>; // Firebase stores as array
  profileImage: string | null;
  identityDocument: string | null;
  certificates: string[] | null; // Firebase stores as array
  isVerified: boolean;
  rating: string;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  // New verification workflow fields
  googleId?: string;
  studentIdDocument?: string | null;
  hskCertificate?: string | null;
  cvDocument?: string | null;
  introVideo?: string | null;
  verificationSteps: {
    emailVerified: boolean;
    studentIdUploaded: boolean;
    hskUploaded: boolean;
    cvUploaded: boolean;
    introVideoUploaded: boolean;
    adminApproved: boolean;
    hskStatus?: 'pending' | 'approved' | 'rejected';
    studentIdStatus?: 'pending' | 'approved' | 'rejected';
    cvStatus?: 'pending' | 'approved' | 'rejected';
    availabilitySet?: boolean;
  };
  completenessScore: number; // 0-100
  studentEmail?: string; // for .ac.id or .edu.cn verification
  intent: 'translator' | 'tour_guide' | 'both';
  yearsInChina?: number;
  // Availability system
  availability?: {
    isAvailable: boolean;
    schedule: Array<{
      date: string; // YYYY-MM-DD format
      timeSlots: Array<{
        startTime: string; // HH:mm format
        endTime: string; // HH:mm format
        isAvailable: boolean;
      }>;
    }>;
    recurringPatterns?: Array<{
      dayOfWeek: number; // 0-6 (Sunday-Saturday)
      timeSlots: Array<{
        startTime: string;
        endTime: string;
      }>;
      isActive: boolean;
    }>;
    unavailablePeriods?: Array<{
      startDate: string; // YYYY-MM-DD
      endDate: string; // YYYY-MM-DD
      reason?: string; // e.g., "vacation", "exams"
    }>;
    lastUpdated: Date;
    timezone?: string; // e.g., "Asia/Shanghai"
  };
}

export interface FirebaseApplication {
  id: string;
  name: string;
  email: string;
  password?: string; // Added for registration
  whatsapp: string;
  city: string;
  services: string[]; // Firebase stores as array
  experience: string;
  pricePerDay: string;
  description: string;
  profileImage: string | null;
  identityDocument: string | null;
  certificates: string[] | null; // Firebase stores as array
  status: string;
  createdAt: Date;
  // New verification workflow fields
  googleId?: string;
  firebaseUid?: string; // Firebase Auth user ID
  studentIdDocument?: string | null;
  hskCertificate?: string | null;
  hskLevel?: string | null; // HSK level determined by admin after certificate review
  cvDocument?: string | null;
  introVideo?: string | null;
  verificationSteps: {
    emailVerified: boolean;
    studentIdUploaded: boolean;
    hskUploaded: boolean;
    cvUploaded: boolean;
    introVideoUploaded: boolean;
    adminApproved: boolean;
    hskStatus?: 'pending' | 'approved' | 'rejected';
    studentIdStatus?: 'pending' | 'approved' | 'rejected';
    cvStatus?: 'pending' | 'approved' | 'rejected';
    availabilitySet?: boolean;
  };
  completenessScore: number;
  studentEmail?: string;
  intent: 'translator' | 'tour_guide' | 'both';
  yearsInChina?: number;
  adminNotes?: string; // For admin review comments
  questionnaireData?: any; // Role-specific questionnaire responses
  // Recruitment pipeline fields
  recruitmentStatus?: 'pending_interview' | 'interviewed' | 'final_approval' | 'accepted' | 'rejected';
  finalStatus?: 'pending' | 'approved' | 'rejected';
  // Availability system
  availability?: {
    isAvailable: boolean;
    schedule: Array<{
      date: string; // YYYY-MM-DD format
      timeSlots: Array<{
        startTime: string; // HH:mm format
        endTime: string; // HH:mm format
        isAvailable: boolean;
      }>;
    }>;
    recurringPatterns?: Array<{
      dayOfWeek: number; // 0-6 (Sunday-Saturday)
      timeSlots: Array<{
        startTime: string;
        endTime: string;
      }>;
      isActive: boolean;
    }>;
    unavailablePeriods?: Array<{
      startDate: string; // YYYY-MM-DD
      endDate: string; // YYYY-MM-DD
      reason?: string; // e.g., "vacation", "exams"
    }>;
    lastUpdated: Date;
    timezone?: string; // e.g., "Asia/Shanghai"
  };
}

export interface FirebaseContact {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string | null;
  serviceProviderId: string;
  message: string;
  createdAt: Date;
}

export interface FirebaseUser {
  id: string;
  username: string;
  password: string;
  googleId?: string;
  email?: string;
  profileImage?: string;
  role: 'user' | 'admin' | 'translator';
  status: 'verified' | 'pending' | 'rejected'; // Represents the user's verification or recruitment status
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  googleId: text("google_id"),
  email: text("email"),
  profileImage: text("profile_image"),
  role: text("role").default("user"), // 'user' | 'admin' | 'translator'
});

export const serviceProviders = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  whatsapp: text("whatsapp").notNull(),
  city: text("city").notNull(),
  services: jsonb("services").notNull(), // Array of service types
  experience: text("experience").notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  languages: jsonb("languages").notNull(), // Array of languages with proficiency
  profileImage: text("profile_image"),
  identityDocument: text("identity_document"),
  certificates: jsonb("certificates"), // Array of certificate URLs
  isVerified: boolean("is_verified").default(false),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
  // New verification workflow fields
  googleId: text("google_id"),
  studentIdDocument: text("student_id_document"),
  hskCertificate: text("hsk_certificate"),
  cvDocument: text("cv_document"),
  introVideo: text("intro_video"),
  verificationSteps: jsonb("verification_steps").default(JSON.stringify({
    emailVerified: false,
    studentIdUploaded: false,
    hskUploaded: false,
    cvUploaded: false,
    introVideoUploaded: false,
    adminApproved: false
  })),
  completenessScore: integer("completeness_score").default(0),
  studentEmail: text("student_email"),
  intent: text("intent").notNull().default("translator"), // 'translator' | 'tour_guide' | 'both'
  yearsInChina: integer("years_in_china"),
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  password: text("password"), // Added for registration
  whatsapp: text("whatsapp").notNull(),
  city: text("city").notNull(),
  services: jsonb("services").notNull(),
  experience: text("experience").notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  profileImage: text("profile_image"),
  identityDocument: text("identity_document"),
  certificates: jsonb("certificates"),
  status: text("status").default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").default(sql`now()`),
  // New verification workflow fields
  googleId: text("google_id"),
  studentIdDocument: text("student_id_document"),
  hskCertificate: text("hsk_certificate"),
  cvDocument: text("cv_document"),
  introVideo: text("intro_video"),
  verificationSteps: jsonb("verification_steps").default(JSON.stringify({
    emailVerified: false,
    studentIdUploaded: false,
    hskUploaded: false,
    cvUploaded: false,
    introVideoUploaded: false,
    adminApproved: false
  })),
  completenessScore: integer("completeness_score").default(0),
  studentEmail: text("student_email"),
  intent: text("intent").notNull().default("translator"),
  yearsInChina: integer("years_in_china"),
  adminNotes: text("admin_notes"),
  questionnaireData: jsonb("questionnaire_data"), // Role-specific questionnaire responses
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email").notNull(),
  clientPhone: text("client_phone"),
  serviceProviderId: text("service_provider_id").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  isVerified: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  verificationSteps: true,
  completenessScore: true,
}).extend({
  intent: z.enum(['translator', 'tour_guide', 'both']).default('translator'),
  yearsInChina: z.number().optional(),
  googleId: z.string().optional(),
  studentEmail: z.string().optional(),
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  status: true,
  createdAt: true,
  verificationSteps: true,
  completenessScore: true,
  adminNotes: true,
}).extend({
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string().min(6, "Konfirmasi password minimal 6 karakter"),
  intent: z.enum(['translator', 'tour_guide', 'both']).default('translator'),
  yearsInChina: z.number().optional(),
  googleId: z.string().optional(),
  studentEmail: z.string().optional(),
  questionnaireData: z.any().optional(), // Allow any questionnaire structure
  // Make certain fields optional with defaults
  description: z.string().default(""),
  services: z.array(z.string()).default([]),
  certificates: z.array(z.string()).default([]),
  profileImage: z.string().nullable().default(null),
  identityDocument: z.string().nullable().default(null),
  pricePerDay: z.string().default("0"),
  experience: z.string().default(""),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password dan konfirmasi password tidak sama",
  path: ["confirmPassword"],
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
}).extend({
  googleId: z.string().optional(),
  email: z.string().optional(),
  profileImage: z.string().optional(),
  role: z.enum(['user', 'admin', 'translator']).default('user'),
});

export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect | FirebaseServiceProvider;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect | FirebaseApplication;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect | FirebaseContact;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect | FirebaseUser;
