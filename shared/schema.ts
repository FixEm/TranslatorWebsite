import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Firebase-compatible types (for when not using Drizzle)
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
}

export interface FirebaseApplication {
  id: string;
  name: string;
  email: string;
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
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
});

export const applications = pgTable("applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
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
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;
export type ServiceProvider = typeof serviceProviders.$inferSelect | FirebaseServiceProvider;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect | FirebaseApplication;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect | FirebaseContact;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect | FirebaseUser;
