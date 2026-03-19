import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "@fitforge_onboarding_complete";

interface OnboardingContextType {
  isOnboardingComplete: boolean | null;
  isLoading: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsOnboardingComplete(value === "true");
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      console.log("[Onboarding] Saving onboarding complete flag to AsyncStorage");
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      console.log("[Onboarding] Setting isOnboardingComplete to true");
      setIsOnboardingComplete(true);
      console.log("[Onboarding] Onboarding state updated");
    } catch (error) {
      console.error("Error marking onboarding as complete:", error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setIsOnboardingComplete(false);
    } catch (error) {
      console.error("Error resetting onboarding:", error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete,
        isLoading,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextType {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}
