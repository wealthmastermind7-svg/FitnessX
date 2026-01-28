import React, { useState, useCallback, useEffect } from "react";
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";
import { RootStackParamList, ExerciseDBExercise } from "@/navigation/RootStackNavigator";
import { useRevenueCat } from "@/lib/revenuecat";

interface ExerciseStats {
  heaviestWeight: number | null;
  best1RM: number | null;
  bestSetVolume: number | null;
  bestSessionVolume: number | null;
}

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
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats>({
    heaviestWeight: null,
    best1RM: null,
    bestSetVolume: null,
    bestSessionVolume: null,
  });

  const exercise = exercises[currentIndex];
  const isLocked = !isProUser && currentIndex >= 10;

  const loadExerciseStats = useCallback(async () => {
    try {
      const workoutHistory = await AsyncStorage.getItem("workoutHistory");
      if (!workoutHistory) return;

      const history = JSON.parse(workoutHistory);
      const exerciseName = exercise.name.toLowerCase();
      
      let heaviestWeight = 0;
      let best1RM = 0;
      let bestSetVolume = 0;
      let bestSessionVolume = 0;

      history.forEach((session: any) => {
        let sessionVolume = 0;
        
        session.exercises?.forEach((ex: any) => {
          if (ex.name?.toLowerCase() === exerciseName) {
            ex.sets?.forEach((set: any) => {
              const weight = parseFloat(set.weight) || 0;
              const reps = parseInt(set.reps) || 0;
              
              if (weight > heaviestWeight) {
                heaviestWeight = weight;
              }
              
              const estimated1RM = weight * (1 + reps / 30);
              if (estimated1RM > best1RM) {
                best1RM = estimated1RM;
              }
              
              const setVolume = weight * reps;
              if (setVolume > bestSetVolume) {
                bestSetVolume = setVolume;
              }
              
              sessionVolume += setVolume;
            });
          }
        });
        
        if (sessionVolume > bestSessionVolume) {
          bestSessionVolume = sessionVolume;
        }
      });

      setExerciseStats({
        heaviestWeight: heaviestWeight > 0 ? heaviestWeight : null,
        best1RM: best1RM > 0 ? Math.round(best1RM) : null,
        bestSetVolume: bestSetVolume > 0 ? bestSetVolume : null,
        bestSessionVolume: bestSessionVolume > 0 ? bestSessionVolume : null,
      });
    } catch (error) {
      console.error("Error loading exercise stats:", error);
    }
  }, [exercise.name]);

  useFocusEffect(
    useCallback(() => {
      loadExerciseStats();
    }, [loadExerciseStats])
  );

  useEffect(() => {
    loadExerciseStats();
  }, [currentIndex, loadExerciseStats]);

  const formatWeight = (value: number | null) => {
    if (value === null) return "-";
    return `${value} lbs`;
  };

  const formatVolume = (value: number | null) => {
    if (value === null) return "-";
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

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
            {exercise.difficulty && (
              <View style={[styles.tag, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Feather name="bar-chart" size={14} color="#FFF" />
                <ThemedText style={[styles.tagText, { color: "#FFF" }]}>
                  {exercise.difficulty}
                </ThemedText>
              </View>
            )}
            {exercise.category && (
              <View style={[styles.tag, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Feather name="tag" size={14} color="#FFF" />
                <ThemedText style={[styles.tagText, { color: "#FFF" }]}>
                  {exercise.category}
                </ThemedText>
              </View>
            )}
          </View>

          {exercise.description && (
            <View style={styles.descriptionContainer}>
              <ThemedText style={styles.descriptionText}>{exercise.description}</ThemedText>
            </View>
          )}

          {/* Advanced Stats Section - Real Data */}
          <View style={styles.advancedStatsGrid}>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Heaviest Weight</ThemedText>
              <ThemedText style={[styles.statMiniValue, exerciseStats.heaviestWeight && styles.statMiniValueActive]}>
                {formatWeight(exerciseStats.heaviestWeight)}
              </ThemedText>
            </Card>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Best 1RM</ThemedText>
              <ThemedText style={[styles.statMiniValue, exerciseStats.best1RM && styles.statMiniValueActive]}>
                {formatWeight(exerciseStats.best1RM)}
              </ThemedText>
            </Card>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Best Set Vol.</ThemedText>
              <ThemedText style={[styles.statMiniValue, exerciseStats.bestSetVolume && styles.statMiniValueActive]}>
                {formatVolume(exerciseStats.bestSetVolume)}
              </ThemedText>
            </Card>
            <Card elevation={2} style={styles.statMiniCard}>
              <ThemedText style={styles.statMiniLabel}>Best Session</ThemedText>
              <ThemedText style={[styles.statMiniValue, exerciseStats.bestSessionVolume && styles.statMiniValueActive]}>
                {formatVolume(exerciseStats.bestSessionVolume)}
              </ThemedText>
            </Card>
          </View>
          {!exerciseStats.heaviestWeight && (
            <ThemedText style={styles.noStatsHint}>
              Log workouts to track your personal records
            </ThemedText>
          )}

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
  descriptionContainer: {
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  descriptionText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
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
    color: Colors.dark.textSecondary,
  },
  statMiniValueActive: {
    color: Colors.dark.accent,
  },
  noStatsHint: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: Spacing.lg,
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
