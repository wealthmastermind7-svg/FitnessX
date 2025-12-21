import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import WorkoutDetailScreen from "@/screens/WorkoutDetailScreen";
import TrainingProgramScreen from "@/screens/TrainingProgramScreen";
import WorkoutFeedbackScreen from "@/screens/WorkoutFeedbackScreen";
import ExerciseSubstitutionScreen from "@/screens/ExerciseSubstitutionScreen";
import RecoveryAdvisorScreen from "@/screens/RecoveryAdvisorScreen";
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

export type RootStackParamList = {
  Main: undefined;
  WorkoutDetail: { workout: Workout };
  TrainingProgram: { program: any };
  WorkoutFeedback: undefined;
  ExerciseSubstitution: undefined;
  RecoveryAdvisor: undefined;
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
    </Stack.Navigator>
  );
}
