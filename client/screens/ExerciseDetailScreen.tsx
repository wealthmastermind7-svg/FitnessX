import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation } from "@tanstack/react-query";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { RootStackParamList, ExerciseDBExercise } from "@/navigation/RootStackNavigator";

type RouteParams = RouteProp<RootStackParamList, "ExerciseDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AIAlternative {
  name: string;
  difficulty: string;
  why: string;
}

interface AISubstitutionsResponse {
  exercises: AIAlternative[];
}

export default function ExerciseDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const initialExercise = route.params?.exercise as ExerciseDBExercise;
  const exercises = (route.params?.exercises as ExerciseDBExercise[]) || [initialExercise];
  const initialIndex = route.params?.exerciseIndex ?? 0;
  const baseUrl = getApiUrl();

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showAIInsights, setShowAIInsights] = useState(false);

  const exercise = exercises[currentIndex];

  const handleAlternativePress = useCallback((alternativeName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const fallbackExercise: ExerciseDBExercise = {
      id: `alternative-${alternativeName}`,
      name: alternativeName,
      target: exercise.target,
      bodyPart: exercise.bodyPart,
      equipment: exercise.equipment || "bodyweight",
      secondaryMuscles: exercise.secondaryMuscles || [],
      instructions: [`Perform this exercise with proper form`],
    };
    navigation.push("ExerciseDetail", { exercise: fallbackExercise });
  }, [exercise, navigation]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const aiInsightsMutation = useMutation({
    mutationFn: async (): Promise<AISubstitutionsResponse> => {
      const response = await apiRequest("POST", "/api/ai/substitutions", {
        originalExercise: exercise.name,
        targetMuscle: exercise.target,
        equipment: [exercise.equipment],
        constraints: [],
      });
      return response.json();
    },
  });

  const handleGetAIInsights = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setShowAIInsights(true);
    aiInsightsMutation.mutate();
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

        <Pressable onPress={handleGetAIInsights} style={styles.aiButton}>
          <LinearGradient
            colors={["#9D4EDD", "#5A189A"] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiButtonGradient}
          >
            <Feather name="cpu" size={20} color="#FFF" style={{ marginRight: Spacing.md }} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.aiButtonTitle}>
                AI Exercise Alternatives
              </ThemedText>
              <ThemedText style={styles.aiButtonSubtitle}>
                Find similar exercises that target the same muscle
              </ThemedText>
            </View>
            <Feather name="arrow-right" size={20} color="#FFF" />
          </LinearGradient>
        </Pressable>

        {showAIInsights && (
          <Card style={styles.aiInsightsCard}>
            <View style={styles.cardHeader}>
              <Feather name="zap" size={20} color="#9D4EDD" />
              <ThemedText style={[styles.cardTitle, { color: "#9D4EDD" }]}>
                AI Alternatives
              </ThemedText>
            </View>

            {aiInsightsMutation.isPending ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#9D4EDD" />
                <ThemedText style={styles.loadingText}>
                  Finding alternatives...
                </ThemedText>
              </View>
            ) : aiInsightsMutation.data?.exercises ? (
              aiInsightsMutation.data.exercises.map(
                (alt: { name: string; difficulty: string; why: string }, idx: number) => (
                  <Pressable 
                    key={idx} 
                    style={styles.alternativeItem}
                    onPress={() => handleAlternativePress(alt.name)}
                  >
                    <View style={styles.alternativeHeader}>
                      <ThemedText style={styles.alternativeName}>
                        {alt.name}
                      </ThemedText>
                      <View style={styles.difficultyBadge}>
                        <ThemedText style={styles.difficultyText}>
                          {alt.difficulty}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.alternativeWhy}>{alt.why}</ThemedText>
                  </Pressable>
                )
              )
            ) : aiInsightsMutation.isError ? (
              <ThemedText style={styles.errorText}>
                Unable to load alternatives. Please try again.
              </ThemedText>
            ) : null}
          </Card>
        )}

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
  aiButton: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  aiButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  aiButtonTitle: {
    ...Typography.body,
    color: "#FFF",
    fontWeight: "600",
  },
  aiButtonSubtitle: {
    ...Typography.small,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  aiInsightsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "#9D4EDD40",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  alternativeItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: -Spacing.sm,
  },
  alternativeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  alternativeName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    flex: 1,
  },
  difficultyBadge: {
    backgroundColor: Colors.dark.backgroundDefault,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  difficultyText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textTransform: "capitalize",
  },
  alternativeWhy: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  errorText: {
    ...Typography.body,
    color: "#FF6B6B",
    textAlign: "center",
    paddingVertical: Spacing.md,
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
