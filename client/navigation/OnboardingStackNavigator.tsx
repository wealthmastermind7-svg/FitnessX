import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingWelcomeScreen from "@/screens/OnboardingWelcomeScreen";
import OnboardingDiscoverScreen from "@/screens/OnboardingDiscoverScreen";
import OnboardingAICoachScreen from "@/screens/OnboardingAICoachScreen";
import OnboardingWorkoutScreen from "@/screens/OnboardingWorkoutScreen";
import { Colors } from "@/constants/theme";

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingDiscover: undefined;
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
