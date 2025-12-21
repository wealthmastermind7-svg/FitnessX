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
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const program = JSON.parse(jsonMatch[0]) as TrainingProgram;
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
