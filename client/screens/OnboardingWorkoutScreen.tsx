import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useOnboarding } from "@/contexts/OnboardingContext";

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingWorkout">;

export default function OnboardingWorkoutScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const handleGetStarted = () => {
    completeOnboarding();
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.header}>
          <Image source={require("@/assets/images/fitforge-icon.png")} style={styles.headerIcon} />
          <ThemedText style={styles.timeText}>9:41</ThemedText>
          <View style={styles.headerRight}>
            <View style={styles.signalIcons}>
              <Feather name="bar-chart-2" size={14} color="#333" />
              <Feather name="wifi" size={14} color="#333" />
              <Feather name="battery" size={14} color="#333" />
            </View>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <View style={styles.moonIcon}>
                <Feather name="moon" size={16} color="#333" />
              </View>
              <ThemedText style={styles.skipText}>Skip</ThemedText>
            </Pressable>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardContainer}>
            <View style={styles.workoutCard}>
              <View style={styles.cardImageContainer}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400&q=80" }}
                  style={styles.muscleImage}
                  resizeMode="cover"
                />
                <View style={styles.muscleBadge}>
                  <ThemedText style={styles.muscleBadgeText}>Back Muscles</ThemedText>
                </View>
                <View style={styles.equipmentBadge}>
                  <ThemedText style={styles.equipmentBadgeText}>Equipment: Dumbbells</ThemedText>
                </View>
              </View>

              <View style={styles.checkmarkFloating}>
                <Feather name="check" size={18} color="#22C55E" />
              </View>

              <View style={styles.cardDetailsRow}>
                <View style={styles.togglePlaceholder} />
              </View>
            </View>

            <View style={styles.aiGeneratedBadge}>
              <View style={styles.aiIconContainer}>
                <Feather name="zap" size={16} color="#8B5CF6" />
              </View>
              <View>
                <ThemedText style={styles.aiBadgeTitle}>AI Generated</ThemedText>
                <ThemedText style={styles.aiBadgeSubtitle}>Optimized for you</ThemedText>
              </View>
            </View>

            <LinearGradient
              colors={["#FF6B6B", "#FFB347"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressBar}
            />
          </View>
        </ScrollView>

        <View style={styles.descriptionSection}>
          <ThemedText style={styles.mainTitle}>Create Custom</ThemedText>
          <View style={styles.workoutTitleRow}>
            <ThemedText style={styles.highlightText}>Workouts</ThemedText>
            <ThemedText style={styles.mainTitle}> in Seconds</ThemedText>
          </View>

          <ThemedText style={styles.description}>
            Select your muscle groups, equipment, and goals. Let our AI build the perfect routine for you instantly.
          </ThemedText>

          <View style={styles.progressDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
          </View>
        </View>

        <Pressable
          onPress={handleGetStarted}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
          <Feather name="arrow-right" size={20} color="white" />
        </Pressable>
      </View>

      <View style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0221",
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.8)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  signalIcons: {
    flexDirection: "row",
    gap: 4,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moonIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: "center",
  },
  cardContainer: {
    width: "100%",
    alignItems: "center",
  },
  workoutCard: {
    width: "90%",
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
    position: "relative",
  },
  cardImageContainer: {
    height: 200,
    backgroundColor: "#1A1A1A",
    position: "relative",
  },
  muscleImage: {
    width: "100%",
    height: "100%",
    opacity: 0.8,
  },
  muscleBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#FF6B6B",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  muscleBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
  },
  equipmentBadge: {
    position: "absolute",
    bottom: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  equipmentBadgeText: {
    fontSize: 12,
    color: "white",
  },
  checkmarkFloating: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetailsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
  },
  togglePlaceholder: {
    width: 50,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  aiGeneratedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: -20,
    marginLeft: -80,
    backgroundColor: "rgba(30, 30, 40, 0.9)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
    zIndex: 10,
  },
  aiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiBadgeTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  aiBadgeSubtitle: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
  },
  progressBar: {
    width: "75%",
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.lg,
  },
  descriptionSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  workoutTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: Spacing.md,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    lineHeight: 36,
  },
  highlightText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FF6B6B",
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: Spacing.lg,
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#FF6B6B",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
    borderRadius: 20,
    gap: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    marginLeft: -50,
    width: 100,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 3,
  },
});
