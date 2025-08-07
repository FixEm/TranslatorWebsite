# PenerjemahChina - Indonesian Translator & Tour Guide Platform

## Overview

PenerjemahChina is a marketplace platform that connects Indonesian users with verified translators and tour guides in China. The platform allows users to search, filter, and contact qualified service providers across major Chinese cities. Service providers can register through an application process, and administrators can manage verification and approvals through a dedicated admin interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for build tooling
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Shadcn/UI component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom navy/silver color scheme and Inter font family
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js web framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API architecture with structured route handlers
- **File Uploads**: Multer middleware for handling profile images, identity documents, and certificates
- **Data Storage**: In-memory storage implementation with interface abstraction for future database migration
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)

### Database Schema Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Structure**:
  - `users` table for authentication
  - `service_providers` table for verified translators/guides
  - `applications` table for pending registration requests
  - `contacts` table for user inquiries
- **Data Types**: JSON columns for arrays (services, languages, certificates), decimal for pricing, timestamps for audit trails
- **Features**: UUID primary keys, soft verification flags, rating system with review counts

### Authentication & Authorization
- **Session-based Authentication**: Uses Express sessions for user state management
- **Role-based Access**: Distinguishes between regular users and administrators
- **Admin Dashboard**: Protected admin routes for application review and approval workflow

### File Management
- **Upload Handling**: Local file system storage with validation for images and documents
- **File Types**: Supports JPEG, PNG, PDF, DOC, DOCX formats
- **Size Limits**: 5MB maximum file size with proper error handling
- **Validation**: MIME type and extension checking for security

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection for production deployment
- **drizzle-orm & drizzle-kit**: Type-safe ORM and migration toolkit
- **@tanstack/react-query**: Server state management and caching
- **@hookform/resolvers & react-hook-form**: Form validation and handling
- **zod & drizzle-zod**: Runtime type validation and schema generation

### UI & Styling
- **@radix-ui/***: Comprehensive set of accessible UI primitives (20+ components)
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional class name utilities

### Development & Build Tools
- **vite**: Fast build tool and development server
- **typescript**: Type checking and compilation
- **esbuild**: Fast JavaScript bundler for production builds
- **@replit/vite-plugin-***: Replit-specific development enhancements

### Third-party Integrations
- **WhatsApp Business API**: Direct messaging integration for user-provider communication
- **Google Fonts**: Inter font family for consistent typography
- **Unsplash**: Placeholder images for service provider profiles
- **Multer**: File upload middleware for handling documents and images