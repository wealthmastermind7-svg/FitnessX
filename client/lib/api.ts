/**
 * Centralized API Service Layer
 * 
 * PRODUCTION-SAFE: Works in both Expo Go and TestFlight
 * 
 * All API calls must go through this file. No exceptions.
 * This ensures:
 * - Proper environment variable handling for TestFlight
 * - Centralized error handling and logging
 * - Consistent URL construction
 * - No exposed API keys (all calls go through backend)
 */

import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra;

/**
 * Get the API base URL
 * Priority: 
 * 1. Build-time config (TestFlight/Production)
 * 2. Runtime environment variable (Expo Go)
 * 3. Fallback to localhost (development)
 */
function getBaseUrl(): string {
  let host: string | null = null;

  // 1. Try build-time config (works in TestFlight)
  if (extra?.apiDomain) {
    host = extra.apiDomain;
  }

  // 2. Try runtime environment variable (works in Expo Go)
  if (!host && process.env.EXPO_PUBLIC_DOMAIN) {
    host = process.env.EXPO_PUBLIC_DOMAIN;
  }

  // 3. Fallback for local development
  if (!host) {
    host = "localhost:5000";
    if (__DEV__) {
      console.warn("[API] No API domain configured, using localhost:5000");
    }
  }

  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  if (__DEV__) {
    console.log("[API] Base URL:", baseUrl);
  }

  return baseUrl;
}

/**
 * Central fetch wrapper with error handling
 */
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API error ${res.status}: ${text || res.statusText}`);
    }

    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await res.json();
    }

    return res as unknown as T;
  } catch (error) {
    if (__DEV__) {
      console.error("[API] Request failed:", endpoint, error);
    }
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  data?: unknown
): Promise<T> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * Build image URL for exercises (GIFs from backend proxy)
 */
export function getExerciseImageUrl(exerciseId: string, resolution: number = 180): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/exercises/image/${exerciseId}?resolution=${resolution}`;
}

/**
 * Build full-size GIF URL for exercise detail
 */
export function getExerciseGifUrl(exerciseId: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/exercises/gif/${exerciseId}`;
}

// ============================================
// TYPED API ENDPOINTS
// ============================================

export const api = {
  /**
   * Exercise endpoints
   */
  exercises: {
    list: (params?: { bodyPart?: string; search?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.bodyPart && params.bodyPart !== "all") {
        queryParams.set("bodyPart", params.bodyPart);
      }
      if (params?.search) {
        queryParams.set("search", params.search);
      }
      const query = queryParams.toString();
      return apiGet<ExerciseDBExercise[]>(`/api/exercises${query ? `?${query}` : ""}`);
    },
    getById: (id: string) => apiGet<ExerciseDBExercise>(`/api/exercises/${id}`),
    getByBodyPart: (bodyPart: string) => 
      apiGet<ExerciseDBExercise[]>(`/api/exercises/bodyPart/${bodyPart}`),
    search: (query: string) => 
      apiGet<ExerciseDBExercise[]>(`/api/exercises/name/${encodeURIComponent(query)}`),
  },

  /**
   * AI endpoints (all go through backend)
   */
  ai: {
    chat: (message: string, history?: Array<{ role: string; content: string }>) =>
      apiPost<{ message: string }>("/api/ai/chat", { message, history }),
    
    trainingProgram: (preferences: TrainingProgramRequest) =>
      apiPost<TrainingProgramResponse>("/api/ai/training-program", preferences),
    
    workoutFeedback: (workout: WorkoutFeedbackRequest) =>
      apiPost<WorkoutFeedbackResponse>("/api/ai/workout-feedback", workout),
    
    exerciseSubstitutions: (exercise: string, reason?: string, equipment?: string[]) =>
      apiPost<ExerciseSubstitutionResponse>("/api/ai/exercise-substitutions", { 
        exercise, reason, equipment 
      }),
    
    recoveryAdvice: (data: RecoveryAdviceRequest) =>
      apiPost<RecoveryAdviceResponse>("/api/ai/recovery-advice", data),
  },

  /**
   * Workout endpoints
   */
  workouts: {
    generate: (request: WorkoutGenerateRequest) =>
      apiPost<Workout>("/api/generate-workout", request),
  },

  /**
   * Nutrition endpoints
   */
  nutrition: {
    analyze: (meal: string) =>
      apiPost<NutritionAnalysis>("/api/nutrition/analyze", { meal }),
    suggestions: () =>
      apiGet<MealSuggestion[]>("/api/nutrition/suggestions"),
  },

  /**
   * Muscle group image
   */
  muscleGroups: {
    getImage: (muscleGroup: string) =>
      apiGet<{ image: string }>(`/api/muscle-group-image?muscle=${encodeURIComponent(muscleGroup)}`),
  },
};

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ExerciseDBExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  gifUrl: string;
  instructions: string[];
}

export interface TrainingProgramRequest {
  fitnessLevel: string;
  goals: string[];
  daysPerWeek: number;
  equipment: string[];
}

export interface TrainingProgramResponse {
  program: {
    weekNumber: number;
    days: Array<{
      day: string;
      focus: string;
      exercises: Array<{
        name: string;
        sets: number;
        reps: string;
        notes?: string;
      }>;
    }>;
  }[];
  tips: string[];
}

export interface WorkoutFeedbackRequest {
  exercises: Array<{
    name: string;
    sets: number;
    reps: number;
    weight?: number;
  }>;
  duration: number;
  perceivedEffort: number;
}

export interface WorkoutFeedbackResponse {
  strengths: string[];
  improvements: string[];
  nextSessionTips: string[];
  overallScore: number;
}

export interface ExerciseSubstitutionResponse {
  alternatives: Array<{
    name: string;
    reason: string;
    difficulty: string;
  }>;
}

export interface RecoveryAdviceRequest {
  recentWorkouts: string[];
  sleepHours: number;
  stressLevel: number;
  soreness: string[];
}

export interface RecoveryAdviceResponse {
  readinessScore: number;
  recommendations: string[];
  suggestedActivities: string[];
}

export interface WorkoutGenerateRequest {
  muscleGroups: string[];
  equipment: string[];
  description?: string;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string[];
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    muscleGroup: string;
  }>;
  difficulty: string;
}

export interface NutritionAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
}

export interface MealSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category: string;
}
