import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import WorkoutDetailScreen from "@/screens/WorkoutDetailScreen";
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
    </Stack.Navigator>
  );
}
