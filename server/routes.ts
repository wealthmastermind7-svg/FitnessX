import type { Express } from "express";
import { createServer, type Server } from "node:http";
import {
  generateTrainingProgram,
  generateWorkoutFeedback,
  generateExerciseSubstitutions,
  generateRecoveryAdvice,
  generateChatResponse,
  analyzeFoodImage,
} from "./services/ai";

interface WorkoutRequest {
  muscleGroups: string[];
  equipment: string[];
  description: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  muscleGroup: string;
}

interface Workout {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string[];
  exercises: Exercise[];
  difficulty: string;
}

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = "muscle-group-image-generator.p.rapidapi.com";
const EXERCISEDB_HOST = "exercisedb.p.rapidapi.com";
const NUTRITION_HOST = "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com";

interface ExerciseDBExercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  gifUrl: string;
  instructions: string[];
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-workout", async (req, res) => {
    try {
      const { muscleGroups, equipment, description } = req.body as WorkoutRequest;

      if (!muscleGroups || muscleGroups.length === 0) {
        return res.status(400).json({ error: "At least one muscle group is required" });
      }

      // Check if API key is configured
      if (!RAPIDAPI_KEY) {
        console.warn("RAPIDAPI_KEY not configured, using fallback exercises");
        const workout: Workout = {
          id: Date.now().toString(),
          name: `${muscleGroups[0]} Workout`,
          description: description || `A workout targeting ${muscleGroups.join(", ")}`,
          muscleGroups,
          equipment: equipment || ["any"],
          exercises: generateFallbackExercises(muscleGroups),
          difficulty: "Intermediate",
        };
        return res.json(workout);
      }

      const response = await fetch(
        "https://muscle-group-image-generator.p.rapidapi.com/workout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
          body: JSON.stringify({
            muscleGroups,
            equipment: equipment || ["any"],
            description: description || `A workout targeting ${muscleGroups.join(", ")}`,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error - Status:", response.status, "Response:", errorText);
        // Fall back to generating basic workout
        const workout: Workout = {
          id: Date.now().toString(),
          name: `${muscleGroups[0]} Workout`,
          description: description || `A workout targeting ${muscleGroups.join(", ")}`,
          muscleGroups,
          equipment: equipment || ["any"],
          exercises: generateFallbackExercises(muscleGroups),
          difficulty: "Intermediate",
        };
        return res.json(workout);
      }

      const data = await response.json();

      const workout: Workout = {
        id: Date.now().toString(),
        name: data.name || `${muscleGroups[0]} Workout`,
        description: data.description || description,
        muscleGroups,
        equipment: equipment || ["any"],
        exercises: data.exercises || generateFallbackExercises(muscleGroups),
        difficulty: data.difficulty || "Intermediate",
      };

      res.json(workout);
    } catch (error) {
      console.error("Error generating workout:", error);
      // Return fallback workout instead of error
      const body = req.body as WorkoutRequest;
      const workout: Workout = {
        id: Date.now().toString(),
        name: `${body.muscleGroups[0]} Workout`,
        description: body.description || `A workout targeting ${body.muscleGroups.join(", ")}`,
        muscleGroups: body.muscleGroups,
        equipment: body.equipment || ["any"],
        exercises: generateFallbackExercises(body.muscleGroups),
        difficulty: "Intermediate",
      };
      res.json(workout);
    }
  });

  app.get("/api/muscle-groups", async (req, res) => {
    try {
      const response = await fetch(
        "https://muscle-group-image-generator.p.rapidapi.com/getMuscleGroups",
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || "",
          },
        }
      );

      if (!response.ok) {
        return res.status(500).json({ error: "Failed to fetch muscle groups" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching muscle groups:", error);
      res.status(500).json({ error: "Failed to fetch muscle groups" });
    }
  });

  app.get("/api/muscle-image", async (req, res) => {
    try {
      const { muscles, color, base } = req.query;

      if (base === "true") {
        const response = await fetch(
          `https://muscle-group-image-generator.p.rapidapi.com/getBaseImage?transparentBackground=0`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": RAPIDAPI_HOST,
              "x-rapidapi-key": RAPIDAPI_KEY || "",
            },
          }
        );

        if (!response.ok) {
          return res.status(500).json({ error: "Failed to fetch base image" });
        }

        const buffer = await response.arrayBuffer();
        res.set("Content-Type", "image/png");
        res.set("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(buffer));
        return;
      }

      const muscleList = (muscles as string)?.split(",").map(m => m.trim().toLowerCase()) || [];
      const colorValue = color || "255,107,107";

      const url = `https://muscle-group-image-generator.p.rapidapi.com/getImage?muscleGroups=${encodeURIComponent(muscleList.join(","))}&color=${encodeURIComponent(colorValue as string)}&transparentBackground=0`;
      
      console.log(`[Muscle API] Requesting muscles: ${muscleList.join(",")}`);
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY || "",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Muscle API Error] Status: ${response.status}, Muscles: ${muscleList.join(",")}, Error: ${errorText}`);
        return res.status(500).json({ error: "Failed to fetch muscle image" });
      }

      const buffer = await response.arrayBuffer();
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error fetching muscle image:", error);
      res.status(500).json({ error: "Failed to fetch muscle image" });
    }
  });

  app.get("/api/dual-muscle-image", async (req, res) => {
    try {
      const { primary, secondary } = req.query;

      const primaryColor = "240,100,80";
      const secondaryColor = "200,100,80";

      const response = await fetch(
        `https://muscle-group-image-generator.p.rapidapi.com/getDualColorImage?primaryMuscleGroups=${encodeURIComponent(primary as string)}&secondaryMuscleGroups=${encodeURIComponent(secondary as string || "")}&primaryColor=${encodeURIComponent(primaryColor)}&secondaryColor=${encodeURIComponent(secondaryColor)}&transparentBackground=0`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || "",
          },
        }
      );

      if (!response.ok) {
        console.error("Dual muscle image API error:", await response.text());
        return res.status(500).json({ error: "Failed to fetch dual muscle image" });
      }

      const buffer = await response.arrayBuffer();
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "public, max-age=86400");
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error fetching dual muscle image:", error);
      res.status(500).json({ error: "Failed to fetch dual muscle image" });
    }
  });

  app.get("/api/workouts", async (req, res) => {
    res.json([]);
  });

  app.post("/api/ai/program", async (req, res) => {
    try {
      const {
        weeks,
        experience,
        equipment,
        targetMuscles,
        sessionsPerWeek,
        sessionLength,
        goal,
      } = req.body;

      if (!RAPIDAPI_KEY) {
        // Fallback to OpenAI if RapidAPI is not available
        const program = await generateTrainingProgram({
          weeks,
          experience,
          equipment,
          targetMuscles,
          sessionsPerWeek: sessionsPerWeek || 4,
          sessionLength: sessionLength || 45,
        });
        return res.json(program);
      }

      const response = await fetch(
        `https://${NUTRITION_HOST}/generateWorkoutPlan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": NUTRITION_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
          body: JSON.stringify({
            goal: goal || "Build muscle",
            fitness_level: experience || "Intermediate",
            preferences: ["Weight training"],
            health_conditions: ["None"],
            schedule: {
              days_per_week: sessionsPerWeek || 4,
              session_duration: sessionLength || 60
            },
            plan_duration_weeks: weeks || 4,
            lang: "en"
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`RapidAPI Error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data.result);
    } catch (error) {
      console.error("Error generating AI program:", error);
      res.status(500).json({ error: "Failed to generate training program" });
    }
  });

  app.post("/api/nutrition/suggestions", async (req, res) => {
    try {
      const { goal, dietary_restrictions, health_conditions } = req.body;

      if (!RAPIDAPI_KEY) {
        return res.status(500).json({ error: "RapidAPI key not configured" });
      }

      const response = await fetch(
        `https://${NUTRITION_HOST}/nutritionAdvice`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": NUTRITION_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
          body: JSON.stringify({
            goal: goal || "Healthy eating",
            dietary_restrictions: dietary_restrictions || ["None"],
            health_conditions: health_conditions || ["None"],
            lang: "en"
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`RapidAPI Error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data.result);
    } catch (error) {
      console.error("Error fetching nutrition advice:", error);
      res.status(500).json({ error: "Failed to fetch nutrition advice" });
    }
  });

  app.get("/api/exercises/details/:name", async (req, res) => {
    try {
      const { name } = req.params;

      if (!RAPIDAPI_KEY) {
        return res.status(500).json({ error: "RapidAPI key not configured" });
      }

      const response = await fetch(
        `https://${NUTRITION_HOST}/exerciseDetails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": NUTRITION_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY,
          },
          body: JSON.stringify({
            exercise_name: name,
            lang: "en"
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`RapidAPI Error: ${response.status}`);
      }

      const data = await response.json();
      res.json(data.result);
    } catch (error) {
      console.error("Error fetching exercise details:", error);
      res.status(500).json({ error: "Failed to fetch exercise details" });
    }
  });

  app.post("/api/ai/feedback", async (req, res) => {
    try {
      const { exercisesCompleted, totalDuration, musclesFocused, difficulty } =
        req.body;

      if (!exercisesCompleted || !totalDuration) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const feedback = await generateWorkoutFeedback({
        exercisesCompleted,
        totalDuration,
        musclesFocused: musclesFocused || [],
        difficulty: difficulty || "Moderate",
      });

      res.json(feedback);
    } catch (error) {
      console.error("Error generating workout feedback:", error);
      res.status(500).json({ error: "Failed to generate feedback" });
    }
  });

  app.post("/api/ai/substitutions", async (req, res) => {
    try {
      const { originalExercise, targetMuscle, equipment, constraints } =
        req.body;

      if (!originalExercise || !targetMuscle || !equipment) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const substitutions = await generateExerciseSubstitutions({
        originalExercise,
        targetMuscle,
        equipment,
        constraints,
      });

      res.json(substitutions);
    } catch (error) {
      console.error("Error generating substitutions:", error);
      res.status(500).json({ error: "Failed to generate substitutions" });
    }
  });

  app.post("/api/ai/recovery", async (req, res) => {
    try {
      const {
        streak,
        minutesTrained,
        musclesHitLastWeek,
        plannedMuscleToday,
        averageSessionDuration,
      } = req.body;

      if (
        streak === undefined ||
        !minutesTrained ||
        !musclesHitLastWeek ||
        !plannedMuscleToday
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const advice = await generateRecoveryAdvice({
        streak,
        minutesTrained,
        musclesHitLastWeek,
        plannedMuscleToday,
        averageSessionDuration: averageSessionDuration || 45,
      });

      res.json(advice);
    } catch (error) {
      console.error("Error generating recovery advice:", error);
      res.status(500).json({ error: "Failed to generate recovery advice" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const response = await generateChatResponse({
        message,
        history: history || [],
      });

      // Extract exercise names from the AI response and fetch matching exercises
      const exercises: ExerciseDBExercise[] = [];
      
      // Common exercise patterns to look for in the response
      const exercisePatterns = [
        /(?:try|do|perform|recommend|suggest)(?:ing)?\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+for|\s+to|\s*[,\.\n])/gi,
        /exercises?\s+(?:like|such as)\s+([^\.]+)/gi,
        /([a-zA-Z]+\s+(?:press|curl|row|squat|lunge|deadlift|raise|extension|fly|pulldown|pull-up|push-up|crunch|plank)s?)/gi,
      ];

      const foundExercises = new Set<string>();
      
      for (const pattern of exercisePatterns) {
        const matches = response.matchAll(pattern);
        for (const match of matches) {
          const exerciseName = match[1]?.trim().toLowerCase();
          if (exerciseName && exerciseName.length > 3 && exerciseName.length < 50) {
            foundExercises.add(exerciseName);
          }
        }
      }

      // Also check for common exercise names directly mentioned
      const commonExercises = [
        "bench press", "squat", "deadlift", "shoulder press", "bicep curl", 
        "tricep extension", "lat pulldown", "seated row", "leg press", "leg curl",
        "leg extension", "calf raise", "plank", "crunch", "russian twist",
        "push-up", "pull-up", "dip", "lunge", "romanian deadlift", "hip thrust",
        "face pull", "lateral raise", "front raise", "hammer curl", "preacher curl",
        "skull crusher", "overhead press", "incline press", "decline press",
        "cable fly", "dumbbell fly", "barbell row", "t-bar row", "chest press"
      ];

      for (const exercise of commonExercises) {
        if (response.toLowerCase().includes(exercise)) {
          foundExercises.add(exercise);
        }
      }

      // Fetch up to 3 exercises from ExerciseDB
      const exerciseNames = Array.from(foundExercises).slice(0, 3);
      
      for (const name of exerciseNames) {
        try {
          const searchUrl = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1`;
          const exerciseResponse = await fetch(searchUrl, {
            headers: {
              "X-RapidAPI-Key": RAPIDAPI_KEY || "",
              "X-RapidAPI-Host": EXERCISEDB_HOST,
            },
          });

          if (exerciseResponse.ok) {
            const data = await exerciseResponse.json();
            if (Array.isArray(data) && data.length > 0) {
              exercises.push(data[0]);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch exercise: ${name}`, err);
        }
      }

      res.json({ response, exercises });
    } catch (error) {
      console.error("Error generating chat response:", error);
      res.status(500).json({ error: "Failed to generate response" });
    }
  });

  app.post("/api/ai/analyze-food", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: "Image is required" });
      const result = await analyzeFoodImage(image);
      res.json(result);
    } catch (error) {
      console.error("Error in /api/ai/analyze-food:", error);
      res.status(500).json({ error: "Failed to analyze food image" });
    }
  });

  // ExerciseDB API Endpoints - Exercise Browsing with Animated GIFs
  const exerciseDbHeaders = {
    "X-RapidAPI-Key": RAPIDAPI_KEY || "",
    "X-RapidAPI-Host": EXERCISEDB_HOST,
  };

  // Helper to validate API key before making ExerciseDB requests
  const validateRapidApiKey = () => {
    if (!RAPIDAPI_KEY) {
      return { valid: false, error: "ExerciseDB API key not configured" };
    }
    return { valid: true, error: null };
  };

  // Get all exercises with pagination
  app.get("/api/exercises", async (req, res) => {
    try {
      const keyCheck = validateRapidApiKey();
      if (!keyCheck.valid) {
        return res.status(500).json({ error: keyCheck.error });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises?limit=${limit}&offset=${offset}`,
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ExerciseDB API error:", response.status, errorText);
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Get body part list
  app.get("/api/exercises/bodyPartList", async (req, res) => {
    try {
      const keyCheck = validateRapidApiKey();
      if (!keyCheck.valid) {
        return res.status(500).json({ error: keyCheck.error });
      }

      const response = await fetch(
        "https://exercisedb.p.rapidapi.com/exercises/bodyPartList",
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching body parts:", error);
      res.status(500).json({ error: "Failed to fetch body parts" });
    }
  });

  // Get target muscle list
  app.get("/api/exercises/targetList", async (req, res) => {
    try {
      const response = await fetch(
        "https://exercisedb.p.rapidapi.com/exercises/targetList",
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching targets:", error);
      res.status(500).json({ error: "Failed to fetch target muscles" });
    }
  });

  // Get equipment list
  app.get("/api/exercises/equipmentList", async (req, res) => {
    try {
      const response = await fetch(
        "https://exercisedb.p.rapidapi.com/exercises/equipmentList",
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment list" });
    }
  });

  // Get exercises by body part
  app.get("/api/exercises/bodyPart/:bodyPart", async (req, res) => {
    try {
      const keyCheck = validateRapidApiKey();
      if (!keyCheck.valid) {
        return res.status(500).json({ error: keyCheck.error });
      }

      const { bodyPart } = req.params;
      const normalizedBodyPart = bodyPart.toLowerCase();
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${encodeURIComponent(normalizedBodyPart)}?limit=${limit}&offset=${offset}`,
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching exercises by body part:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Get exercises by target muscle
  app.get("/api/exercises/target/:target", async (req, res) => {
    try {
      const { target } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/target/${encodeURIComponent(target)}?limit=${limit}&offset=${offset}`,
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching exercises by target:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Get exercises by equipment
  app.get("/api/exercises/equipment/:equipment", async (req, res) => {
    try {
      const { equipment } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/equipment/${encodeURIComponent(equipment)}?limit=${limit}&offset=${offset}`,
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching exercises by equipment:", error);
      res.status(500).json({ error: "Failed to fetch exercises" });
    }
  });

  // Get single exercise by ID
  app.get("/api/exercises/exercise/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/exercise/${encodeURIComponent(id)}`,
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching exercise:", error);
      res.status(500).json({ error: "Failed to fetch exercise" });
    }
  });

  // Search exercises by name
  app.get("/api/exercises/name/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=${limit}&offset=${offset}`,
        { headers: exerciseDbHeaders }
      );

      if (!response.ok) {
        throw new Error("ExerciseDB API error");
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching exercises:", error);
      res.status(500).json({ error: "Failed to search exercises" });
    }
  });

  // Proxy endpoint for exercise GIF images (keeps API key secure on server)
  app.get("/api/exercises/image/:id", async (req, res) => {
    try {
      const keyCheck = validateRapidApiKey();
      if (!keyCheck.valid) {
        return res.status(500).json({ error: keyCheck.error });
      }

      const { id } = req.params;
      const resolution = (req.query.resolution as string) || "360";
      
      // Validate resolution
      const validResolutions = ["180", "360", "720", "1080"];
      const safeResolution = validResolutions.includes(resolution) ? resolution : "360";

      const imageUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(id)}&resolution=${safeResolution}`;
      
      const response = await fetch(imageUrl, {
        headers: exerciseDbHeaders,
      });

      if (!response.ok) {
        console.error("ExerciseDB image error:", response.status);
        return res.status(response.status).json({ error: "Failed to fetch exercise image" });
      }

      // Set appropriate headers for GIF streaming
      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
      
      // Stream the response body to the client
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Error fetching exercise image:", error);
      res.status(500).json({ error: "Failed to fetch exercise image" });
    }
  });

  // Nutrition API endpoints (powered by RapidAPI AI Workout Planner)
  app.post("/api/nutrition/analyze", async (req, res) => {
    try {
      const { mealName, quantity, unit } = req.body;

      if (!mealName || !quantity) {
        return res.status(400).json({
          error: "Meal name and quantity are required",
          fallback: {
            calories: Math.round(quantity * 50),
            protein: Math.round(quantity * 2),
            carbs: Math.round(quantity * 5),
            fats: Math.round(quantity * 1),
          },
        });
      }

      const response = await fetch(
        "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/api/nutrition/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": NUTRITION_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || "",
          },
          body: JSON.stringify({
            meal: mealName,
            quantity,
            unit: unit || "grams",
          }),
        }
      );

      if (!response.ok) {
        console.error(
          "Nutrition API Error:",
          response.status,
          await response.text()
        );
        return res.json({
          calories: Math.round(quantity * 50),
          protein: Math.round(quantity * 2),
          carbs: Math.round(quantity * 5),
          fats: Math.round(quantity * 1),
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error analyzing nutrition:", error);
      const { quantity } = req.body;
      res.json({
        calories: Math.round((quantity || 100) * 50),
        protein: Math.round((quantity || 100) * 2),
        carbs: Math.round((quantity || 100) * 5),
        fats: Math.round((quantity || 100) * 1),
      });
    }
  });

  app.get("/api/nutrition/suggestions", async (req, res) => {
    try {
      const response = await fetch(
        "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/api/nutrition/suggestions",
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": NUTRITION_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || "",
          },
        }
      );

      if (!response.ok) {
        console.error("Nutrition API Error:", await response.text());
        return res.json([
          {
            name: "Grilled Chicken Breast",
            quantity: 200,
            unit: "g",
            calories: 280,
            protein: 42,
            carbs: 0,
            fats: 12,
          },
          {
            name: "Brown Rice",
            quantity: 150,
            unit: "g",
            calories: 420,
            protein: 15,
            carbs: 72,
            fats: 10,
          },
          {
            name: "Broccoli",
            quantity: 150,
            unit: "g",
            calories: 50,
            protein: 5,
            carbs: 9,
            fats: 1,
          },
        ]);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching nutrition suggestions:", error);
      res.json([
        {
          name: "Grilled Chicken Breast",
          quantity: 200,
          unit: "g",
          calories: 280,
          protein: 42,
          carbs: 0,
          fats: 12,
        },
        {
          name: "Brown Rice",
          quantity: 150,
          unit: "g",
          calories: 420,
          protein: 15,
          carbs: 72,
          fats: 10,
        },
      ]);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

function generateFallbackExercises(muscleGroups: string[]): Exercise[] {
  const exercisesByMuscle: Record<string, Exercise[]> = {
    chest: [
      { name: "Bench Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Chest" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Chest" },
      { name: "Cable Flyes", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Chest" },
    ],
    back: [
      { name: "Barbell Rows", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Back" },
      { name: "Lat Pulldown", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" },
      { name: "Seated Cable Row", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" },
    ],
    shoulders: [
      { name: "Overhead Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Shoulders" },
      { name: "Lateral Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Shoulders" },
      { name: "Face Pulls", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Shoulders" },
    ],
    biceps: [
      { name: "Barbell Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" },
      { name: "Hammer Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" },
    ],
    triceps: [
      { name: "Tricep Pushdowns", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Triceps" },
      { name: "Skull Crushers", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Triceps" },
    ],
    legs: [
      { name: "Squats", sets: 4, reps: "8-10", restSeconds: 120, muscleGroup: "Legs" },
      { name: "Leg Press", sets: 3, reps: "10-12", restSeconds: 90, muscleGroup: "Legs" },
      { name: "Leg Extensions", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Legs" },
      { name: "Romanian Deadlifts", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Legs" },
      { name: "Leg Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Legs" },
    ],
    quads: [
      { name: "Squats", sets: 4, reps: "8-10", restSeconds: 120, muscleGroup: "Quads" },
      { name: "Leg Press", sets: 3, reps: "10-12", restSeconds: 90, muscleGroup: "Quads" },
      { name: "Leg Extensions", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Quads" },
    ],
    hamstrings: [
      { name: "Romanian Deadlifts", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Hamstrings" },
      { name: "Leg Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Hamstrings" },
    ],
    glutes: [
      { name: "Hip Thrusts", sets: 4, reps: "10-12", restSeconds: 90, muscleGroup: "Glutes" },
      { name: "Bulgarian Split Squats", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Glutes" },
    ],
    calves: [
      { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSeconds: 45, muscleGroup: "Calves" },
      { name: "Seated Calf Raises", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Calves" },
    ],
    core: [
      { name: "Cable Crunches", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Core" },
      { name: "Hanging Leg Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Core" },
      { name: "Plank", sets: 3, reps: "60s", restSeconds: 30, muscleGroup: "Core" },
    ],
    abs: [
      { name: "Cable Crunches", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Abs" },
      { name: "Hanging Leg Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Abs" },
    ],
    arms: [
      { name: "Barbell Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Arms" },
      { name: "Tricep Pushdowns", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Arms" },
    ],
    cardio: [
      { name: "Running", sets: 1, reps: "20 min", restSeconds: 0, muscleGroup: "Cardio" },
      { name: "Cycling", sets: 1, reps: "30 min", restSeconds: 0, muscleGroup: "Cardio" },
    ],
    forearms: [
      { name: "Wrist Curls", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Forearms" },
      { name: "Reverse Wrist Curls", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Forearms" },
    ],
    obliques: [
      { name: "Russian Twists", sets: 3, reps: "20", restSeconds: 45, muscleGroup: "Obliques" },
      { name: "Side Planks", sets: 3, reps: "30s", restSeconds: 30, muscleGroup: "Obliques" },
    ],
  };

  const exercises: Exercise[] = [];

  for (const muscle of muscleGroups) {
    const muscleExercises = exercisesByMuscle[muscle.toLowerCase()];
    if (muscleExercises) {
      exercises.push(...muscleExercises);
    }
  }

  return exercises.length > 0 ? exercises : [
    { name: "Push-ups", sets: 3, reps: "15-20", restSeconds: 60, muscleGroup: "Chest" },
    { name: "Squats", sets: 3, reps: "15-20", restSeconds: 60, muscleGroup: "Legs" },
    { name: "Plank", sets: 3, reps: "60s", restSeconds: 30, muscleGroup: "Core" },
  ];
}
