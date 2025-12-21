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
