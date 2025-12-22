import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import WorkoutDetailScreen from "@/screens/WorkoutDetailScreen";
import TrainingProgramScreen from "@/screens/TrainingProgramScreen";
import WorkoutFeedbackScreen from "@/screens/WorkoutFeedbackScreen";
import ExerciseSubstitutionScreen from "@/screens/ExerciseSubstitutionScreen";
import RecoveryAdvisorScreen from "@/screens/RecoveryAdvisorScreen";
import ExerciseDetailScreen from "@/screens/ExerciseDetailScreen";
import ExerciseBrowserScreen from "@/screens/ExerciseBrowserScreen";
import WorkoutDiaryScreen from "@/screens/WorkoutDiaryScreen";
import ProgressScreen from "@/screens/ProgressScreen";
import NutritionScreen from "@/screens/NutritionScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import CoachesScreen from "@/screens/CoachesScreen";
import AIChatScreen from "@/screens/AIChatScreen";
import FormCoachScreen from "@/screens/FormCoachScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Colors } from "@/constants/theme";

export type Workout = {
  id: string;
  name: string;
  description: string;
  muscleGroups: string[];
  equipment: string[];
  exercises: Exercise[];
  difficulty: string;
};

export type Exercise = {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  muscleGroup: string;
};

export type ExerciseDBExercise = {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  secondaryMuscles: string[];
  equipment: string;
  gifUrl: string;
  instructions: string[];
};

export type RootStackParamList = {
  Main: undefined;
  WorkoutDetail: { workout: Workout };
  TrainingProgram: { program: any };
  WorkoutFeedback: undefined;
  ExerciseSubstitution: undefined;
  RecoveryAdvisor: undefined;
  ExerciseBrowser: { filterByMuscle?: string } | undefined;
  ExerciseDetail: { 
    exercise: ExerciseDBExercise;
    exercises?: ExerciseDBExercise[];
    exerciseIndex?: number;
  };
  WorkoutDiary: undefined;
  Progress: undefined;
  Nutrition: undefined;
  Community: undefined;
  Coaches: undefined;
  AIChat: undefined;
  FormCoach: { exerciseName?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        contentStyle: { backgroundColor: Colors.dark.backgroundRoot },
      }}
    >
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TrainingProgram"
        component={TrainingProgramScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WorkoutFeedback"
        component={WorkoutFeedbackScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExerciseSubstitution"
        component={ExerciseSubstitutionScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="RecoveryAdvisor"
        component={RecoveryAdvisorScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExerciseBrowser"
        component={ExerciseBrowserScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetailScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WorkoutDiary"
        component={WorkoutDiaryScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Nutrition"
        component={NutritionScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Coaches"
        component={CoachesScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AIChat"
        component={AIChatScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FormCoach"
        component={FormCoachScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
