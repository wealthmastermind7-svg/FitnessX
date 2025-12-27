// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// server/services/ai.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
async function generateTrainingProgram(input) {
  const prompt = `You are a certified strength and conditioning coach.

Create a ${input.weeks}-week progressive workout program.

User profile:
- Experience: ${input.experience}
- Equipment: ${input.equipment.join(", ")}
- Target muscles: ${input.targetMuscles.join(", ")}
- Sessions per week: ${input.sessionsPerWeek}
- Session length: ${input.sessionLength} minutes

Rules:
- Progressive overload weekly (increase weight/volume each week)
- Balance volume and recovery
- Include a deload week if volume exceeds recovery capacity
- No medical advice
- Output JSON ONLY

Return ONLY valid JSON in this exact schema (no markdown, no code blocks):
{
  "weeks": [
    {
      "week": number,
      "focus": string (e.g., "Strength Phase", "Hypertrophy Phase"),
      "sessions": [
        {
          "day": string (e.g., "Day 1: Upper Power"),
          "exercises": [
            {
              "name": string,
              "sets": number,
              "reps": string,
              "rest": string (e.g., "2-3 minutes")
            }
          ]
        }
      ]
    }
  ]
}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 4e3
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    const startIdx = content.indexOf("{");
    if (startIdx === -1) {
      throw new Error("No JSON found in response");
    }
    let jsonStr = "";
    let braceCount = 0;
    for (let i = startIdx; i < content.length; i++) {
      const char = content[i];
      if (char === "{") braceCount++;
      if (char === "}") braceCount--;
      jsonStr += char;
      if (braceCount === 0 && i > startIdx) break;
    }
    const program = JSON.parse(jsonStr);
    return program;
  } catch (error) {
    console.error("Error generating training program:", error);
    throw error;
  }
}
async function generateWorkoutFeedback(input) {
  const exerciseSummary = input.exercisesCompleted.map(
    (e) => `${e.name}: ${e.completedSets}/${e.targetSets} sets x ${e.reps} reps (RPE: ${e.rpe ?? "N/A"})`
  ).join("\n");
  const prompt = `You are an experienced strength and conditioning coach providing personalized feedback on a completed workout.

Workout Summary:
- Duration: ${input.totalDuration} minutes
- Difficulty: ${input.difficulty}
- Muscles Focused: ${input.musclesFocused.join(", ")}
- Exercises Completed:
${exerciseSummary}

Analyze this workout and provide concise coaching feedback in JSON format. Focus on:
1. What the user did well (be specific)
2. Where they might be undertraining or overtraining
3. A specific, actionable recommendation for their next session

Keep feedback to 2-3 points each, brief and actionable. No medical advice.

Return ONLY valid JSON (no markdown):
{
  "strengths": ["specific positive 1", "specific positive 2"],
  "areas_to_improve": ["area 1 with reason", "area 2 with reason"],
  "next_session_recommendation": "specific actionable advice for next time"
}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 400
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const feedback = JSON.parse(jsonMatch[0]);
    return feedback;
  } catch (error) {
    console.error("Error generating workout feedback:", error);
    throw error;
  }
}
async function generateExerciseSubstitutions(input) {
  const RAPIDAPI_KEY2 = process.env.RAPIDAPI_KEY;
  const EXERCISEDB_HOST2 = "exercisedb.p.rapidapi.com";
  let availableExercises = [];
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/target/${encodeURIComponent(input.targetMuscle)}?limit=50`,
      {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY2 || "",
          "X-RapidAPI-Host": EXERCISEDB_HOST2
        }
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        availableExercises = data.map((ex) => ex.name).filter((name) => name);
      }
    }
  } catch (error) {
    console.error("Failed to fetch exercises from ExerciseDB:", error);
  }
  if (availableExercises.length === 0) {
    const muscleToExercises = {
      chest: ["Bench Press", "Incline Bench Press", "Dumbbell Bench Press", "Cable Fly", "Push-up"],
      back: ["Barbell Bent Over Row", "Lat Pulldown", "Seated Cable Row", "Pull-up", "Deadlift"],
      shoulders: ["Shoulder Press", "Lateral Raise", "Face Pull", "Upright Row", "Pike Push-up"],
      biceps: ["Barbell Curl", "Dumbbell Curl", "Cable Curl", "Hammer Curl", "Preacher Curl"],
      triceps: ["Tricep Pushdown", "Skull Crusher", "Close Grip Bench Press", "Dip", "Overhead Extension"],
      legs: ["Squat", "Leg Press", "Leg Curl", "Leg Extension", "Walking Lunge"],
      quads: ["Squat", "Leg Press", "Leg Extension", "Walking Lunge", "Bulgarian Split Squat"],
      hamstrings: ["Romanian Deadlift", "Leg Curl", "Good Morning", "Nordic Curl", "Glute-Ham Raise"],
      glutes: ["Hip Thrust", "Squat", "Leg Press", "Bulgarian Split Squat", "Leg Curl"],
      abs: ["Crunch", "Plank", "Ab Wheel", "Hanging Leg Raise", "Cable Woodchop"]
    };
    const key = input.targetMuscle.toLowerCase();
    availableExercises = muscleToExercises[key] || [];
  }
  const exerciseList = availableExercises.slice(0, 15).join(", ");
  const prompt = `You are a strength and conditioning coach helping find exercise alternatives.

Original Exercise: ${input.originalExercise}
Target Muscle: ${input.targetMuscle}
Available Equipment: ${input.equipment.join(", ")}
${input.constraints ? `Constraints: ${input.constraints.join(", ")}` : ""}

IMPORTANT: You MUST choose exercise alternatives ONLY from this list of real exercises:
${exerciseList}

Select 3 different exercises from the list above that:
1. Are suitable alternatives for the original exercise
2. Can be done with available equipment
3. Account for any constraints

Return ONLY valid JSON (no markdown):
{
  "exercises": [
    {
      "name": "exact name from the list above",
      "difficulty": "easy/moderate/hard",
      "why": "why this works as a substitute"
    }
  ]
}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const substitutions = JSON.parse(jsonMatch[0]);
    return substitutions;
  } catch (error) {
    console.error("Error generating exercise substitutions:", error);
    throw error;
  }
}
async function generateRecoveryAdvice(input) {
  const prompt = `You are an expert sports physiologist and strength coach advising on recovery and training readiness.

User Training Profile:
- Current Streak: ${input.streak} workouts
- Total Minutes Trained This Week: ${input.minutesTrained}
- Muscles Hit Last Week: ${input.musclesHitLastWeek.join(", ")}
- Planned Muscle Today: ${input.plannedMuscleToday}
- Average Session Duration: ${input.averageSessionDuration} minutes

Provide recovery and training advice in JSON format:
1. Should they train today? (yes/modify/rest)
2. If modifying, what should they do instead?
3. Why?

Return ONLY valid JSON (no markdown):
{
  "recommendation": "train/modify/rest",
  "reasoning": "explanation of recommendation based on data",
  "alternatives": ["alternative 1 if needed", "alternative 2 if needed"]
}`;
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 300
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const advice = JSON.parse(jsonMatch[0]);
    return advice;
  } catch (error) {
    console.error("Error generating recovery advice:", error);
    throw error;
  }
}
async function generateChatResponse(input) {
  const systemPrompt = `You are an expert fitness coach and nutritionist with over 15 years of experience helping people achieve their health and fitness goals. You provide personalized, science-based advice on:

- Workout programming and exercise technique
- Nutrition, meal planning, and macro tracking  
- Recovery, sleep, and stress management
- Motivation and habit building
- Injury prevention and working around limitations

Guidelines:
- Be friendly, encouraging, and supportive
- Give specific, actionable advice
- Explain the "why" behind recommendations
- Ask clarifying questions when needed
- Keep responses concise but thorough (2-3 paragraphs max)
- Never provide medical diagnoses or replace professional medical advice
- Use natural conversation without bullet points unless specifically helpful`;
  const messages = [
    { role: "system", content: systemPrompt },
    ...input.history.map((m) => ({
      role: m.role,
      content: m.content
    })),
    { role: "user", content: input.message }
  ];
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500
    });
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }
    return content;
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
}

// server/routes.ts
var RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
var RAPIDAPI_HOST = "muscle-group-image-generator.p.rapidapi.com";
var EXERCISEDB_HOST = "exercisedb.p.rapidapi.com";
var NUTRITION_HOST = "ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com";
async function registerRoutes(app2) {
  app2.post("/api/generate-workout", async (req, res) => {
    try {
      const { muscleGroups, equipment, description } = req.body;
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
            "x-rapidapi-key": RAPIDAPI_KEY || ""
          },
          body: JSON.stringify({
            muscleGroups,
            equipment: equipment || ["any"],
            description: description || `A workout targeting ${muscleGroups.join(", ")}`
          })
        }
      );
      if (!response.ok) {
        console.error("API Error:", await response.text());
        return res.status(500).json({ error: "Failed to generate workout" });
      }
      const data = await response.json();
      const workout = {
        id: Date.now().toString(),
        name: data.name || `${muscleGroups[0]} Workout`,
        description: data.description || description,
        muscleGroups,
        equipment: equipment || ["any"],
        exercises: data.exercises || generateFallbackExercises(muscleGroups),
        difficulty: data.difficulty || "Intermediate"
      };
      res.json(workout);
    } catch (error) {
      console.error("Error generating workout:", error);
      res.status(500).json({ error: "Failed to generate workout" });
    }
  });
  app2.get("/api/muscle-groups", async (req, res) => {
    try {
      const response = await fetch(
        "https://muscle-group-image-generator.p.rapidapi.com/getMuscleGroups",
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || ""
          }
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
  app2.get("/api/muscle-image", async (req, res) => {
    try {
      const { muscles, color, base } = req.query;
      if (base === "true") {
        const response2 = await fetch(
          `https://muscle-group-image-generator.p.rapidapi.com/getBaseImage?transparentBackground=0`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-host": RAPIDAPI_HOST,
              "x-rapidapi-key": RAPIDAPI_KEY || ""
            }
          }
        );
        if (!response2.ok) {
          return res.status(500).json({ error: "Failed to fetch base image" });
        }
        const buffer2 = await response2.arrayBuffer();
        res.set("Content-Type", "image/png");
        res.set("Cache-Control", "public, max-age=86400");
        res.send(Buffer.from(buffer2));
        return;
      }
      const muscleList = muscles?.split(",").map((m) => m.trim().toLowerCase()) || [];
      const colorValue = color || "255,107,107";
      const url = `https://muscle-group-image-generator.p.rapidapi.com/getImage?muscleGroups=${encodeURIComponent(muscleList.join(","))}&color=${encodeURIComponent(colorValue)}&transparentBackground=0`;
      console.log(`[Muscle API] Requesting muscles: ${muscleList.join(",")}`);
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-rapidapi-host": RAPIDAPI_HOST,
          "x-rapidapi-key": RAPIDAPI_KEY || ""
        }
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
  app2.get("/api/dual-muscle-image", async (req, res) => {
    try {
      const { primary, secondary } = req.query;
      const primaryColor = "240,100,80";
      const secondaryColor = "200,100,80";
      const response = await fetch(
        `https://muscle-group-image-generator.p.rapidapi.com/getDualColorImage?primaryMuscleGroups=${encodeURIComponent(primary)}&secondaryMuscleGroups=${encodeURIComponent(secondary || "")}&primaryColor=${encodeURIComponent(primaryColor)}&secondaryColor=${encodeURIComponent(secondaryColor)}&transparentBackground=0`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": RAPIDAPI_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || ""
          }
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
  app2.get("/api/workouts", async (req, res) => {
    res.json([]);
  });
  app2.post("/api/ai/program", async (req, res) => {
    try {
      const {
        weeks,
        experience,
        equipment,
        targetMuscles,
        sessionsPerWeek,
        sessionLength
      } = req.body;
      if (!weeks || !experience || !equipment || !targetMuscles) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const program = await generateTrainingProgram({
        weeks,
        experience,
        equipment,
        targetMuscles,
        sessionsPerWeek: sessionsPerWeek || 4,
        sessionLength: sessionLength || 45
      });
      res.json(program);
    } catch (error) {
      console.error("Error generating AI program:", error);
      res.status(500).json({ error: "Failed to generate training program" });
    }
  });
  app2.post("/api/ai/feedback", async (req, res) => {
    try {
      const { exercisesCompleted, totalDuration, musclesFocused, difficulty } = req.body;
      if (!exercisesCompleted || !totalDuration) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const feedback = await generateWorkoutFeedback({
        exercisesCompleted,
        totalDuration,
        musclesFocused: musclesFocused || [],
        difficulty: difficulty || "Moderate"
      });
      res.json(feedback);
    } catch (error) {
      console.error("Error generating workout feedback:", error);
      res.status(500).json({ error: "Failed to generate feedback" });
    }
  });
  app2.post("/api/ai/substitutions", async (req, res) => {
    try {
      const { originalExercise, targetMuscle, equipment, constraints } = req.body;
      if (!originalExercise || !targetMuscle || !equipment) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const substitutions = await generateExerciseSubstitutions({
        originalExercise,
        targetMuscle,
        equipment,
        constraints
      });
      res.json(substitutions);
    } catch (error) {
      console.error("Error generating substitutions:", error);
      res.status(500).json({ error: "Failed to generate substitutions" });
    }
  });
  app2.post("/api/ai/recovery", async (req, res) => {
    try {
      const {
        streak,
        minutesTrained,
        musclesHitLastWeek,
        plannedMuscleToday,
        averageSessionDuration
      } = req.body;
      if (streak === void 0 || !minutesTrained || !musclesHitLastWeek || !plannedMuscleToday) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const advice = await generateRecoveryAdvice({
        streak,
        minutesTrained,
        musclesHitLastWeek,
        plannedMuscleToday,
        averageSessionDuration: averageSessionDuration || 45
      });
      res.json(advice);
    } catch (error) {
      console.error("Error generating recovery advice:", error);
      res.status(500).json({ error: "Failed to generate recovery advice" });
    }
  });
  app2.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }
      const response = await generateChatResponse({
        message,
        history: history || []
      });
      const exercises = [];
      const exercisePatterns = [
        /(?:try|do|perform|recommend|suggest)(?:ing)?\s+(?:the\s+)?([a-zA-Z\s]+?)(?:\s+for|\s+to|\s*[,\.\n])/gi,
        /exercises?\s+(?:like|such as)\s+([^\.]+)/gi,
        /([a-zA-Z]+\s+(?:press|curl|row|squat|lunge|deadlift|raise|extension|fly|pulldown|pull-up|push-up|crunch|plank)s?)/gi
      ];
      const foundExercises = /* @__PURE__ */ new Set();
      for (const pattern of exercisePatterns) {
        const matches = response.matchAll(pattern);
        for (const match of matches) {
          const exerciseName = match[1]?.trim().toLowerCase();
          if (exerciseName && exerciseName.length > 3 && exerciseName.length < 50) {
            foundExercises.add(exerciseName);
          }
        }
      }
      const commonExercises = [
        "bench press",
        "squat",
        "deadlift",
        "shoulder press",
        "bicep curl",
        "tricep extension",
        "lat pulldown",
        "seated row",
        "leg press",
        "leg curl",
        "leg extension",
        "calf raise",
        "plank",
        "crunch",
        "russian twist",
        "push-up",
        "pull-up",
        "dip",
        "lunge",
        "romanian deadlift",
        "hip thrust",
        "face pull",
        "lateral raise",
        "front raise",
        "hammer curl",
        "preacher curl",
        "skull crusher",
        "overhead press",
        "incline press",
        "decline press",
        "cable fly",
        "dumbbell fly",
        "barbell row",
        "t-bar row",
        "chest press"
      ];
      for (const exercise of commonExercises) {
        if (response.toLowerCase().includes(exercise)) {
          foundExercises.add(exercise);
        }
      }
      const exerciseNames = Array.from(foundExercises).slice(0, 3);
      for (const name of exerciseNames) {
        try {
          const searchUrl = `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(name)}?limit=1`;
          const exerciseResponse = await fetch(searchUrl, {
            headers: {
              "X-RapidAPI-Key": RAPIDAPI_KEY || "",
              "X-RapidAPI-Host": EXERCISEDB_HOST
            }
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
  const exerciseDbHeaders = {
    "X-RapidAPI-Key": RAPIDAPI_KEY || "",
    "X-RapidAPI-Host": EXERCISEDB_HOST
  };
  const validateRapidApiKey = () => {
    if (!RAPIDAPI_KEY) {
      return { valid: false, error: "ExerciseDB API key not configured" };
    }
    return { valid: true, error: null };
  };
  app2.get("/api/exercises", async (req, res) => {
    try {
      const keyCheck = validateRapidApiKey();
      if (!keyCheck.valid) {
        return res.status(500).json({ error: keyCheck.error });
      }
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
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
  app2.get("/api/exercises/bodyPartList", async (req, res) => {
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
  app2.get("/api/exercises/targetList", async (req, res) => {
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
  app2.get("/api/exercises/equipmentList", async (req, res) => {
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
  app2.get("/api/exercises/bodyPart/:bodyPart", async (req, res) => {
    try {
      const keyCheck = validateRapidApiKey();
      if (!keyCheck.valid) {
        return res.status(500).json({ error: keyCheck.error });
      }
      const { bodyPart } = req.params;
      const normalizedBodyPart = bodyPart.toLowerCase();
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
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
  app2.get("/api/exercises/target/:target", async (req, res) => {
    try {
      const { target } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
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
  app2.get("/api/exercises/equipment/:equipment", async (req, res) => {
    try {
      const { equipment } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
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
  app2.get("/api/exercises/exercise/:id", async (req, res) => {
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
  app2.get("/api/exercises/name/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
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
  app2.get("/api/exercises/image/:id", async (req, res) => {
    try {
      const keyCheck = validateRapidApiKey();
      if (!keyCheck.valid) {
        return res.status(500).json({ error: keyCheck.error });
      }
      const { id } = req.params;
      const resolution = req.query.resolution || "360";
      const validResolutions = ["180", "360", "720", "1080"];
      const safeResolution = validResolutions.includes(resolution) ? resolution : "360";
      const imageUrl = `https://exercisedb.p.rapidapi.com/image?exerciseId=${encodeURIComponent(id)}&resolution=${safeResolution}`;
      const response = await fetch(imageUrl, {
        headers: exerciseDbHeaders
      });
      if (!response.ok) {
        console.error("ExerciseDB image error:", response.status);
        return res.status(response.status).json({ error: "Failed to fetch exercise image" });
      }
      res.setHeader("Content-Type", "image/gif");
      res.setHeader("Cache-Control", "public, max-age=86400");
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error("Error fetching exercise image:", error);
      res.status(500).json({ error: "Failed to fetch exercise image" });
    }
  });
  app2.post("/api/nutrition/analyze", async (req, res) => {
    try {
      const { mealName, quantity, unit } = req.body;
      if (!mealName || !quantity) {
        return res.status(400).json({
          error: "Meal name and quantity are required",
          fallback: {
            calories: Math.round(quantity * 50),
            protein: Math.round(quantity * 2),
            carbs: Math.round(quantity * 5),
            fats: Math.round(quantity * 1)
          }
        });
      }
      const response = await fetch(
        "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/api/nutrition/analyze",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-rapidapi-host": NUTRITION_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || ""
          },
          body: JSON.stringify({
            meal: mealName,
            quantity,
            unit: unit || "grams"
          })
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
          fats: Math.round(quantity * 1)
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
        fats: Math.round((quantity || 100) * 1)
      });
    }
  });
  app2.get("/api/nutrition/suggestions", async (req, res) => {
    try {
      const response = await fetch(
        "https://ai-workout-planner-exercise-fitness-nutrition-guide.p.rapidapi.com/api/nutrition/suggestions",
        {
          method: "GET",
          headers: {
            "x-rapidapi-host": NUTRITION_HOST,
            "x-rapidapi-key": RAPIDAPI_KEY || ""
          }
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
            fats: 12
          },
          {
            name: "Brown Rice",
            quantity: 150,
            unit: "g",
            calories: 420,
            protein: 15,
            carbs: 72,
            fats: 10
          },
          {
            name: "Broccoli",
            quantity: 150,
            unit: "g",
            calories: 50,
            protein: 5,
            carbs: 9,
            fats: 1
          }
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
          fats: 12
        },
        {
          name: "Brown Rice",
          quantity: 150,
          unit: "g",
          calories: 420,
          protein: 15,
          carbs: 72,
          fats: 10
        }
      ]);
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}
function generateFallbackExercises(muscleGroups) {
  const exercisesByMuscle = {
    chest: [
      { name: "Bench Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Chest" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Chest" },
      { name: "Cable Flyes", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Chest" }
    ],
    back: [
      { name: "Barbell Rows", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Back" },
      { name: "Lat Pulldown", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" },
      { name: "Seated Cable Row", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" }
    ],
    shoulders: [
      { name: "Overhead Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Shoulders" },
      { name: "Lateral Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Shoulders" },
      { name: "Face Pulls", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Shoulders" }
    ],
    biceps: [
      { name: "Barbell Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" },
      { name: "Hammer Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" }
    ],
    triceps: [
      { name: "Tricep Pushdowns", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Triceps" },
      { name: "Skull Crushers", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Triceps" }
    ],
    quads: [
      { name: "Squats", sets: 4, reps: "8-10", restSeconds: 120, muscleGroup: "Quads" },
      { name: "Leg Press", sets: 3, reps: "10-12", restSeconds: 90, muscleGroup: "Quads" },
      { name: "Leg Extensions", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Quads" }
    ],
    hamstrings: [
      { name: "Romanian Deadlifts", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Hamstrings" },
      { name: "Leg Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Hamstrings" }
    ],
    glutes: [
      { name: "Hip Thrusts", sets: 4, reps: "10-12", restSeconds: 90, muscleGroup: "Glutes" },
      { name: "Bulgarian Split Squats", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Glutes" }
    ],
    calves: [
      { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSeconds: 45, muscleGroup: "Calves" },
      { name: "Seated Calf Raises", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Calves" }
    ],
    abs: [
      { name: "Cable Crunches", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Abs" },
      { name: "Hanging Leg Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Abs" }
    ],
    forearms: [
      { name: "Wrist Curls", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Forearms" },
      { name: "Reverse Wrist Curls", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Forearms" }
    ],
    obliques: [
      { name: "Russian Twists", sets: 3, reps: "20", restSeconds: 45, muscleGroup: "Obliques" },
      { name: "Side Planks", sets: 3, reps: "30s", restSeconds: 30, muscleGroup: "Obliques" }
    ]
  };
  const exercises = [];
  for (const muscle of muscleGroups) {
    const muscleExercises = exercisesByMuscle[muscle.toLowerCase()];
    if (muscleExercises) {
      exercises.push(...muscleExercises);
    }
  }
  return exercises.length > 0 ? exercises : [
    { name: "Push-ups", sets: 3, reps: "15-20", restSeconds: 60, muscleGroup: "Chest" },
    { name: "Squats", sets: 3, reps: "15-20", restSeconds: 60, muscleGroup: "Legs" },
    { name: "Plank", sets: 3, reps: "60s", restSeconds: 30, muscleGroup: "Core" }
  ];
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
