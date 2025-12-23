import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import WorkoutDetailScreen from "@/screens/WorkoutDetailScreen";
import TrainingProgramScreen from "@/screens/TrainingProgramScreen";
import ExerciseDetailScreen from "@/screens/ExerciseDetailScreen";
import ExerciseBrowserScreen from "@/screens/ExerciseBrowserScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import CoachesScreen from "@/screens/CoachesScreen";
import AIChatScreen from "@/screens/AIChatScreen";
import SavedWorkoutsScreen from "@/screens/SavedWorkoutsScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import CustomerCenterScreen from "@/screens/CustomerCenterScreen";
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
  ExerciseBrowser: { filterByMuscle?: string } | undefined;
  ExerciseDetail: { 
    exercise: ExerciseDBExercise;
    exercises?: ExerciseDBExercise[];
    exerciseIndex?: number;
  };
  Community: undefined;
  Coaches: undefined;
  AIChat: undefined;
  SavedWorkouts: undefined;
  Paywall: undefined;
  CustomerCenter: undefined;
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
        name="SavedWorkouts"
        component={SavedWorkoutsScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CustomerCenter"
        component={CustomerCenterScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
