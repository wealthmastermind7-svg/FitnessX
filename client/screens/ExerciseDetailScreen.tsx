import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { RootStackParamList, ExerciseDBExercise } from "@/navigation/RootStackNavigator";
import { useRevenueCat } from "@/lib/revenuecat";

type RouteParams = RouteProp<RootStackParamList, "ExerciseDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;


export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { isProUser } = useRevenueCat();
  const initialExercise = route.params?.exercise as ExerciseDBExercise;
  const exercises = (route.params?.exercises as ExerciseDBExercise[]) || [initialExercise];
  const initialIndex = route.params?.exerciseIndex ?? 0;
  const baseUrl = getApiUrl();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const exercise = exercises[currentIndex];
  const isLocked = !isProUser && currentIndex >= 10;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      if (!isProUser && prevIndex >= 10) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Pro Feature",
          "Free users can browse the first 10 exercises. Upgrade to Pro to access all 1,300+ exercises and generate and save up to 100 workouts.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => navigation.navigate("Paywall") },
          ]
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(prevIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      const nextIndex = currentIndex + 1;
      if (!isProUser && nextIndex >= 10) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Pro Feature",
          "Free users can browse the first 10 exercises. Upgrade to Pro to access all 1,300+ exercises and generate and save up to 100 workouts.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => navigation.navigate("Paywall") },
          ]
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(nextIndex);
    }
  };


  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>
            {exercise.name}
          </ThemedText>
          {exercises.length > 1 && (
            <ThemedText style={styles.exerciseCounter}>
              {currentIndex + 1} of {exercises.length}
            </ThemedText>
          )}
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={handlePrevious}
            disabled={currentIndex === 0}
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          >
            <Feather 
              name="chevron-left" 
              size={24} 
              color={currentIndex === 0 ? Colors.dark.textSecondary : Colors.dark.text} 
            />
          </Pressable>
          <Pressable
            onPress={handleNext}
            disabled={currentIndex === exercises.length - 1}
            style={[styles.navButton, currentIndex === exercises.length - 1 && styles.navButtonDisabled]}
          >
            <Feather 
              name="chevron-right" 
              size={24} 
              color={currentIndex === exercises.length - 1 ? Colors.dark.textSecondary : Colors.dark.text} 
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gifContainer}>
          {exercise.id.startsWith("stub-") ? (
            <View style={styles.gifPlaceholder}>
              <LinearGradient
                colors={["#1a1f35", "#0f1225"] as any}
                style={styles.gifPlaceholderGradient}
              >
                <Feather name="activity" size={64} color={Colors.dark.textSecondary} />
                <ThemedText style={styles.placeholderText}>
                  Exercise Demonstration
                </ThemedText>
                <ThemedText style={styles.placeholderSubtext}>
                  Animation not available
                </ThemedText>
              </LinearGradient>
            </View>
          ) : (
            <Image
              source={{ uri: `${baseUrl}api/exercises/image/${exercise.id}?resolution=720` }}
              style={styles.gifImage}
              contentFit="contain"
              transition={300}
              onError={(error) => {
                console.warn(`Failed to load GIF for exercise ${exercise.id}:`, error);
              }}
            />
          )}
          <View style={styles.gifOverlay}>
            <View style={styles.muscleHighlight}>
              <Feather name="target" size={16} color="#FFF" />
              <ThemedText style={styles.muscleHighlightText}>
                {exercise.target}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <ThemedText style={styles.exerciseTitle}>{exercise.name}</ThemedText>

          <View style={styles.tagsRow}>
            <View style={[styles.tag, styles.bodyPartTag]}>
              <Feather name="user" size={14} color={Colors.dark.accent} />
              <ThemedText style={styles.tagText}>{exercise.bodyPart}</ThemedText>
            </View>
            <View style={[styles.tag, styles.equipmentTag]}>
              <Feather name="tool" size={14} color="#9D4EDD" />
              <ThemedText style={[styles.tagText, { color: "#9D4EDD" }]}>
                {exercise.equipment}
              </ThemedText>
            </View>
          </View>

          {/* Advanced Stats Section */}
          <View style={styles.advancedStatsGrid}>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Heaviest Weight</ThemedText>
              <ThemedText style={styles.statMiniValue}>-</ThemedText>
            </Card>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Best 1RM</ThemedText>
              <ThemedText style={styles.statMiniValue}>-</ThemedText>
            </Card>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Best Set Vol.</ThemedText>
              <ThemedText style={styles.statMiniValue}>-</ThemedText>
            </Card>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Best Session</ThemedText>
              <ThemedText style={styles.statMiniValue}>-</ThemedText>
            </Card>
          </View>

          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
            <View style={styles.secondaryMuscles}>
              <ThemedText style={styles.sectionLabel}>
                Secondary Muscles
              </ThemedText>
              <View style={styles.secondaryTags}>
                {exercise.secondaryMuscles.map((muscle: string, idx: number) => (
                  <View key={idx} style={styles.secondaryTag}>
                    <ThemedText style={styles.secondaryTagText}>
                      {muscle}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <Card style={styles.instructionsCard}>
          <View style={styles.cardHeader}>
            <Feather name="list" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.cardTitle}>Instructions</ThemedText>
          </View>
          {exercise.instructions && exercise.instructions.length > 0 ? (
            exercise.instructions.map((instruction: string, idx: number) => (
              <View key={idx} style={styles.instructionRow}>
                <View style={styles.stepNumber}>
                  <ThemedText style={styles.stepNumberText}>{idx + 1}</ThemedText>
                </View>
                <ThemedText style={styles.instructionText}>
                  {instruction}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText style={styles.noInstructions}>
              No instructions available for this exercise.
            </ThemedText>
          )}
        </Card>

        <Card style={styles.suggestedCard}>
          <View style={styles.cardHeader}>
            <Feather name="bar-chart-2" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.cardTitle}>Suggested Sets & Reps</ThemedText>
          </View>
          <View style={styles.suggestedRow}>
            <View style={styles.suggestedItem}>
              <ThemedText style={styles.suggestedValue}>3-4</ThemedText>
              <ThemedText style={styles.suggestedLabel}>Sets</ThemedText>
            </View>
            <View style={styles.suggestedDivider} />
            <View style={styles.suggestedItem}>
              <ThemedText style={styles.suggestedValue}>8-12</ThemedText>
              <ThemedText style={styles.suggestedLabel}>Reps</ThemedText>
            </View>
            <View style={styles.suggestedDivider} />
            <View style={styles.suggestedItem}>
              <ThemedText style={styles.suggestedValue}>60-90s</ThemedText>
              <ThemedText style={styles.suggestedLabel}>Rest</ThemedText>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    textAlign: "center",
    textTransform: "capitalize",
  },
  exerciseCounter: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  gifContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  gifImage: {
    width: "100%",
    height: "100%",
  },
  gifPlaceholder: {
    width: "100%",
    height: "100%",
  },
  gifPlaceholderGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    ...Typography.h3,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  placeholderSubtext: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    opacity: 0.7,
  },
  gifOverlay: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
  },
  muscleHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  muscleHighlightText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "capitalize",
  },
  infoSection: {
    marginBottom: Spacing.lg,
  },
  exerciseTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    textTransform: "capitalize",
    marginBottom: Spacing.md,
  },
  tagsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  bodyPartTag: {
    backgroundColor: `${Colors.dark.accent}20`,
  },
  equipmentTag: {
    backgroundColor: "#9D4EDD20",
  },
  tagText: {
    ...Typography.small,
    color: Colors.dark.accent,
    textTransform: "capitalize",
    fontWeight: "500",
  },
  secondaryMuscles: {
    marginTop: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  secondaryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  secondaryTag: {
    backgroundColor: Colors.dark.backgroundDefault,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  secondaryTagText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textTransform: "capitalize",
  },
  advancedStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statMiniCard: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  statMiniLabel: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  statMiniValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.dark.text,
  },
  instructionsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  instructionRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  instructionText: {
    flex: 1,
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  noInstructions: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    fontStyle: "italic",
  },
  suggestedCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  suggestedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  suggestedItem: {
    alignItems: "center",
    flex: 1,
  },
  suggestedValue: {
    ...Typography.h2,
    color: Colors.dark.accent,
    fontWeight: "700",
  },
  suggestedLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  suggestedDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },
});
