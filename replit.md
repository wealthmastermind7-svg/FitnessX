# FitForge - Replit Configuration

## Overview

FitForge is a React Native fitness workout generator app built with Expo. The app allows users to discover pre-made workouts, generate custom workouts based on muscle groups and equipment, and track their fitness profile. It follows a local-first approach with no authentication required, storing user data locally via AsyncStorage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation with bottom tab navigator (3 tabs: Discover, Generate, Profile) and native stack navigator for detail screens
- **State Management**: TanStack React Query for server state, React hooks for local state
- **UI Approach**: Custom themed components (ThemedText, ThemedView, Card, Button) with dark theme by default
- **Animations**: React Native Reanimated for smooth interactions, expo-haptics for tactile feedback
- **Local Storage**: AsyncStorage for persisting user preferences and saved workouts

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Style**: RESTful JSON endpoints
- **External API Integration**: RapidAPI's Muscle Group Image Generator for workout generation
- **Development**: tsx for TypeScript execution

### Data Storage
- **Database Schema**: PostgreSQL with Drizzle ORM (schema defined but app primarily uses local storage)
- **Local Persistence**: AsyncStorage for user profile, preferences, and saved workouts
- **Schema Validation**: Zod with drizzle-zod for type-safe schemas

### Project Structure
```
client/           # React Native app code
  components/     # Reusable UI components
  screens/        # Screen components (Discover, Generate, Profile, WorkoutDetail)
  navigation/     # Navigation configuration
  hooks/          # Custom React hooks
  constants/      # Theme, colors, typography
  lib/            # API client utilities
server/           # Express backend
  routes.ts       # API endpoints
  storage.ts      # Data access layer
shared/           # Shared types and schemas
```

### Key Design Patterns
- **Path Aliases**: `@/` maps to `client/`, `@shared/` maps to `shared/`
- **Theming**: Centralized theme constants with useTheme hook for consistent styling
- **Error Handling**: ErrorBoundary component wraps the app for graceful error recovery
- **Screen Layout**: Safe area aware with transparent headers and blur effects on iOS

## External Dependencies

### Third-Party Services
- **RapidAPI Muscle Group Image Generator**: Used for generating workout plans and muscle group images (requires `RAPIDAPI_KEY` environment variable)

### Database
- **PostgreSQL**: Database configured via `DATABASE_URL` environment variable (Drizzle ORM handles migrations)

### Key Libraries
- **expo**: Core framework for React Native development
- **drizzle-orm**: SQL ORM for PostgreSQL
- **@tanstack/react-query**: Server state management
- **react-native-reanimated**: Smooth animations
- **expo-linear-gradient**: Gradient backgrounds
- **expo-haptics**: Touch feedback
- **@react-native-async-storage/async-storage**: Local data persistence

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `RAPIDAPI_KEY`: API key for muscle group image generator service
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests (auto-set in Replit)