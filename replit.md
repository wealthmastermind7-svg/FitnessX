# FitForge - Replit Configuration

## Overview

FitForge is a React Native fitness workout generator app built with Expo. The app allows users to discover pre-made workouts, generate custom workouts based on muscle groups and equipment, and track their fitness profile. Premium features include AI-powered 8-week training programs and personalized workout coaching feedback.

Architecture: Local-first with AsyncStorage for user preferences and saved workouts. Premium features call OpenAI API (GPT-4o-mini) via Express backend. No authentication required.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (Session Dec 23, 2025)

### Consolidated AI Coach Interface (Dec 23)
- **Unified AI Coach Screen**: Consolidated all AI Pro features (Coach, Program, Feedback, Recovery) into a single mode-based interface
- **Mode Tabs**: 4 modes with distinct functionality:
  - **Coach Mode**: General fitness Q&A and personalized advice
  - **Program Mode**: 8-week training program generation with experience level input
  - **Feedback Mode**: Post-workout analysis with muscle group selector, duration, and difficulty
  - **Recovery Mode**: Training readiness analysis and recovery recommendations
- **Dynamic UI**: Mode-specific colors, icons, welcome messages, and sample prompts
- **Response Formatting**: Specialized rendering for each mode (program summaries, feedback strengths/improvements, recovery recommendations)
- **ProGate Integration**: All modes gated behind "FitForgeX Pro" entitlement

### RevenueCat Subscription Integration (Dec 23)
- **RevenueCat SDK**: Installed `react-native-purchases` and `react-native-purchases-ui` for in-app subscription management
- **RevenueCat Provider**: Created `client/lib/revenuecat.tsx` with context provider pattern, proper listener cleanup, and web platform fallbacks
- **ProGate Component**: Created `client/components/ProGate.tsx` for gating premium features behind "FitForgeX Pro" entitlement
- **PaywallScreen**: Full subscription purchase flow with RevenueCatUI.presentPaywall(), fallback UI, and web handling
- **CustomerCenterScreen**: Subscription management using RevenueCatUI.presentCustomerCenter() with platform-specific handling
- **Premium Feature Gating**: AI Coach with all modes wrapped with ProGate
- **Profile Screen**: Added subscription management section with Pro status display
- **DiscoverScreen**: Added PRO badges to AI feature cards, updated description for consolidated AI Coach
- **Environment**: `EXPO_PUBLIC_REVENUECAT_API_KEY` secret for API key (configured in Replit Secrets)
- **DEV_MODE_PRO_BYPASS**: Constant in revenuecat.tsx to bypass subscription checks during development

### New Files (Dec 23)
- `client/lib/revenuecat.tsx` - RevenueCat provider with initialization, purchases, and entitlement checking
- `client/components/ProGate.tsx` - HOC for gating premium features
- `client/screens/PaywallScreen.tsx` - Subscription purchase flow
- `client/screens/CustomerCenterScreen.tsx` - Subscription management

### Updated Files (Dec 23)
- `client/screens/AIChatScreen.tsx` - Completely rewritten with mode-based interface for all AI features

## Recent Changes (Session Dec 22, 2025 - Final Updates)

### Nutrition Feature Activation (Dec 22 - Final)
- **Integrated RapidAPI Nutrition API**: Connected NutritionScreen with real AI Workout Planner nutrition analysis API
- **Backend nutrition endpoints**: 
  - `POST /api/nutrition/analyze` - Analyzes meal nutrition (calories, protein, carbs, fats)
  - `GET /api/nutrition/suggestions` - Fetches meal suggestions with fallback defaults
- **Frontend integration**: Updated NutritionScreen to use React Query for fetching suggestions and analyzing meals via backend proxy
- **Profile screen activation**: Added "Health Tracking" section with buttons to Nutrition, Progress, and Workout Diary screens
- **Graceful fallbacks**: Both endpoints have built-in fallbacks if RapidAPI is unavailable, using sensible macro calculations

### Production Fixes for TestFlight Deployment
- **Fixed app startup crash in TestFlight**: Added fallback for `EXPO_PUBLIC_DOMAIN` environment variable in `client/lib/query-client.ts`. TestFlight builds don't have access to dynamic env vars that Expo Go provides. Now gracefully falls back to `localhost:5000` when env var is missing.
- **Enhanced error logging**: Updated `ErrorFallback.tsx` to always log critical errors and stack traces to console, enabling debugging of production issues in TestFlight logs.
- **API key management**: Added `RAPIDAPI_KEY` as a Replit secret for secure handling of ExerciseDB API authentication.
- **Backend exercise proxy**: All exercise data (1,300+ exercises) is now fetched through Express backend proxy (`/api/exercises/*` endpoints) for better reliability and HTTPS compliance in production.

### Major Feature Expansion - Competitor Parity Plus AI Advantage
Added 6 new major features to match and exceed competitor functionality:

1. **Workout Diary** (`WorkoutDiaryScreen.tsx`) - Log workouts with exercises, sets, reps, weight tracking, calendar view with completion indicators
2. **Progress Tracking** (`ProgressScreen.tsx`) - Weight and heart rate charts, body measurements tracking, visual graphs
3. **Nutrition Planning** (`NutritionScreen.tsx`) - Meal logging with macros (protein, carbs, fats, calories), daily intake goals, quick-add presets
4. **Social Community Feed** (`CommunityScreen.tsx`) - Posts with likes, dislikes, comments, bookmarks, verified users
5. **Coach Marketplace** (`CoachesScreen.tsx`) - Browse trainers with ratings, credentials, pricing, detailed profiles
6. **AI Chat Coach** (`AIChatScreen.tsx`) - Conversational AI fitness advisor powered by GPT-4o-mini with chat history

### Exercise Browsing Feature
- **Exercise Library**: 1,300+ exercises from ExerciseDB API with animated GIF demonstrations
- **ExerciseBrowserScreen**: Search bar, body part filters, pull-to-refresh, exercise cards with GIF thumbnails
- **ExerciseDetailScreen**: Full-screen animated GIF, step-by-step instructions, AI-powered exercise alternatives
- **DiscoverScreen**: Complete redesign with feature hub cards, AI coach banner, community/coaches section

### New Files (Dec 22)
- `client/screens/WorkoutDiaryScreen.tsx` - Workout logging with calendar and history
- `client/screens/ProgressScreen.tsx` - Weight/measurements charts and progress tracking
- `client/screens/NutritionScreen.tsx` - Meal planning with macro calculations
- `client/screens/CommunityScreen.tsx` - Social feed with posts, likes, comments
- `client/screens/CoachesScreen.tsx` - Coach marketplace with profiles and hiring
- `client/screens/AIChatScreen.tsx` - AI-powered conversational fitness coach with exercise GIF integration
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
- **RevenueCat**: In-app subscription management for iOS/Android (requires `EXPO_PUBLIC_REVENUECAT_API_KEY` secret from Replit)
- **OpenAI API**: GPT-4o-mini for AI training programs, feedback, substitutions, and recovery advice (requires `OPENAI_API_KEY` secret from Replit)
- **ExerciseDB API**: 1,300+ exercises with animated GIFs (requires `RAPIDAPI_KEY` environment variable)
- **RapidAPI Muscle Group Image Generator**: Workout visualization (requires `RAPIDAPI_KEY` environment variable)
- **RapidAPI AI Workout Planner**: Nutrition analysis and meal suggestions (requires `RAPIDAPI_KEY` environment variable)

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
- `POST /api/ai/chat` - Conversational AI fitness coach (GPT-4o-mini)

**ExerciseDB Endpoints**
- `GET /api/exercises` - Browse all exercises with pagination
- `GET /api/exercises/bodyPart/:bodyPart` - Filter exercises by body part
- `GET /api/exercises/target/:target` - Filter exercises by target muscle
- `GET /api/exercises/equipment/:equipment` - Filter exercises by equipment
- `GET /api/exercises/name/:name` - Search exercises by name
- `GET /api/exercises/image/:id` - Proxy for exercise GIF images (streams from ExerciseDB with auth)

**Nutrition Endpoints**
- `POST /api/nutrition/analyze` - Analyze meal nutrition data (RapidAPI AI Workout Planner)
- `GET /api/nutrition/suggestions` - Get meal suggestions (RapidAPI AI Workout Planner)

**Other Endpoints**
- `POST /api/muscle-image` - Generate muscle group visualization (RapidAPI)
- `GET /api/workouts` - Retrieve saved workouts