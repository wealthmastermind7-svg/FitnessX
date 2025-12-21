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
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface Substitution {
  name: string;
  difficulty: string;
  why: string;
}

interface Result {
  exercises: Substitution[];
}

export default function ExerciseSubstitutionScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const baseUrl = getApiUrl();

  const [originalExercise, setOriginalExercise] = useState("");
  const [targetMuscle, setTargetMuscle] = useState("");
  const [constraints, setConstraints] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const handleGetSubstitutions = async () => {
    if (!originalExercise.trim() || !targetMuscle.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}api/ai/substitutions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalExercise: originalExercise.trim(),
          targetMuscle: targetMuscle.trim(),
          equipment: ["dumbbell", "barbell", "resistance band", "bodyweight"],
          constraints: constraints
            .split(",")
            .map((c) => c.trim())
            .filter((c) => c),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error getting substitutions:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (result) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setResult(null);
            }}
          >
            <Feather name="chevron-down" size={28} color={Colors.dark.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Alternatives Found</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText style={styles.subtitle}>
            Here are perfect swaps for {originalExercise}
          </ThemedText>

          {result.exercises.map((exercise, idx) => (
            <Card key={idx} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View>
                  <ThemedText style={styles.exerciseName}>
                    {exercise.name}
                  </ThemedText>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: Spacing.xs,
                    }}
                  >
                    <Feather
                      name="zap"
                      size={12}
                      color={Colors.dark.textSecondary}
                      style={{ marginRight: Spacing.xs }}
                    />
                    <ThemedText style={styles.difficulty}>
                      {exercise.difficulty}
                    </ThemedText>
                  </View>
                </View>
              </View>
              <ThemedText style={styles.explanation}>{exercise.why}</ThemedText>
            </Card>
          ))}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setResult(null);
            }}
            style={styles.newButton}
          >
            <ThemedText style={styles.newButtonText}>
              Find More Alternatives
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
        <ThemedText style={styles.headerTitle}>
          Exercise Alternatives
        </ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.subtitle}>
          Find perfect alternatives when you lack equipment or have injuries
        </ThemedText>

        <Card style={styles.formCard}>
          <ThemedText style={styles.inputLabel}>Exercise Name</ThemedText>
          <TextInput
            style={styles.input}
            value={originalExercise}
            onChangeText={setOriginalExercise}
            placeholder="e.g., Barbell Squat"
            placeholderTextColor={Colors.dark.textSecondary}
          />

          <ThemedText style={[styles.inputLabel, { marginTop: Spacing.lg }]}>
            Target Muscle
          </ThemedText>
          <TextInput
            style={styles.input}
            value={targetMuscle}
            onChangeText={setTargetMuscle}
            placeholder="e.g., Quadriceps"
            placeholderTextColor={Colors.dark.textSecondary}
          />

          <ThemedText style={[styles.inputLabel, { marginTop: Spacing.lg }]}>
            Constraints (Optional)
          </ThemedText>
          <TextInput
            style={styles.input}
            value={constraints}
            onChangeText={setConstraints}
            placeholder="e.g., no heavy weights, knee pain"
            placeholderTextColor={Colors.dark.textSecondary}
          />
        </Card>

        <Pressable
          onPress={handleGetSubstitutions}
          disabled={isLoading || !originalExercise.trim() || !targetMuscle.trim()}
          style={styles.submitButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.submitButtonText}>
              Find Alternatives
            </ThemedText>
          )}
        </Pressable>
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
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  input: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.dark.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
  exerciseCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  exerciseHeader: {
    marginBottom: Spacing.md,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  difficulty: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  explanation: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
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
