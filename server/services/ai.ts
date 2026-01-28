import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TrainingProgramInput {
  weeks: number;
  experience: string;
  equipment: string[];
  targetMuscles: string[];
  sessionsPerWeek: number;
  sessionLength: number;
}

interface ExerciseDetail {
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

interface SessionDay {
  day: string;
  exercises: ExerciseDetail[];
}

interface ProgramWeek {
  week: number;
  focus: string;
  sessions: SessionDay[];
}

interface TrainingProgram {
  weeks: ProgramWeek[];
}

export async function generateTrainingProgram(
  input: TrainingProgramInput
): Promise<TrainingProgram> {
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
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    // Try to extract JSON by finding the first { and matching closing }
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

    const program = JSON.parse(jsonStr) as TrainingProgram;
    return program;
  } catch (error) {
    console.error("Error generating training program:", error);
    throw error;
  }
}

export interface WorkoutFeedbackInput {
  exercisesCompleted: Array<{
    name: string;
    targetSets: number;
    completedSets: number;
    reps: string;
    rpe?: number; // Rate of Perceived Exertion (1-10)
  }>;
  totalDuration: number; // in minutes
  musclesFocused: string[];
  difficulty: string;
}

interface WorkoutFeedback {
  strengths: string[];
  areas_to_improve: string[];
  next_session_recommendation: string;
}

export async function generateWorkoutFeedback(
  input: WorkoutFeedbackInput
): Promise<WorkoutFeedback> {
  const exerciseSummary = input.exercisesCompleted
    .map(
      (e) =>
        `${e.name}: ${e.completedSets}/${e.targetSets} sets x ${e.reps} reps (RPE: ${e.rpe ?? "N/A"})`
    )
    .join("\n");

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
      max_tokens: 400,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const feedback = JSON.parse(jsonMatch[0]) as WorkoutFeedback;
    return feedback;
  } catch (error) {
    console.error("Error generating workout feedback:", error);
    throw error;
  }
}

export interface ExerciseSubstitutionInput {
  originalExercise: string;
  targetMuscle: string;
  equipment: string[];
  constraints?: string[];
}

interface ExerciseSubstitution {
  exercises: Array<{
    name: string;
    difficulty: string;
    why: string;
  }>;
}

export async function generateExerciseSubstitutions(
  input: ExerciseSubstitutionInput
): Promise<ExerciseSubstitution> {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const EXERCISEDB_HOST = "exercisedb.p.rapidapi.com";

  // Fetch real exercises for this target muscle from ExerciseDB
  let availableExercises: string[] = [];
  try {
    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/target/${encodeURIComponent(input.targetMuscle)}?limit=50`,
      {
        headers: {
          "X-RapidAPI-Key": RAPIDAPI_KEY || "",
          "X-RapidAPI-Host": EXERCISEDB_HOST,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        availableExercises = data.map((ex: any) => ex.name).filter((name: string) => name);
      }
    }
  } catch (error) {
    console.error("Failed to fetch exercises from ExerciseDB:", error);
  }

  // If no exercises found, fall back to a default list
  if (availableExercises.length === 0) {
    const muscleToExercises: Record<string, string[]> = {
      chest: ["Bench Press", "Incline Bench Press", "Dumbbell Bench Press", "Cable Fly", "Push-up"],
      back: ["Barbell Bent Over Row", "Lat Pulldown", "Seated Cable Row", "Pull-up", "Deadlift"],
      shoulders: ["Shoulder Press", "Lateral Raise", "Face Pull", "Upright Row", "Pike Push-up"],
      biceps: ["Barbell Curl", "Dumbbell Curl", "Cable Curl", "Hammer Curl", "Preacher Curl"],
      triceps: ["Tricep Pushdown", "Skull Crusher", "Close Grip Bench Press", "Dip", "Overhead Extension"],
      legs: ["Squat", "Leg Press", "Leg Curl", "Leg Extension", "Walking Lunge"],
      quads: ["Squat", "Leg Press", "Leg Extension", "Walking Lunge", "Bulgarian Split Squat"],
      hamstrings: ["Romanian Deadlift", "Leg Curl", "Good Morning", "Nordic Curl", "Glute-Ham Raise"],
      glutes: ["Hip Thrust", "Squat", "Leg Press", "Bulgarian Split Squat", "Leg Curl"],
      abs: ["Crunch", "Plank", "Ab Wheel", "Hanging Leg Raise", "Cable Woodchop"],
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
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const substitutions = JSON.parse(jsonMatch[0]) as ExerciseSubstitution;
    return substitutions;
  } catch (error) {
    console.error("Error generating exercise substitutions:", error);
    throw error;
  }
}

export interface RecoveryAdvisorInput {
  streak: number;
  minutesTrained: number;
  musclesHitLastWeek: string[];
  plannedMuscleToday: string;
  averageSessionDuration: number;
}

interface RecoveryAdvice {
  recommendation: string;
  reasoning: string;
  alternatives: string[];
}

export async function generateRecoveryAdvice(
  input: RecoveryAdvisorInput
): Promise<RecoveryAdvice> {
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
      max_tokens: 300,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const advice = JSON.parse(jsonMatch[0]) as RecoveryAdvice;
    return advice;
  } catch (error) {
    console.error("Error generating recovery advice:", error);
    throw error;
  }
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatInput {
  message: string;
  history: ChatMessage[];
}

export async function generateChatResponse(input: ChatInput): Promise<string> {
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
    { role: "system" as const, content: systemPrompt },
    ...input.history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: input.message },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
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

export interface FoodAnalysisResult {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  foods: string[];
  healthScore: number;
  suggestions: string[];
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysisResult> {
  const prompt = `You are a professional nutritionist. Analyze this food image and provide a nutritional breakdown.
Identify the foods present and estimate the calories, protein, carbs, fat, and fiber for the entire plate shown.
Also provide a health score from 1-100 and 3 actionable suggestions to improve the meal.

Return ONLY valid JSON in this exact schema:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "foods": ["food 1", "food 2"],
  "healthScore": number,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No content from OpenAI");
    return JSON.parse(content) as FoodAnalysisResult;
  } catch (error) {
    console.error("Error analyzing food image:", error);
    throw error;
  }
}
