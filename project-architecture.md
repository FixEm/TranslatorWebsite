# Project Architecture & File Overview

## JavaScript Framework

This project uses **React** (with TypeScript) for the frontend, bundled with **Vite**. Styling is handled by **Tailwind CSS**. The backend uses **Node.js** with **Firebase Admin SDK** and **Drizzle ORM** for Postgres.

---

## File/Folder Functionality

### Root Files

- `.env.example`: Example environment variables for Firebase and database credentials.
- `package.json`: Project dependencies and scripts.
- `vite.config.ts`, `tsconfig.json`: Vite and TypeScript configuration.
- `tailwind.config.ts`, `postcss.config.js`: Tailwind CSS and PostCSS configuration.

### `client/`

- `index.html`: Main HTML entry point for the React app.
- `src/`: Source code for the frontend.
  - `App.tsx`: Main React component.
  - `main.tsx`: Entry point for React rendering.
  - `index.css`: Global styles.
  - `components/`: Reusable React components (UI elements, modals, cards, etc.).
  - `hooks/`: Custom React hooks.
  - `lib/`: Utility functions and query client setup.
    - `utils.ts`: Utility for merging Tailwind and class names.
    - `queryClient.ts`: Sets up React Query client and API request logic.
    - `firebase.ts`: (empty, likely for client-side Firebase usage if needed)
  - `pages/`: Page-level React components (admin, home, profile, etc.).

### `server/`

- Backend logic, likely using Node.js.
- `firebase.ts`: Initializes Firebase Admin SDK for server-side Firestore and Storage access. Uses environment variables for credentials. Exports Firestore (`db`), Storage (`storage`), and the Firebase app instance (`app`).
- `firebase-storage.ts`: Likely handles file uploads/downloads to Firebase Storage.
- `index.ts`, `routes.ts`: Server entry point and API routes.
- `seed-firebase.ts`: Script to seed Firebase with initial data.
- `storage.ts`, `vite.ts`: Additional backend utilities.

### `shared/`

- `schema.ts`: Shared TypeScript interfaces and database schema definitions for both Firebase and Drizzle ORM/Postgres. Includes advanced verification workflow fields and completeness scoring.

---

## Customizations Beyond Basic Setup

- **Firebase Integration:** Uses Firebase Admin SDK for server-side access to Firestore and Storage. Credentials are loaded from environment variables.
- **Drizzle ORM:** Used for Postgres database access, with custom schemas for service providers, applications, contacts, and users.
- **Tailwind CSS:** Integrated for utility-first styling.
- **Custom Components:** Rich set of UI components for a modern user experience.
- **Advanced Verification Workflow:** Multi-step verification, admin approval, completeness scoring, and support for role-specific questionnaires.
- **React Query:** Used for data fetching and caching in the frontend (`queryClient.ts`).

---

## Firestore/Firebase Details

- **Server-side Firebase:** `server/firebase.ts` initializes Firebase Admin SDK using credentials from environment variables. It exports Firestore and Storage instances for use in backend logic.
- **Data Structure:** Shared interfaces in `shared/schema.ts` define how data is stored in Firestore (arrays, nested objects for verification, etc.).
- **Usage:** Backend code (not fully shown) likely uses these interfaces to read/write data to Firestore and Storage, supporting workflows like verification, onboarding, and profile management.

---

## Summary

This project is a full-stack web application using React (TypeScript, Vite, Tailwind) for the frontend and Node.js (Firebase Admin, Drizzle ORM) for the backend. It supports advanced user and service provider workflows, with custom database schemas and Firebase integration for authentication, storage, and data management.
