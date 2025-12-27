import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingWorkout">;

export default function OnboardingWorkoutScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    navigation.navigate("Main");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.root}>
      {/* Background */}
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.95)"] as const}
        style={styles.gradient}
      />

      {/* Progress indicator */}
      <View
        style={[
          styles.progressBar,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <View style={styles.progressDots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>
        <Pressable onPress={handleGetStarted}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
        }}
      >
        {/* Workout Card Mock */}
        <View style={styles.workoutCard}>
          <View style={styles.muscleVisualization}>
            <View style={styles.muscleImagePlaceholder}>
              <Feather name="zap" size={80} color={Colors.dark.accent} />
            </View>
            {/* Tags */}
            <View style={styles.tagsContainer}>
              <View style={styles.tag}>
                <ThemedText style={styles.tagText}>Back Muscles</ThemedText>
              </View>
              <View style={styles.tag}>
                <ThemedText style={styles.tagText}>Equipment: Dumbbells</ThemedText>
              </View>
              <View style={styles.tagVerified}>
                <Feather name="check-circle" size={14} color="white" />
                <ThemedText style={styles.tagTextWhite}>AI Generated</ThemedText>
              </View>
            </View>
          </View>

          {/* Quick stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Feather name="zap" size={16} color={Colors.dark.accent} />
              </View>
              <ThemedText style={styles.statLabel}>AI Generated</ThemedText>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <ThemedText style={styles.mainTitle}>
            Create Custom{"\n"}
            <ThemedText style={styles.highlightText}>Workouts in Seconds</ThemedText>
          </ThemedText>

          <ThemedText style={styles.description}>
            Select your muscle groups, equipment, and goals. Let our AI build the
            perfect routine for you instantly.
          </ThemedText>

          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Feather name="zap" size={16} color={Colors.dark.accent} />
              </View>
              <ThemedText style={styles.benefitText}>
                AI optimized for your goals
              </ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Feather name="save" size={16} color={Colors.dark.accent} />
              </View>
              <ThemedText style={styles.benefitText}>Save unlimited workouts</ThemedText>
            </View>
            <View style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Feather name="refresh-cw" size={16} color={Colors.dark.accent} />
              </View>
              <ThemedText style={styles.benefitText}>
                Generate new variations anytime
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.secondaryButtonText}>BACK</ThemedText>
        </Pressable>

        <LinearGradient
          colors={["#FF6B6B", "#FFB347"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.primaryButtonInner,
              pressed && styles.buttonPressed,
            ]}
          >
            <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
          </Pressable>
        </LinearGradient>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  progressBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    zIndex: 10,
  },
  progressDots: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 1.5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  dotActive: {
    width: 32,
    backgroundColor: Colors.dark.accent,
  },
  skipText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  workoutCard: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  muscleVisualization: {
    position: "relative",
    height: 280,
    backgroundColor: Colors.dark.backgroundTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  muscleImagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  tagsContainer: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  tagText: {
    ...Typography.caption,
    color: Colors.dark.text,
    fontWeight: "700",
  },
  tagVerified: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(255,107,107,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  tagTextWhite: {
    ...Typography.caption,
    color: "white",
    fontWeight: "700",
  },
  statsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    flexDirection: "row",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,107,107,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  descriptionSection: {
    gap: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  mainTitle: {
    ...Typography.h1,
    color: Colors.dark.text,
    lineHeight: 40,
  },
  highlightText: {
    color: Colors.dark.accent,
  },
  description: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
  },
  benefitsList: {
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,107,107,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    ...Typography.body,
    color: Colors.dark.text,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  primaryButton: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  primaryButtonInner: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...Typography.h3,
    color: "white",
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.text,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...Typography.h3,
    color: Colors.dark.text,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
