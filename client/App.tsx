import React from "react";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import OnboardingStackNavigator from "@/navigation/OnboardingStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RevenueCatProvider } from "@/lib/revenuecat";
import { OnboardingProvider, useOnboarding } from "@/contexts/OnboardingContext";
import { Colors } from "@/constants/theme";

function NavigationRoot() {
  const { isOnboardingComplete, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={Colors.dark.accent}
        />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isOnboardingComplete ? <RootStackNavigator /> : <OnboardingStackNavigator />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <OnboardingProvider>
        <RevenueCatProvider>
          <QueryClientProvider client={queryClient}>
              <SafeAreaProvider>
                <GestureHandlerRootView style={styles.root}>
                  <KeyboardProvider>
                    <NavigationRoot />
                    <StatusBar style="light" />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </SafeAreaProvider>
            </QueryClientProvider>
        </RevenueCatProvider>
      </OnboardingProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    alignItems: "center",
    justifyContent: "center",
  },
});
