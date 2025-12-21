# FitForge - Replit Configuration

## Overview

FitForge is a React Native fitness workout generator app built with Expo. The app allows users to discover pre-made workouts, generate custom workouts based on muscle groups and equipment, and track their fitness profile. Premium features include AI-powered 8-week training programs and personalized workout coaching feedback.

Architecture: Local-first with AsyncStorage for user preferences and saved workouts. Premium features call OpenAI API (GPT-4o-mini) via Express backend. No authentication required.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Session Dec 21, 2025)

### AI Premium Features Implemented
- **AI Progressive Training Plans**: 8-week structured programs generated via GPT-4o-mini. Accessed from Generate screen (purple gradient button).
- **AI Workout Feedback**: Post-workout coaching feedback with strengths, improvement areas, and next-session tips. Accessed from Profile screen (Premium Features section).

### New Files
- `client/screens/TrainingProgramScreen.tsx` - Displays 8-week program with weekly progression
- `client/screens/WorkoutFeedbackScreen.tsx` - Form to log workouts and receive AI coaching feedback
- `server/services/ai.ts` - OpenAI integration for both features

### Modified Files
- `server/routes.ts` - Added `/api/ai/program` and `/api/ai/feedback` endpoints
- `client/screens/GenerateScreen.tsx` - Added "8-Week Program" premium button (purple gradient)
- `client/screens/ProfileScreen.tsx` - Added "AI Workout Feedback" premium button
- `client/navigation/RootStackNavigator.tsx` - Added navigation to new screens

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
- **Premium Features**: Purple gradient (#9D4EDD, #5A189A) differentiates premium vs free features (coral #FF6B6B)
- **API Cost Optimization**: GPT-4o-mini with strict token limits (~$0.005-$0.01 per generation)

## External Dependencies

### Third-Party Services
- **OpenAI API**: GPT-4o-mini for AI training programs and workout feedback (requires `OPENAI_API_KEY` secret from Replit)
- **RapidAPI Muscle Group Image Generator**: Workout visualization (requires `RAPIDAPI_KEY` environment variable)

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
- `OPENAI_API_KEY`: Secret key for OpenAI API (stored in Replit Secrets)
- `EXPO_PUBLIC_DOMAIN`: Public domain for API requests (auto-set in Replit)

### API Endpoints
- `POST /api/ai/program` - Generate 8-week training program (GPT-4o-mini)
- `POST /api/ai/feedback` - Generate workout feedback and coaching tips (GPT-4o-mini)
- `POST /api/muscle-image` - Generate muscle group visualization (RapidAPI)
- `GET /api/workouts` - Retrieve saved workouts