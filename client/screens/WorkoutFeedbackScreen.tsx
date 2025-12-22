import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import KeyboardAwareScrollViewCompat from "@/components/KeyboardAwareScrollViewCompat";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface Exercise {
  name: string;
  targetSets: number;
  completedSets: number;
  reps: string;
  rpe?: number;
}

interface Feedback {
  strengths: string[];
  areas_to_improve: string[];
  next_session_recommendation: string;
}

export default function WorkoutFeedbackScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const baseUrl = getApiUrl();

  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", targetSets: 3, completedSets: 3, reps: "8-10", rpe: 8 },
  ]);
  const [totalDuration, setTotalDuration] = useState("45");
  const [musclesFocused, setMusclesFocused] = useState("");
  const [difficulty, setDifficulty] = useState("Moderate");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const addExercise = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises([
      ...exercises,
      { name: "", targetSets: 3, completedSets: 3, reps: "8-10", rpe: 8 },
    ]);
  };

  const removeExercise = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const updateExercise = (
    index: number,
    key: keyof Exercise,
    value: any
  ) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [key]: value };
    setExercises(updated);
  };

  const handleGetFeedback = async () => {
    if (!exercises.some((e) => e.name.trim())) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}api/ai/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercisesCompleted: exercises.filter((e) => e.name.trim()),
          totalDuration: parseInt(totalDuration) || 45,
          musclesFocused: musclesFocused
            .split(",")
            .map((m) => m.trim())
            .filter((m) => m),
          difficulty,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFeedback(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error getting feedback:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (feedback) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFeedback(null);
            }}
          >
            <Feather name="chevron-down" size={28} color={Colors.dark.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Coach Feedback</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.feedbackCard}>
            <View style={styles.feedbackSection}>
              <View style={styles.feedbackIcon}>
                <Feather name="trending-up" size={20} color="#34C759" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.feedbackTitle}>
                  What You Did Well
                </ThemedText>
                {feedback.strengths.map((strength, idx) => (
                  <ThemedText key={idx} style={styles.feedbackItem}>
                    • {strength}
                  </ThemedText>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.feedbackSection}>
              <View style={styles.feedbackIcon}>
                <Feather name="alert-circle" size={20} color="#FF9500" />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.feedbackTitle}>
                  Areas to Improve
                </ThemedText>
                {feedback.areas_to_improve.map((area, idx) => (
                  <ThemedText key={idx} style={styles.feedbackItem}>
                    • {area}
                  </ThemedText>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.feedbackSection}>
              <View style={styles.feedbackIcon}>
                <Feather name="target" size={20} color={Colors.dark.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.feedbackTitle}>
                  Next Session Tip
                </ThemedText>
                <ThemedText style={styles.feedbackItem}>
                  {feedback.next_session_recommendation}
                </ThemedText>
              </View>
            </View>
          </Card>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFeedback(null);
            }}
            style={styles.newButton}
          >
            <ThemedText style={styles.newButtonText}>
              Get Feedback on Another Workout
            </ThemedText>
          </Pressable>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Feather name="chevron-down" size={28} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Workout Feedback</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.subtitle}>
          Log your workout details to get personalized AI coaching feedback
        </ThemedText>

        <Card style={styles.formCard}>
          <ThemedText style={styles.sectionLabel}>SESSION DETAILS</ThemedText>

          <View style={styles.inputRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.inputLabel}>Duration (min)</ThemedText>
              <TextInput
                style={styles.input}
                value={totalDuration}
                onChangeText={setTotalDuration}
                keyboardType="number-pad"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText style={styles.inputLabel}>Difficulty</ThemedText>
              <View style={styles.difficultyPicker}>
                {["Easy", "Moderate", "Hard"].map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDifficulty(level);
                    }}
                    style={[
                      styles.difficultyOption,
                      difficulty === level &&
                        styles.difficultyOptionSelected,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.difficultyText,
                        difficulty === level && styles.difficultyTextSelected,
                      ]}
                    >
                      {level}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={{ marginTop: Spacing.lg }}>
            <ThemedText style={styles.inputLabel}>Muscles Focused</ThemedText>
            <TextInput
              style={[styles.input, { height: 40 }]}
              value={musclesFocused}
              onChangeText={setMusclesFocused}
              placeholder="Chest, Back, Legs (comma-separated)"
              placeholderTextColor={Colors.dark.textSecondary}
            />
          </View>
        </Card>

        <View style={{ marginTop: Spacing.lg, marginBottom: Spacing.lg }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: Spacing.md,
            }}
          >
            <ThemedText style={styles.sectionLabel}>EXERCISES</ThemedText>
            <Pressable onPress={addExercise}>
              <Feather name="plus-circle" size={20} color={Colors.dark.accent} />
            </Pressable>
          </View>

          {exercises.map((exercise, idx) => (
            <Card key={idx} style={{ marginBottom: Spacing.md, padding: Spacing.md }}>
              <TextInput
                style={styles.exerciseName}
                value={exercise.name}
                onChangeText={(text) => updateExercise(idx, "name", text)}
                placeholder="Exercise name"
                placeholderTextColor={Colors.dark.textSecondary}
              />

              <View style={styles.exerciseRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.exerciseLabel}>
                    Target Sets
                  </ThemedText>
                  <TextInput
                    style={styles.exerciseInput}
                    value={String(exercise.targetSets)}
                    onChangeText={(text) =>
                      updateExercise(idx, "targetSets", parseInt(text) || 0)
                    }
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <ThemedText style={styles.exerciseLabel}>
                    Completed
                  </ThemedText>
                  <TextInput
                    style={styles.exerciseInput}
                    value={String(exercise.completedSets)}
                    onChangeText={(text) =>
                      updateExercise(idx, "completedSets", parseInt(text) || 0)
                    }
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.exerciseRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.exerciseLabel}>Reps</ThemedText>
                  <TextInput
                    style={styles.exerciseInput}
                    value={exercise.reps}
                    onChangeText={(text) => updateExercise(idx, "reps", text)}
                    placeholder="8-10"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.sm }}>
                  <ThemedText style={styles.exerciseLabel}>RPE</ThemedText>
                  <TextInput
                    style={styles.exerciseInput}
                    value={String(exercise.rpe || "")}
                    onChangeText={(text) =>
                      updateExercise(idx, "rpe", parseInt(text) || undefined)
                    }
                    placeholder="1-10"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              {exercises.length > 1 && (
                <Pressable
                  onPress={() => removeExercise(idx)}
                  style={styles.removeButton}
                >
                  <Feather name="trash-2" size={16} color="#FF3B30" />
                </Pressable>
              )}
            </Card>
          ))}
        </View>

        <Pressable
          onPress={handleGetFeedback}
          disabled={isLoading}
          style={styles.submitButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.submitButtonText}>
              Get AI Feedback
            </ThemedText>
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: "row",
  },
  inputLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  difficultyPicker: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  difficultyOptionSelected: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  difficultyText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  difficultyTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  exerciseName: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  exerciseRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
  },
  exerciseLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  exerciseInput: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  removeButton: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  submitButtonText: {
    ...Typography.body,
    color: "#FFF",
    fontWeight: "600",
  },
  feedbackCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  feedbackSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  feedbackIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  feedbackTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  feedbackItem: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.lg,
  },
  newButton: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  newButtonText: {
    ...Typography.body,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
});
