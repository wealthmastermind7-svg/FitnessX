# FitForge - Replit Configuration

## Overview

FitForge is a React Native fitness workout generator app built with Expo. The app allows users to discover pre-made workouts, generate custom workouts based on muscle groups and equipment, and track their fitness profile. Premium features include AI-powered 8-week training programs and personalized workout coaching feedback.

Architecture: Local-first with AsyncStorage for user preferences and saved workouts. Premium features call OpenAI API (GPT-4o-mini) via Express backend. No authentication required.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Session Dec 22, 2025)

### Exercise Browsing Feature
- **Exercise Library**: 1,300+ exercises from ExerciseDB API with animated GIF demonstrations
- **ExerciseBrowserScreen**: Search bar, body part filters, pull-to-refresh, exercise cards with GIF thumbnails
- **ExerciseDetailScreen**: Full-screen animated GIF, step-by-step instructions, AI-powered exercise alternatives
- **DiscoverScreen**: Added prominent "Exercise Library" card for quick access

### New Files (Dec 22)
- `client/screens/ExerciseBrowserScreen.tsx` - Browse and search 1,300+ exercises with filters
- `client/screens/ExerciseDetailScreen.tsx` - Full exercise details with animated demos and AI alternatives

### AI Premium Features (Dec 21)
- **AI Progressive Training Plans**: 8-week structured programs generated via GPT-4o-mini. Accessed from Generate screen (purple gradient button).
- **AI Workout Feedback**: Post-workout coaching feedback with strengths, improvement areas, and next-session tips. Accessed from Profile screen (Premium Features section).
- **AI Exercise Substitutions**: Smart exercise alternatives based on equipment and constraints.
- **AI Recovery Advisor**: Training readiness analysis and recovery recommendations.

### New Files (Dec 21)
- `client/screens/TrainingProgramScreen.tsx` - Displays 8-week program with weekly progression
- `client/screens/WorkoutFeedbackScreen.tsx` - Form to log workouts and receive AI coaching feedback
- `client/screens/RecoveryAdvisorScreen.tsx` - AI recovery and training readiness analysis
- `server/services/ai.ts` - OpenAI integration for all AI features

### Modified Files
- `server/routes.ts` - Added ExerciseDB endpoints and AI endpoints (`/api/exercises/*`, `/api/ai/*`)
- `client/screens/GenerateScreen.tsx` - Added "8-Week Program" premium button (purple gradient)
- `client/screens/ProfileScreen.tsx` - Added AI premium feature buttons
- `client/screens/DiscoverScreen.tsx` - Added Exercise Library card
- `client/navigation/RootStackNavigator.tsx` - Added navigation to all new screens

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
- **OpenAI API**: GPT-4o-mini for AI training programs, feedback, substitutions, and recovery advice (requires `OPENAI_API_KEY` secret from Replit)
- **ExerciseDB API**: 1,300+ exercises with animated GIFs (requires `RAPIDAPI_KEY` environment variable)
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
**AI Endpoints (Premium)**
- `POST /api/ai/program` - Generate 8-week training program (GPT-4o-mini)
- `POST /api/ai/feedback` - Generate workout feedback and coaching tips (GPT-4o-mini)
- `POST /api/ai/substitutions` - Generate exercise alternatives (GPT-4o-mini)
- `POST /api/ai/recovery` - Analyze training readiness and recovery (GPT-4o-mini)

**ExerciseDB Endpoints**
- `GET /api/exercises` - Browse all exercises with pagination
- `GET /api/exercises/bodyPart/:bodyPart` - Filter exercises by body part
- `GET /api/exercises/target/:target` - Filter exercises by target muscle
- `GET /api/exercises/equipment/:equipment` - Filter exercises by equipment
- `GET /api/exercises/name/:name` - Search exercises by name

**Other Endpoints**
- `POST /api/muscle-image` - Generate muscle group visualization (RapidAPI)
- `GET /api/workouts` - Retrieve saved workouts