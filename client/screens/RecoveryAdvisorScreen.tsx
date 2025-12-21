import React, { useState, useEffect } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface RecoveryAdvice {
  recommendation: string;
  reasoning: string;
  alternatives: string[];
}

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Abs",
];

export default function RecoveryAdvisorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const baseUrl = getApiUrl();

  const [streak, setStreak] = useState(0);
  const [minutesTrained, setMinutesTrained] = useState(0);
  const [musclesHitLastWeek, setMusclesHitLastWeek] = useState<string[]>([]);
  const [plannedMuscle, setPlannedMuscle] = useState("Chest");
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<RecoveryAdvice | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const stats = await AsyncStorage.getItem("workoutStats");
      if (stats) {
        const parsed = JSON.parse(stats);
        setStreak(parsed.currentStreak || 0);
        setMinutesTrained(parsed.minutesTrained || 0);
        setMusclesHitLastWeek(parsed.musclesHitLastWeek || []);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleGetAdvice = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsLoading(true);

    try {
      const response = await fetch(`${baseUrl}api/ai/recovery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streak,
          minutesTrained,
          musclesHitLastWeek:
            musclesHitLastWeek.length > 0 ? musclesHitLastWeek : ["Chest"],
          plannedMuscleToday: plannedMuscle,
          averageSessionDuration: 45,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAdvice(data);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error getting recovery advice:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (advice) {
    const isRest = advice.recommendation.toLowerCase() === "rest";
    const isModify = advice.recommendation.toLowerCase() === "modify";

    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAdvice(null);
            }}
          >
            <Feather name="chevron-down" size={28} color={Colors.dark.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>
            {isRest ? "Take a Rest Day" : "Recovery Advice"}
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
          <Card
            style={[
              styles.recommendationCard,
              {
                backgroundColor: isRest
                  ? "#FF3B3020"
                  : isModify
                    ? "#FF950020"
                    : "#34C75920",
              },
            ]}
          >
            <View style={styles.recommendationHeader}>
              <Feather
                name={
                  isRest ? "heart" : isModify ? "alert-circle" : "check-circle"
                }
                size={32}
                color={
                  isRest ? "#FF3B30" : isModify ? "#FF9500" : "#34C759"
                }
              />
              <ThemedText
                style={[
                  styles.recommendationText,
                  {
                    color: isRest ? "#FF3B30" : isModify ? "#FF9500" : "#34C759",
                  },
                ]}
              >
                {advice.recommendation.toUpperCase()}
              </ThemedText>
            </View>
          </Card>

          <Card style={styles.reasoningCard}>
            <ThemedText style={styles.reasoningTitle}>Why?</ThemedText>
            <ThemedText style={styles.reasoningText}>
              {advice.reasoning}
            </ThemedText>
          </Card>

          {advice.alternatives.length > 0 && (
            <Card style={styles.alternativesCard}>
              <ThemedText style={styles.alternativesTitle}>
                If You Want to Train
              </ThemedText>
              {advice.alternatives.map((alt, idx) => (
                <View key={idx} style={styles.alternativeItem}>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={Colors.dark.accent}
                    style={{ marginRight: Spacing.md }}
                  />
                  <ThemedText style={styles.alternativeText}>{alt}</ThemedText>
                </View>
              ))}
            </Card>
          )}

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAdvice(null);
            }}
            style={styles.newButton}
          >
            <ThemedText style={styles.newButtonText}>
              Get New Analysis
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
        <ThemedText style={styles.headerTitle}>Recovery Advisor</ThemedText>
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
          Should you train today? Get AI guidance based on your current state
        </ThemedText>

        <Card style={styles.statsCard}>
          <ThemedText style={styles.statsTitle}>Your Status</ThemedText>

          <View style={styles.statRow}>
            <Feather name="zap" size={20} color={Colors.dark.accent} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText style={styles.statLabel}>Current Streak</ThemedText>
              <ThemedText style={styles.statValue}>
                {streak} workouts
              </ThemedText>
            </View>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statRow}>
            <Feather name="clock" size={20} color={Colors.dark.accent} />
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText style={styles.statLabel}>
                Trained This Week
              </ThemedText>
              <ThemedText style={styles.statValue}>
                {minutesTrained} minutes
              </ThemedText>
            </View>
          </View>
        </Card>

        <Card style={styles.formCard}>
          <ThemedText style={styles.inputLabel}>
            Plan to Train: {plannedMuscle}
          </ThemedText>

          <View style={styles.muscleButtons}>
            {MUSCLE_GROUPS.map((muscle: string) => (
              <Pressable
                key={muscle}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPlannedMuscle(muscle);
                }}
                style={[
                  styles.muscleButton,
                  plannedMuscle === muscle && styles.muscleButtonSelected,
                ]}
              >
                <ThemedText
                  style={[
                    styles.muscleButtonText,
                    plannedMuscle === muscle && styles.muscleButtonTextSelected,
                  ]}
                >
                  {muscle}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>

        <Pressable
          onPress={handleGetAdvice}
          disabled={isLoading}
          style={styles.submitButton}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <ThemedText style={styles.submitButtonText}>
              Get Recovery Advice
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
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statsTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  statValue: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
  statDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: Spacing.md,
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
  muscleButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  muscleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  muscleButtonSelected: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  muscleButtonText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  muscleButtonTextSelected: {
    color: "#FFF",
    fontWeight: "600",
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
  recommendationCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  recommendationText: {
    ...Typography.h2,
    fontWeight: "700",
  },
  reasoningCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  reasoningTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  reasoningText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  alternativesCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  alternativesTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  alternativeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  alternativeText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    flex: 1,
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
