# FitForge - Replit Configuration

## Overview

FitForge is a React Native fitness workout generator app built with Expo. It enables users to discover pre-made workouts, generate custom workouts based on muscle groups and equipment, and track their fitness journey. Key features include an extensive exercise library with animated GIFs, AI-powered workout generation, personalized coaching feedback, and comprehensive tracking for workouts, progress, and nutrition. The app also features a social community feed and a coach marketplace. Premium features leverage AI for advanced training programs and personalized advice, aiming to provide a comprehensive fitness solution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54.
- **Navigation**: React Navigation with a bottom tab navigator for core screens (Discover, Generate, Profile) and a native stack navigator for detail views.
- **State Management**: TanStack React Query for server-side data, React hooks for local state.
- **UI/UX Decisions**: Custom-themed components with a dark theme by default. Premium features are visually differentiated with a purple gradient.
- **Animations**: Utilizes React Native Reanimated for smooth interactions and `expo-haptics` for tactile feedback.
- **Local Storage**: `AsyncStorage` is used for persisting user preferences and saved workouts.
- **Pose Detection**: Integrates TensorFlow.js with the MoveNet model for real-time pose detection and form analysis for specific exercises (web-only for real-time tracking).

### Backend Architecture
- **Runtime**: Node.js with Express.
- **API Style**: RESTful JSON endpoints.
- **Development**: `tsx` for TypeScript execution.
- **Security**: All external API calls, especially those involving API keys (e.g., ExerciseDB, OpenAI), are proxied through the Express backend to prevent exposing keys to the client.

### Data Storage
- **Local Persistence**: `AsyncStorage` is the primary storage for user profiles, preferences, and saved workouts.
- **Database Schema**: While a PostgreSQL database with Drizzle ORM is configured, the application primarily relies on local storage for user data. Zod with `drizzle-zod` ensures type-safe schemas.

### Project Structure
- `client/`: Contains the React Native application code, organized into components, screens, navigation, hooks, constants, and utility libraries.
- `server/`: Houses the Express backend, including API routes and storage logic.
- `shared/`: Stores shared types and schemas used by both frontend and backend.

### Key Design Patterns
- **Path Aliases**: Uses `@/` for `client/` and `@shared/` for `shared/` for improved code readability.
- **Theming**: Centralized theme constants and a `useTheme` hook for consistent styling.
- **Error Handling**: An `ErrorBoundary` component provides graceful error recovery for the application.
- **API Cost Optimization**: Leverages GPT-4o-mini with strict token limits for AI features to manage API costs efficiently.

## External Dependencies

### Third-Party Services
- **OpenAI API**: Used for AI-powered features including 8-week training programs, workout feedback, exercise substitutions, recovery advice, and a conversational AI chat coach (GPT-4o-mini). Requires `OPENAI_API_KEY`.
- **ExerciseDB API**: Provides access to over 1,300 exercises with animated GIF demonstrations. Proxied via the backend; requires `RAPIDAPI_KEY`.
- **RapidAPI Muscle Group Image Generator**: Used for visualizing muscle groups during workout generation. Proxied via the backend; requires `RAPIDAPI_KEY`.
- **RapidAPI AI Workout Planner**: Integrated for nutrition analysis and meal suggestions. Proxied via the backend; requires `RAPIDAPI_KEY`.

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable, managed with Drizzle ORM.

### Key Libraries
- **expo**: Core framework for React Native development.
- **drizzle-orm**: SQL ORM for PostgreSQL.
- **@tanstack/react-query**: For server state management.
- **react-native-reanimated**: For animations.
- **expo-linear-gradient**: For gradient backgrounds.
- **expo-haptics**: For haptic feedback.
- **@react-native-async-storage/async-storage**: For local data persistence.
- **@tensorflow/tfjs-core** and **@tensorflow-models/pose-detection**: For AI pose detection using the MoveNet model.

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string.
- `RAPIDAPI_KEY`: API key for various RapidAPI services.
- `OPENAI_API_KEY`: Secret key for OpenAI API.
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests.

## Recent Changes (Dec 22, 2025)

### API Architecture Refactor
- **Created app.config.js**: Centralized environment variable configuration using `expo-constants` for build-time variable injection
- **Centralized API Client (client/lib/api.ts)**: All API calls now route through a single client that:
  - Constructs base URLs from `EXPO_PUBLIC_DOMAIN` via `Constants.expoConfig?.extra`
  - Provides typed helper functions: `getExerciseImageUrl()`, `getMuscleImageUrl()`, `getDualMuscleImageUrl()`, `getBaseMuscleImageUrl()`
  - No client-side API keys exposed
- **Production-Safe Build Pattern**: Set `EXPO_PUBLIC_API_DOMAIN` when building for TestFlight/App Store
- **Fixed Critical Scope Error in server/index.ts**: Resolved variable scope issue in `configureExpoAndLanding()` that was causing ERR_INVALID_ARG_TYPE errors
  - Variables `landingPageTemplate` and `appName` now declared at function scope, initialized within try-catch block
  - Added comprehensive error handling in `getAppName()`, `serveExpoManifest()`, and `setupErrorHandler()`