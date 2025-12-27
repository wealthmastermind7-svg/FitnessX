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

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingDiscover">;

const MUSCLE_GROUPS = [
  { name: "Chest", icon: "heart" },
  { name: "Back", icon: "move" },
  { name: "Shoulders", icon: "circle" },
  { name: "Arms", icon: "zap" },
];

export default function OnboardingDiscoverScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    navigation.navigate("OnboardingAICoach");
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
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Pressable onPress={() => navigation.navigate("Main")}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
        }}
      >
        {/* Content area */}
        <View style={styles.content}>
          <View style={styles.muscleGrid}>
            {MUSCLE_GROUPS.map((group) => (
              <View key={group.name} style={styles.muscleCard}>
                <View style={styles.muscleIconContainer}>
                  <Feather
                    name={group.icon as any}
                    size={32}
                    color={Colors.dark.accent}
                  />
                </View>
                <ThemedText style={styles.muscleName}>{group.name}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Section title and description */}
        <View style={styles.descriptionSection}>
          <View style={styles.iconRow}>
            <View style={styles.statsIcon}>
              <Feather
                name="bar-chart-2"
                size={20}
                color={Colors.dark.accent}
              />
            </View>
            <ThemedText style={styles.mainTitle}>
              Discover{"\n"}
              <ThemedText style={styles.highlightText}>1,300+ Exercises</ThemedText>
            </ThemedText>
          </View>

          <ThemedText style={styles.description}>
            Explore our comprehensive library. Filter by muscle group, equipment,
            or difficulty to build your perfect routine.
          </ThemedText>
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
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryButtonInner,
              pressed && styles.buttonPressed,
            ]}
          >
            <ThemedText style={styles.primaryButtonText}>NEXT</ThemedText>
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
  content: {
    marginVertical: Spacing.xxl,
  },
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  muscleCard: {
    width: "48%",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  muscleIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(255,107,107,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  muscleName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "500",
  },
  descriptionSection: {
    marginVertical: Spacing.xxl,
    gap: Spacing.lg,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.lg,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,107,107,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  mainTitle: {
    ...Typography.h1,
    color: Colors.dark.text,
    flex: 1,
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
