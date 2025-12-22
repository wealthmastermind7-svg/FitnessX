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
  const prompt = `You are a strength and conditioning coach helping find exercise alternatives.

Original Exercise: ${input.originalExercise}
Target Muscle: ${input.targetMuscle}
Available Equipment: ${input.equipment.join(", ")}
${input.constraints ? `Constraints: ${input.constraints.join(", ")}` : ""}

Suggest 3 exercise alternatives that:
1. Target the same muscle group
2. Have similar difficulty
3. Can be done with available equipment
4. Account for any constraints

Return ONLY valid JSON (no markdown):
{
  "exercises": [
    {
      "name": "exercise name",
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
