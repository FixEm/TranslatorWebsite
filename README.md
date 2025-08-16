Project Overview
This is a Translator Website - a full-stack web application that connects students/translators with clients. It's a marketplace platform specifically designed for language services, with a focus on Chinese language translation and tour guiding services.
Tech Stack
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend: Node.js + Express + Firebase Admin SDK
Database: Firebase Firestore (primary) + Drizzle ORM for Postgres (secondary)
Authentication: JWT + Firebase Auth + Custom auth system
UI Components: Radix UI + shadcn/ui components
State Management: React Query (TanStack Query) + React Context
Routing: Wouter (lightweight React router)
File Storage: Firebase Storage
Email: Nodemailer for verification emails
Core Business Logic
User Types & Roles
Regular Users: Can search and book translators
Translators/Service Providers: Can offer translation and tour guide services
Admins: Can approve applications and manage the platform
Service Categories
Translation Services: Chinese language translation
Tour Guide Services: Travel assistance in China
Combined Services: Both translation and tour guiding
Verification Workflow
The platform has a sophisticated 5-step verification system:
Email Verification - Basic email confirmation
Student ID Upload - Academic verification (.ac.id or .edu.cn emails)
HSK Certificate - Chinese proficiency certification
CV Upload - Professional background
Intro Video - Personal introduction
Admin Approval - Final verification step
Completeness Scoring
0-100 scoring system based on verification steps completed
Recruitment pipeline: pending_interview → interviewed → final_approval → accepted/rejected
Status tracking: pending, approved, rejected for each verification step
Key Data Models
Service Provider Profile
Job Posting System
Availability Management
Date-based scheduling with time slots
Recurring patterns (weekly schedules)
Unavailable periods (vacations, exams)
Timezone support (Asia/Shanghai default)
Architecture Patterns
Frontend Structure
Component-based architecture with reusable UI components
Page-level routing for main sections
Context-based state management for authentication
Custom hooks for mobile detection and toast notifications
Form handling with React Hook Form + Zod validation
Backend Structure
Express.js server with middleware for logging and error handling
Firebase integration for storage and authentication
File upload handling with Multer (5MB limit)
JWT-based authentication with bcrypt password hashing
Email service integration for verification workflows
Data Flow
Client-side: React Query for API calls and caching
Server-side: Firebase Admin SDK for Firestore operations
Validation: Zod schemas for type safety and validation
File handling: Firebase Storage for document and image uploads
Key Features
For Service Providers
Multi-step onboarding with progress tracking
Document verification system
Availability management with calendar interface
Profile completeness scoring
Admin review workflow
For Clients
Service provider search with filtering (city, services, rating)
Booking system with availability checking
Contact forms for direct communication
Rating and review system
For Admins
Application review dashboard
Verification workflow management
User management and approval system
Completeness score monitoring
Development Workflow
Monorepo structure with shared schemas
TypeScript throughout for type safety
Environment-based configuration (dev/prod)
Hot reloading with Vite in development
Build optimization with esbuild for production

given this give me important rules to give to the ai to make the ai do concise coding and no reptition