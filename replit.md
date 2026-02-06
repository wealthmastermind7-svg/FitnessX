# FitForge - Replit Configuration

## Overview

FitForge is a React Native fitness workout generator app built with Expo. It enables users to discover pre-made workouts, generate custom workouts based on muscle groups and equipment, and track their fitness journey. The app also offers premium features such as AI-powered 8-week training programs and personalized workout coaching feedback.

The project's ambition is to provide a comprehensive, local-first fitness solution with advanced AI capabilities, catering to both free and premium users. It aims to deliver a seamless and engaging user experience in the fitness tracking and workout generation market.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (v1.0.2 Build 7)

**Strava Removal:**
- Completely removed Strava integration from the application due to API limitations for commercial apps.
- Cleaned up `ProfileScreen.tsx`, `DiscoverScreen.tsx`, and `App.tsx`.
- Removed backend routes and service configurations for Strava.
- Updated `HealthSyncScreen.tsx` to remove Strava-specific UI and logic.

**Video Sharing Feature (v1.0.2 Build 5):**
- Added **"Share Video" button** to WorkoutDetailScreen for generating shareable workout summary videos
- Implemented **Remotion integration** for server-side programmatic video generation
- Videos include animated stats (duration, volume, calories, PRs), muscle group tags, and FitForge branding
- Created `/api/video/workout-summary` POST endpoint for video generation
- Videos are served from `/videos` static endpoint
- Uses expo-file-system and expo-sharing for downloading and sharing videos on native platforms

**Exercise Library Enhancements (v1.0.2 Build 4):**
- Added **Categories browsing section** to Discover screen (strength, cardio, mobility, stretching, plyometrics)
- Exercise details now display **difficulty levels** (beginner, intermediate, advanced) and **training categories**
- Backend updated with **high-resolution GIF support** (up to 720p) via resolution parameter
- Added list endpoints: `/api/exercises/bodyPartList`, `/api/exercises/targetList`, `/api/exercises/equipmentList`
- Exercise Browser supports filtering by both body part and training category

**Freemium Model Update:**
- Free users now limited to **5 generated and saved workouts** (previously unlimited generation, 5 save limit)
- Pro users can **generate and save up to 100 workouts** (vs 5)
- Messaging updated across all screens to reflect "generate and save" framing
- Paywall feature list updated: AI Chat Coach, Full Exercise Library (1,300+), Unlimited Workouts (generate & save up to 100)

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54.
- **Navigation**: React Navigation, utilizing bottom tab and native stack navigators.
- **State Management**: TanStack React Query for server state and React hooks for local state.
- **UI/UX**: Custom themed components with a default dark theme, incorporating React Native Reanimated for animations and expo-haptics for tactile feedback.
- **Local Storage**: AsyncStorage for user preferences and saved workouts.
- **Premium Feature Delineation**: A consistent purple gradient (`#9D4EDD`, `#5A189A`) is used to differentiate premium features from free features (coral `#FF6B6B`).

### Backend Architecture
- **Runtime**: Node.js with Express, using tsx for TypeScript execution.
- **API Style**: RESTful JSON endpoints.
- **External API Integration**: Proxies requests to RapidAPI services and OpenAI API.

### Data Storage
- **Local Persistence**: AsyncStorage for user profile, preferences, and saved workouts.
- **Database (Planned/Optional)**: PostgreSQL with Drizzle ORM, with schema validation using Zod.

### Feature Specifications
- **Onboarding Flow**: 4-screen guided introduction showcasing app capabilities (Welcome, Discover Exercises, AI Coach, Custom Workouts). Stored in AsyncStorage to show only on first launch.
- **Workout Generation**: Users can generate custom workouts based on muscle groups and equipment.
- **Exercise Browsing**: Access to a library of 1,300+ exercises with GIF demonstrations, search, filtering by body part and training category, plus metadata (difficulty, category, description).
- **AI Coach**: Chat-based fitness assistant for general fitness Q&A, form checks, and recovery recommendations (simplified from multi-mode to chat-only).
- **Workout Tracking**: Log workouts with exercises, sets, reps, and weight.
- **Progress Tracking**: Chart weight, heart rate, and body measurements.
- **Nutrition Planning**: Log meals, track macros, and get meal suggestions.
- **Subscription Management**: Integration with RevenueCat for managing premium access.
- **Strava Integration**: Connect Strava account to sync and display running, cycling, and other activities.
- **Freemium Model**: Free users can generate and save up to 5 workouts (browse first 10 exercises only). Pro users can generate and save up to 100 workouts with access to all 1,300+ exercises and AI Chat Coach.

### Project Structure
- `client/`: React Native app code (components, screens, navigation, hooks, constants, lib).
- `server/`: Express backend code (routes, storage).
- `shared/`: Shared types and schemas.

### Key Design Patterns
- **Path Aliases**: `@/` for `client/`, `@shared/` for `shared/`.
- **Theming**: Centralized theme constants and a `useTheme` hook.
- **Error Handling**: `ErrorBoundary` component for graceful error recovery.
- **API Cost Optimization**: Utilizes GPT-4o-mini with strict token limits.

## External Dependencies

### Third-Party Services
- **RevenueCat**: For in-app subscription management. Requires `EXPO_PUBLIC_REVENUECAT_API_KEY`.
- **OpenAI API**: GPT-4o-mini for all AI features (training programs, feedback, substitutions, recovery, chat). Requires `OPENAI_API_KEY`.
- **ExerciseDB API**: Provides 1,300+ exercises with animated GIFs, accessed via an Express backend proxy. Requires `RAPIDAPI_KEY`.
- **RapidAPI Muscle Group Image Generator**: Used for workout visualization. Requires `RAPIDAPI_KEY`.
- **RapidAPI AI Workout Planner**: Used for nutrition analysis and meal suggestions. Requires `RAPIDAPI_KEY`.

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable, used with Drizzle ORM.

### Key Libraries
- `expo`: Core framework.
- `drizzle-orm`: SQL ORM.
- `@tanstack/react-query`: Server state management.
- `react-native-reanimated`: Animations.
- `expo-linear-gradient`: Gradient backgrounds.
- `expo-haptics`: Haptic feedback.
- `@react-native-async-storage/async-storage`: Local data persistence.

### Environment Variables Required
- `DATABASE_URL`
- `RAPIDAPI_KEY` ✓ Configured
- `OPENAI_API_KEY` ✓ Configured
- `EXPO_PUBLIC_REVENUECAT_API_KEY` ✓ Configured
- `EXPO_PUBLIC_DOMAIN` (auto-set in Replit)
- `STRAVA_CLIENT_ID` ✓ Configured
- `STRAVA_CLIENT_SECRET` ✓ Configured

### Key API Endpoints
- **AI Endpoints**: `/api/ai/program`, `/api/ai/feedback`, `/api/ai/substitutions`, `/api/ai/recovery`, `/api/ai/chat`.
- **ExerciseDB Endpoints**: `/api/exercises`, `/api/exercises/bodyPart/:bodyPart`, `/api/exercises/target/:target`, `/api/exercises/equipment/:equipment`, `/api/exercises/name/:name`, `/api/exercises/image/:id`.
- **Nutrition Endpoints**: `/api/nutrition/analyze`, `/api/nutrition/suggestions`.
- **Strava Endpoints**: `/api/strava/config`, `/api/strava/token`, `/api/strava/refresh`, `/api/strava/activities`, `/api/strava/disconnect`.
- **Other Endpoints**: `/api/muscle-image`, `/api/workouts`.