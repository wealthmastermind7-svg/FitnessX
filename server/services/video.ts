import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

const OUTPUT_DIR = path.join(process.cwd(), "public", "videos");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

export interface WorkoutVideoData {
  workoutName: string;
  duration: number;
  exerciseCount: number;
  totalVolume: number;
  caloriesBurned: number;
  muscleGroups: string[];
  personalRecords: number;
  userName: string;
  completedAt: string;
}

let bundledPath: string | null = null;

async function getBundledPath(): Promise<string> {
  if (bundledPath) {
    return bundledPath;
  }

  console.log("[Video Service] Bundling Remotion project...");
  const entryPoint = path.join(process.cwd(), "server", "remotion", "index.tsx");
  
  bundledPath = await bundle({
    entryPoint,
    onProgress: (progress) => {
      if (progress === 100) {
        console.log("[Video Service] Bundle complete!");
      }
    },
  });

  return bundledPath;
}

export async function generateWorkoutSummaryVideo(
  data: WorkoutVideoData
): Promise<string> {
  const videoId = uuidv4();
  const outputPath = path.join(OUTPUT_DIR, `${videoId}.mp4`);

  console.log(`[Video Service] Generating video: ${videoId}`);
  console.log(`[Video Service] Data:`, JSON.stringify(data, null, 2));

  try {
    const serveUrl = await getBundledPath();

    const inputProps = data as unknown as Record<string, unknown>;

    const composition = await selectComposition({
      serveUrl,
      id: "WorkoutSummary",
      inputProps,
    });

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        if (Math.round(progress * 100) % 25 === 0) {
          console.log(`[Video Service] Rendering: ${Math.round(progress * 100)}%`);
        }
      },
    });

    console.log(`[Video Service] Video generated: ${outputPath}`);

    return `/videos/${videoId}.mp4`;
  } catch (error) {
    console.error("[Video Service] Error generating video:", error);
    throw error;
  }
}

export async function cleanupOldVideos(maxAgeMinutes: number = 60): Promise<void> {
  try {
    const files = fs.readdirSync(OUTPUT_DIR);
    const now = Date.now();
    const maxAgeMs = maxAgeMinutes * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(OUTPUT_DIR, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAgeMs) {
        fs.unlinkSync(filePath);
        console.log(`[Video Service] Cleaned up old video: ${file}`);
      }
    }
  } catch (error) {
    console.error("[Video Service] Error cleaning up videos:", error);
  }
}
