import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingWelcomeScreen from "@/screens/OnboardingWelcomeScreen";
import OnboardingDiscoverScreen from "@/screens/OnboardingDiscoverScreen";
import OnboardingProgressScreen from "@/screens/OnboardingProgressScreen";
import OnboardingFoodPlateScreen from "@/screens/OnboardingFoodPlateScreen";
import OnboardingAICoachScreen from "@/screens/OnboardingAICoachScreen";
import OnboardingWorkoutScreen from "@/screens/OnboardingWorkoutScreen";
import { Colors } from "@/constants/theme";

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingDiscover: undefined;
  OnboardingProgress: undefined;
  OnboardingFoodPlate: undefined;
  OnboardingAICoach: undefined;
  OnboardingWorkout: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.dark.backgroundRoot },
      }}
    >
      <Stack.Screen
        name="OnboardingWelcome"
        component={OnboardingWelcomeScreen}
        options={{
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="OnboardingDiscover"
        component={OnboardingDiscoverScreen}
      />
      <Stack.Screen
        name="OnboardingProgress"
        component={OnboardingProgressScreen}
      />
      <Stack.Screen
        name="OnboardingFoodPlate"
        component={OnboardingFoodPlateScreen}
      />
      <Stack.Screen
        name="OnboardingAICoach"
        component={OnboardingAICoachScreen}
      />
      <Stack.Screen
        name="OnboardingWorkout"
        component={OnboardingWorkoutScreen}
      />
    </Stack.Navigator>
  );
}
