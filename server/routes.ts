import type { Express } from "express";
import { createServer, type Server } from "node:http";

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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-workout", async (req, res) => {
    try {
      const { muscleGroups, equipment, description } = req.body as WorkoutRequest;

      if (!muscleGroups || muscleGroups.length === 0) {
        return res.status(400).json({ error: "At least one muscle group is required" });
      }

      const response = await fetch(
        "https://muscle-group-image-generator.p.rapidapi.com/workout",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || "",
          },
          body: JSON.stringify({
            muscleGroups,
            equipment: equipment || ["any"],
            description: description || `A workout targeting ${muscleGroups.join(", ")}`,
          }),
        }
      );

      if (!response.ok) {
        console.error("API Error:", await response.text());
        return res.status(500).json({ error: "Failed to generate workout" });
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
      res.status(500).json({ error: "Failed to generate workout" });
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
        res.send(Buffer.from(buffer));
        return;
      }

      const muscleList = (muscles as string)?.split(",").map(m => m.trim().toLowerCase()) || [];
      const colorValue = color || "255,107,107";

      const response = await fetch(
        `https://muscle-group-image-generator.p.rapidapi.com/getImage?muscleGroups=${encodeURIComponent(muscleList.join(","))}&color=${encodeURIComponent(colorValue as string)}&transparentBackground=0`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || "",
          },
        }
      );

      if (!response.ok) {
        console.error("Muscle image API error:", await response.text());
        return res.status(500).json({ error: "Failed to fetch muscle image" });
      }

      const buffer = await response.arrayBuffer();
      res.set("Content-Type", "image/png");
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
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("Error fetching dual muscle image:", error);
      res.status(500).json({ error: "Failed to fetch dual muscle image" });
    }
  });

  app.get("/api/workouts", async (req, res) => {
    res.json([]);
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
    abs: [
      { name: "Cable Crunches", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Abs" },
      { name: "Hanging Leg Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Abs" },
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
