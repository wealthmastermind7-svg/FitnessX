import React, { useState } from "react";
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
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface ProgramWeek {
  week: number;
  focus: string;
  sessions: Array<{
    day: string;
    exercises: Array<{
      name: string;
      sets: number;
      reps: string;
      rest: string;
    }>;
  }>;
}

interface TrainingProgram {
  weeks: ProgramWeek[];
}

export default function TrainingProgramScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { program } = route.params as { program: TrainingProgram };

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
        <ThemedText style={styles.headerTitle}>Your 8-Week Program</ThemedText>
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
          Follow this progressive plan week by week. Each week builds on the last with smart progression.
        </ThemedText>

        {program.weeks.map((week) => (
          <Card key={week.week} style={styles.weekCard}>
            <View style={styles.weekHeader}>
              <View>
                <ThemedText style={styles.weekNumber}>
                  Week {week.week}
                </ThemedText>
                <ThemedText style={styles.weekFocus}>{week.focus}</ThemedText>
              </View>
            </View>

            {week.sessions.map((session, idx) => (
              <View key={idx} style={styles.sessionContainer}>
                <ThemedText style={styles.sessionDay}>{session.day}</ThemedText>
                {session.exercises.map((exercise, exIdx) => (
                  <View key={exIdx} style={styles.exerciseRow}>
                    <View style={styles.exerciseInfo}>
                      <ThemedText style={styles.exerciseName}>
                        {exercise.name}
                      </ThemedText>
                      <ThemedText style={styles.exerciseDetails}>
                        {exercise.sets}x {exercise.reps} • Rest: {exercise.rest}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </Card>
        ))}

        <ThemedText style={styles.tipsTitle}>Tips for Success</ThemedText>
        <Card style={styles.tipCard}>
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.tipText}>
              Track your lifts and aim to progress each week
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.tipText}>
              Rest is important — don't skip recovery days
            </ThemedText>
          </View>
          <View style={styles.tipItem}>
            <Feather name="check-circle" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.tipText}>
              Adjust volume if you feel overtrained
            </ThemedText>
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
    paddingTop: Spacing.xl,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
  },
  weekCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  weekNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.accent,
    marginBottom: Spacing.xs,
  },
  weekFocus: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  sessionContainer: {
    marginBottom: Spacing.lg,
  },
  sessionDay: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  exerciseDetails: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
    marginTop: Spacing.xl,
  },
  tipCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  tipText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.md,
    flex: 1,
  },
});
