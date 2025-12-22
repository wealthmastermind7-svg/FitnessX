import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  TextInput,
  Alert,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface WorkoutLogExercise {
  id: string;
  name: string;
  sets: Array<{
    reps: number;
    weight: number;
    completed: boolean;
  }>;
}

interface WorkoutLog {
  id: string;
  date: string;
  name: string;
  duration: number;
  exercises: WorkoutLogExercise[];
  notes?: string;
  completed: boolean;
}

const STORAGE_KEY = "@fitforge_workout_logs";

export default function WorkoutDiaryScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutLog | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLogs(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading workout logs:", error);
    }
  };

  const saveLogs = async (newLogs: WorkoutLog[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newLogs));
      setLogs(newLogs);
    } catch (error) {
      console.error("Error saving workout logs:", error);
    }
  };

  const startNewWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newWorkout: WorkoutLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      name: "New Workout",
      duration: 0,
      exercises: [],
      completed: false,
    };
    setCurrentWorkout(newWorkout);
    setShowAddModal(true);
  };

  const addExerciseToWorkout = () => {
    if (!currentWorkout) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newExercise: WorkoutLogExercise = {
      id: Date.now().toString(),
      name: "",
      sets: [{ reps: 0, weight: 0, completed: false }],
    };
    setCurrentWorkout({
      ...currentWorkout,
      exercises: [...currentWorkout.exercises, newExercise],
    });
  };

  const updateExerciseName = (exerciseId: string, name: string) => {
    if (!currentWorkout) return;
    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, name } : ex
      ),
    });
  };

  const addSetToExercise = (exerciseId: string) => {
    if (!currentWorkout) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0, completed: false }] }
          : ex
      ),
    });
  };

  const updateSet = (
    exerciseId: string,
    setIndex: number,
    field: "reps" | "weight",
    value: number
  ) => {
    if (!currentWorkout) return;
    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIndex ? { ...s, [field]: value } : s
              ),
            }
          : ex
      ),
    });
  };

  const toggleSetComplete = (exerciseId: string, setIndex: number) => {
    if (!currentWorkout) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentWorkout({
      ...currentWorkout,
      exercises: currentWorkout.exercises.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s, i) =>
                i === setIndex ? { ...s, completed: !s.completed } : s
              ),
            }
          : ex
      ),
    });
  };

  const saveWorkout = () => {
    if (!currentWorkout) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const completedWorkout = {
      ...currentWorkout,
      completed: true,
      duration: 45,
    };
    const newLogs = [completedWorkout, ...logs];
    saveLogs(newLogs);
    setCurrentWorkout(null);
    setShowAddModal(false);
  };

  const deleteLog = (logId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete Workout", "Are you sure you want to delete this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const newLogs = logs.filter((l) => l.id !== logId);
          saveLogs(newLogs);
        },
      },
    ]);
  };

  const getCalendarDays = () => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    const startPadding = firstDay.getDay();
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }
    
    return days;
  };

  const getWorkoutForDay = (day: number | null) => {
    if (!day) return null;
    const dateStr = new Date(
      selectedMonth.getFullYear(),
      selectedMonth.getMonth(),
      day
    ).toDateString();
    return logs.find((l) => new Date(l.date).toDateString() === dateStr);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const renderWorkoutLogItem = ({ item }: { item: WorkoutLog }) => (
    <Pressable
      style={styles.logCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      onLongPress={() => deleteLog(item.id)}
    >
      <View style={styles.logHeader}>
        <View>
          <ThemedText style={styles.logName}>{item.name}</ThemedText>
          <ThemedText style={styles.logDate}>{formatDate(item.date)}</ThemedText>
        </View>
        <View style={styles.logStats}>
          <View style={styles.logStat}>
            <Feather name="clock" size={14} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.logStatText}>{item.duration} min</ThemedText>
          </View>
          <View style={styles.logStat}>
            <Feather name="activity" size={14} color={Colors.dark.accent} />
            <ThemedText style={styles.logStatText}>
              {item.exercises.length} exercises
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.logExercises}>
        {item.exercises.slice(0, 4).map((ex, idx) => (
          <View key={idx} style={styles.logExerciseItem}>
            <ThemedText style={styles.logExerciseName}>{ex.name}</ThemedText>
            <ThemedText style={styles.logExerciseSets}>
              {ex.sets.length} x {ex.sets[0]?.reps || 0}
            </ThemedText>
          </View>
        ))}
        {item.exercises.length > 4 && (
          <ThemedText style={styles.moreExercises}>
            +{item.exercises.length - 4} more
          </ThemedText>
        )}
      </View>
    </Pressable>
  );

  if (showAddModal && currentWorkout) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.modalHeader, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(false);
              setCurrentWorkout(null);
            }}
          >
            <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.modalTitle}>Log Workout</ThemedText>
          <Pressable onPress={saveWorkout}>
            <ThemedText style={styles.saveButton}>Save</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        >
          <TextInput
            style={styles.workoutNameInput}
            value={currentWorkout.name}
            onChangeText={(text) =>
              setCurrentWorkout({ ...currentWorkout, name: text })
            }
            placeholder="Workout Name"
            placeholderTextColor={Colors.dark.textSecondary}
          />

          {currentWorkout.exercises.map((exercise, exIdx) => (
            <View key={exercise.id} style={styles.exerciseBlock}>
              <TextInput
                style={styles.exerciseNameInput}
                value={exercise.name}
                onChangeText={(text) => updateExerciseName(exercise.id, text)}
                placeholder="Exercise Name"
                placeholderTextColor={Colors.dark.textSecondary}
              />
              <View style={styles.setsHeader}>
                <ThemedText style={styles.setHeaderText}>Set</ThemedText>
                <ThemedText style={styles.setHeaderText}>Weight</ThemedText>
                <ThemedText style={styles.setHeaderText}>Reps</ThemedText>
                <View style={{ width: 40 }} />
              </View>
              {exercise.sets.map((set, setIdx) => (
                <View key={setIdx} style={styles.setRow}>
                  <ThemedText style={styles.setNumber}>{setIdx + 1}</ThemedText>
                  <TextInput
                    style={styles.setInput}
                    value={set.weight > 0 ? set.weight.toString() : ""}
                    onChangeText={(text) =>
                      updateSet(exercise.id, setIdx, "weight", parseInt(text) || 0)
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                  />
                  <TextInput
                    style={styles.setInput}
                    value={set.reps > 0 ? set.reps.toString() : ""}
                    onChangeText={(text) =>
                      updateSet(exercise.id, setIdx, "reps", parseInt(text) || 0)
                    }
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                  />
                  <Pressable
                    style={[
                      styles.checkButton,
                      set.completed && styles.checkButtonActive,
                    ]}
                    onPress={() => toggleSetComplete(exercise.id, setIdx)}
                  >
                    <Feather
                      name="check"
                      size={18}
                      color={set.completed ? "#fff" : Colors.dark.textSecondary}
                    />
                  </Pressable>
                </View>
              ))}
              <Pressable
                style={styles.addSetButton}
                onPress={() => addSetToExercise(exercise.id)}
              >
                <Feather name="plus" size={16} color={Colors.dark.accent} />
                <ThemedText style={styles.addSetText}>Add Set</ThemedText>
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.addExerciseButton} onPress={addExerciseToWorkout}>
            <LinearGradient
              colors={[Colors.dark.accent, "#E55A5A"]}
              style={styles.addExerciseGradient}
            >
              <Feather name="plus" size={20} color="#fff" />
              <ThemedText style={styles.addExerciseText}>Add Exercise</ThemedText>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Workout Diary</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      >
        <View style={styles.calendarSection}>
          <View style={styles.monthNav}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMonth(
                  new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1)
                );
              }}
            >
              <Feather name="chevron-left" size={24} color={Colors.dark.text} />
            </Pressable>
            <ThemedText style={styles.monthTitle}>
              {selectedMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedMonth(
                  new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1)
                );
              }}
            >
              <Feather name="chevron-right" size={24} color={Colors.dark.text} />
            </Pressable>
          </View>

          <View style={styles.weekDays}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <ThemedText key={day} style={styles.weekDay}>
                {day}
              </ThemedText>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {getCalendarDays().map((day, idx) => {
              const workout = getWorkoutForDay(day);
              return (
                <View key={idx} style={styles.calendarDay}>
                  {day !== null ? (
                    <>
                      <ThemedText
                        style={[
                          styles.dayNumber,
                          workout && styles.dayNumberActive,
                        ]}
                      >
                        {day}
                      </ThemedText>
                      {workout && (
                        <View style={styles.workoutIndicator}>
                          <View
                            style={[
                              styles.completionDot,
                              { backgroundColor: Colors.dark.success },
                            ]}
                          />
                        </View>
                      )}
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.historySection}>
          <ThemedText style={styles.sectionTitle}>Recent Workouts</ThemedText>
          {logs.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="edit-3" size={48} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.emptyText}>
                No workouts logged yet
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Start your first workout to track your progress
              </ThemedText>
            </View>
          ) : (
            logs.slice(0, 10).map((log) => (
              <View key={log.id}>{renderWorkoutLogItem({ item: log })}</View>
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        onPress={startNewWorkout}
      >
        <LinearGradient
          colors={[Colors.dark.accent, "#E55A5A"]}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
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
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  calendarSection: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  monthTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  weekDays: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.sm,
  },
  weekDay: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    width: 40,
    textAlign: "center",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarDay: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dayNumber: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  dayNumberActive: {
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  workoutIndicator: {
    position: "absolute",
    bottom: 4,
  },
  completionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  historySection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
  },
  logCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  logName: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  logDate: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  logStats: {
    alignItems: "flex-end",
  },
  logStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  logStatText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  logExercises: {
    marginTop: Spacing.sm,
  },
  logExerciseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  logExerciseName: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  logExerciseSets: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  moreExercises: {
    ...Typography.small,
    color: Colors.dark.accent,
    marginTop: Spacing.xs,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    borderRadius: 28,
    overflow: "hidden",
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  cancelButton: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    ...Typography.body,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  workoutNameInput: {
    ...Typography.h2,
    color: Colors.dark.text,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  exerciseBlock: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  exerciseNameInput: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  setsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  setHeaderText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    flex: 1,
    textAlign: "center",
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  setNumber: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    width: 40,
    textAlign: "center",
  },
  setInput: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
    color: Colors.dark.text,
    textAlign: "center",
    ...Typography.body,
  },
  checkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkButtonActive: {
    backgroundColor: Colors.dark.success,
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  addSetText: {
    ...Typography.body,
    color: Colors.dark.accent,
  },
  addExerciseButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginTop: Spacing.md,
  },
  addExerciseGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  addExerciseText: {
    ...Typography.body,
    color: "#fff",
    fontWeight: "600",
  },
});
