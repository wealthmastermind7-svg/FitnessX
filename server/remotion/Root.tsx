import { Composition } from "remotion";
import { WorkoutSummary, workoutSummarySchema } from "./WorkoutSummary";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="WorkoutSummary"
        component={WorkoutSummary}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        schema={workoutSummarySchema}
        defaultProps={{
          workoutName: "Push Day Power",
          duration: 45,
          exerciseCount: 6,
          totalVolume: 12500,
          caloriesBurned: 420,
          muscleGroups: ["Chest", "Shoulders", "Triceps"],
          personalRecords: 2,
          userName: "Alex",
          completedAt: new Date().toISOString(),
        }}
      />
    </>
  );
};
