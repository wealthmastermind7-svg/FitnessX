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
import HealthSyncScreen from "@/screens/HealthSyncScreen";
import PlateCalculatorScreen from "@/screens/PlateCalculatorScreen";
import OnboardingFoodPlateScreen from "@/screens/OnboardingFoodPlateScreen";
import InviteFriendsScreen from "@/screens/InviteFriendsScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import CreatePostScreen from "@/screens/CreatePostScreen";
import MicroHabitsScreen from "@/screens/MicroHabitsScreen";
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
  description?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  category?: "strength" | "cardio" | "mobility" | "balance" | "stretching" | "plyometrics" | "rehabilitation";
};

export type WorkoutPost = {
  id: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  timestamp: Date;
  workoutTitle: string;
  description: string;
  duration: string;
  volume: string;
  sets?: number;
  records?: number;
  avgBpm?: number;
  calories?: number;
  exercises: { name: string; sets: number; gifUrl?: string }[];
  muscleSplit: { muscle: string; percentage: number }[];
  likes: number;
  comments: number;
  isLiked: boolean;
  imageUrl?: string;
};

import OnboardingFoodPlateScreen from "@/screens/OnboardingFoodPlateScreen";

export type RootStackParamList = {
  Main: undefined;
  WorkoutDetail: { workout: Workout };
  TrainingProgram: { program: any };
  ExerciseBrowser: { filterByMuscle?: string; filterByCategory?: string } | undefined;
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
  HealthSync: undefined;
  PlateCalculator: undefined;
  FoodPlate: undefined;
  InviteFriends: undefined;
  PostDetail: { post: WorkoutPost };
  CreatePost: { sharedExercise?: ExerciseDBExercise } | undefined;
  MicroHabits: undefined;
  OnboardingWelcome: undefined;
  OnboardingDiscover: undefined;
  OnboardingFoodPlate: undefined;
  OnboardingAICoach: undefined;
  OnboardingWorkout: undefined;
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
          presentation: "modal",
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
      <Stack.Screen
        name="HealthSync"
        component={HealthSyncScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PlateCalculator"
        component={PlateCalculatorScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FoodPlate"
        component={OnboardingFoodPlateScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="InviteFriends"
        component={InviteFriendsScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          presentation: "modal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MicroHabits"
        component={MicroHabitsScreen}
        options={{
          presentation: "card",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OnboardingWelcome"
        component={require("@/screens/OnboardingWelcomeScreen").default}
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="OnboardingDiscover"
        component={require("@/screens/OnboardingDiscoverScreen").default}
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="OnboardingFoodPlate"
        component={OnboardingFoodPlateScreen}
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="OnboardingAICoach"
        component={require("@/screens/OnboardingAICoachScreen").default}
        options={{ headerShown: false, animation: "fade" }}
      />
      <Stack.Screen
        name="OnboardingWorkout"
        component={require("@/screens/OnboardingWorkoutScreen").default}
        options={{ headerShown: false, animation: "fade" }}
      />
    </Stack.Navigator>
  );
}
