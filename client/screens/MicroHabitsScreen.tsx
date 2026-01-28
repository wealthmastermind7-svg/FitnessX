import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  Image,
  ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

const HABIT_IMAGES: { [key: string]: ImageSourcePropType } = {
  "1": require("../../assets/images/microhabits/calf-raises.png"),
  "2": require("../../assets/images/microhabits/leg-raises.png"),
  "3": require("../../assets/images/microhabits/squats-desk.png"),
  "4": require("../../assets/images/microhabits/flutter-kicks.png"),
  "5": require("../../assets/images/microhabits/tricep-dips.png"),
  "6": require("../../assets/images/microhabits/overhead-punches.png"),
  "7": require("../../assets/images/microhabits/calf-raises.png"),
  "8": require("../../assets/images/microhabits/half-jacks.png"),
  "9": require("../../assets/images/microhabits/lunges.png"),
  "10": require("../../assets/images/microhabits/single-leg-balance.png"),
  "11": require("../../assets/images/microhabits/doorframe-stretch.png"),
  "12": require("../../assets/images/microhabits/elbow-plank.png"),
};

interface MicroHabit {
  id: string;
  trigger: string;
  exercise: string;
  reps: string;
  duration: string;
  category: "morning" | "work" | "evening" | "anytime";
  icon: keyof typeof Feather.glyphMap;
  enabled: boolean;
  completedToday: boolean;
  streak: number;
}

const DEFAULT_MICRO_HABITS: MicroHabit[] = [
  {
    id: "1",
    trigger: "Waiting for coffee to brew",
    exercise: "Calf Raises + Posture Reset",
    reps: "20 reps",
    duration: "60 sec",
    category: "morning",
    icon: "coffee",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "2",
    trigger: "Returning to your desk",
    exercise: "Side Leg Raises",
    reps: "20 each side",
    duration: "90 sec",
    category: "work",
    icon: "monitor",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "3",
    trigger: "Every hour at work",
    exercise: "Stand Up Squats",
    reps: "10 reps",
    duration: "30 sec",
    category: "work",
    icon: "clock",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "4",
    trigger: "While watching TV",
    exercise: "Leg Raises or Flutter Kicks",
    reps: "20 reps",
    duration: "60 sec",
    category: "evening",
    icon: "tv",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "5",
    trigger: "During game loading screens",
    exercise: "Tricep Dips",
    reps: "10 reps",
    duration: "45 sec",
    category: "evening",
    icon: "play",
    enabled: false,
    completedToday: false,
    streak: 0,
  },
  {
    id: "6",
    trigger: "During commercials or ads",
    exercise: "Overhead Punches",
    reps: "40 reps",
    duration: "60 sec",
    category: "anytime",
    icon: "zap",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "7",
    trigger: "Waiting for food to heat up",
    exercise: "Calf Raises",
    reps: "10 reps",
    duration: "30 sec",
    category: "anytime",
    icon: "thermometer",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "8",
    trigger: "While kettle boils",
    exercise: "Half-Jacks",
    reps: "10 reps",
    duration: "30 sec",
    category: "morning",
    icon: "droplet",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "9",
    trigger: "Every time you make coffee",
    exercise: "Side-to-Side Lunges",
    reps: "10 reps",
    duration: "45 sec",
    category: "morning",
    icon: "coffee",
    enabled: false,
    completedToday: false,
    streak: 0,
  },
  {
    id: "10",
    trigger: "Waiting for someone",
    exercise: "Single Leg Balance",
    reps: "30 sec each",
    duration: "60 sec",
    category: "anytime",
    icon: "users",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "11",
    trigger: "Passing through a doorway",
    exercise: "Doorframe Stretch",
    reps: "5 sec hold",
    duration: "15 sec",
    category: "anytime",
    icon: "maximize-2",
    enabled: true,
    completedToday: false,
    streak: 0,
  },
  {
    id: "12",
    trigger: "While browsing phone",
    exercise: "Elbow Plank Hold",
    reps: "30 sec",
    duration: "30 sec",
    category: "evening",
    icon: "smartphone",
    enabled: false,
    completedToday: false,
    streak: 0,
  },
];

const CATEGORY_COLORS = {
  morning: "#FFB347",
  work: "#87CEEB",
  evening: "#9D4EDD",
  anytime: "#FF6B6B",
};

const CATEGORY_LABELS = {
  morning: "Morning",
  work: "Work",
  evening: "Evening",
  anytime: "Anytime",
};

export default function MicroHabitsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [habits, setHabits] = useState<MicroHabit[]>(DEFAULT_MICRO_HABITS);
  const [selectedHabit, setSelectedHabit] = useState<MicroHabit | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    loadHabits();
  }, []);

  useEffect(() => {
    const count = habits.filter(h => h.completedToday && h.enabled).length;
    setCompletedCount(count);
  }, [habits]);

  const loadHabits = async () => {
    try {
      const saved = await AsyncStorage.getItem("microHabits");
      if (saved) {
        setHabits(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading micro habits:", error);
    }
  };

  const saveHabits = async (updatedHabits: MicroHabit[]) => {
    try {
      await AsyncStorage.setItem("microHabits", JSON.stringify(updatedHabits));
      setHabits(updatedHabits);
    } catch (error) {
      console.error("Error saving micro habits:", error);
    }
  };

  const toggleHabit = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = habits.map(h =>
      h.id === id ? { ...h, enabled: !h.enabled } : h
    );
    saveHabits(updated);
  };

  const completeHabit = (habit: MicroHabit) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updated = habits.map(h =>
      h.id === habit.id
        ? { ...h, completedToday: true, streak: h.streak + 1 }
        : h
    );
    saveHabits(updated);
    setIsModalVisible(false);
    setSelectedHabit(null);
  };

  const openHabitModal = (habit: MicroHabit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedHabit(habit);
    setIsModalVisible(true);
  };

  const enabledHabits = habits.filter(h => h.enabled);
  const totalEnabled = enabledHabits.length;

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: Spacing.xl + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.screenTagline}>MICRO-HABIT</ThemedText>
        <ThemedText style={styles.screenTitle}>Autopilot</ThemedText>
        <ThemedText style={styles.screenSubtitle}>
          Fitness that fits into your life. Quick movements triggered by everyday moments.
        </ThemedText>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{completedCount}/{totalEnabled}</ThemedText>
            <ThemedText style={styles.statLabel}>Today</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{totalEnabled}</ThemedText>
            <ThemedText style={styles.statLabel}>Active Triggers</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>
              {habits.reduce((max, h) => Math.max(max, h.streak), 0)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Best Streak</ThemedText>
          </View>
        </View>

        {(["morning", "work", "evening", "anytime"] as const).map(category => {
          const categoryHabits = habits.filter(h => h.category === category);
          if (categoryHabits.length === 0) return null;

          return (
            <View key={category} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[category] + "20" }]}>
                  <ThemedText style={[styles.categoryBadgeText, { color: CATEGORY_COLORS[category] }]}>
                    {CATEGORY_LABELS[category]}
                  </ThemedText>
                </View>
              </View>

              {categoryHabits.map(habit => (
                <Pressable
                  key={habit.id}
                  onPress={() => openHabitModal(habit)}
                  style={({ pressed }) => [
                    styles.habitCard,
                    !habit.enabled && styles.habitCardDisabled,
                    habit.completedToday && styles.habitCardCompleted,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <View style={styles.habitLeft}>
                    <View style={[
                      styles.habitImageContainer,
                      { borderColor: CATEGORY_COLORS[habit.category] + "40" }
                    ]}>
                      <Image
                        source={HABIT_IMAGES[habit.id]}
                        style={styles.habitImage}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={styles.habitInfo}>
                      <ThemedText style={styles.habitTrigger}>{habit.trigger}</ThemedText>
                      <ThemedText style={styles.habitExercise}>{habit.exercise}</ThemedText>
                      <View style={styles.habitMeta}>
                        <ThemedText style={styles.habitReps}>{habit.reps}</ThemedText>
                        <View style={styles.habitDot} />
                        <ThemedText style={styles.habitDuration}>{habit.duration}</ThemedText>
                        {habit.streak > 0 && (
                          <>
                            <View style={styles.habitDot} />
                            <Feather name="zap" size={12} color="#FF6B6B" />
                            <ThemedText style={styles.habitStreak}>{habit.streak}</ThemedText>
                          </>
                        )}
                      </View>
                    </View>
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleHabit(habit.id);
                    }}
                    style={styles.toggleButton}
                  >
                    <View style={[
                      styles.toggle,
                      habit.enabled && styles.toggleActive,
                    ]}>
                      <View style={[
                        styles.toggleKnob,
                        habit.enabled && styles.toggleKnobActive,
                      ]} />
                    </View>
                  </Pressable>
                </Pressable>
              ))}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedHabit && (
                  <>
                    <View style={[
                      styles.modalImageContainer,
                      { borderColor: CATEGORY_COLORS[selectedHabit.category] + "40" }
                    ]}>
                      <Image
                        source={HABIT_IMAGES[selectedHabit.id]}
                        style={styles.modalImage}
                        resizeMode="cover"
                      />
                    </View>
                    
                    <ThemedText style={styles.modalTrigger}>
                      {selectedHabit.trigger}
                    </ThemedText>
                    
                    <ThemedText style={styles.modalExercise}>
                      {selectedHabit.exercise}
                    </ThemedText>
                    
                    <View style={styles.modalStats}>
                      <View style={styles.modalStatItem}>
                        <ThemedText style={styles.modalStatValue}>{selectedHabit.reps}</ThemedText>
                        <ThemedText style={styles.modalStatLabel}>Reps</ThemedText>
                      </View>
                      <View style={styles.modalStatItem}>
                        <ThemedText style={styles.modalStatValue}>{selectedHabit.duration}</ThemedText>
                        <ThemedText style={styles.modalStatLabel}>Duration</ThemedText>
                      </View>
                    </View>

                    {selectedHabit.completedToday ? (
                      <View style={styles.completedBadge}>
                        <Feather name="check-circle" size={20} color="#4CAF50" />
                        <ThemedText style={styles.completedText}>Completed Today</ThemedText>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.completeButton}
                        onPress={() => completeHabit(selectedHabit)}
                      >
                        <LinearGradient
                          colors={["#FF6B6B", "#FF4B4B"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.completeButtonGradient}
                        >
                          <Feather name="check" size={20} color="#FFF" />
                          <ThemedText style={styles.completeButtonText}>
                            Mark Complete
                          </ThemedText>
                        </LinearGradient>
                      </Pressable>
                    )}

                    <Pressable
                      style={styles.skipButton}
                      onPress={() => setIsModalVisible(false)}
                    >
                      <ThemedText style={styles.skipButtonText}>
                        Skip for now
                      </ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  screenTagline: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: "#FF6B6B",
    marginBottom: Spacing.xs,
  },
  screenTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    lineHeight: 48,
  },
  screenSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.dark.border,
    marginHorizontal: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  habitCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  habitCardDisabled: {
    opacity: 0.5,
  },
  habitCardCompleted: {
    borderColor: "rgba(76, 175, 80, 0.3)",
    backgroundColor: "rgba(76, 175, 80, 0.05)",
  },
  habitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  habitImageContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginRight: Spacing.md,
    borderWidth: 2,
    backgroundColor: "#FFF",
  },
  habitImage: {
    width: "100%",
    height: "100%",
  },
  habitInfo: {
    flex: 1,
  },
  habitTrigger: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 2,
  },
  habitExercise: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  habitMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  habitReps: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  habitDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.dark.textSecondary,
    marginHorizontal: 6,
  },
  habitDuration: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  habitStreak: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF6B6B",
    marginLeft: 2,
  },
  toggleButton: {
    padding: Spacing.sm,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#FF6B6B",
  },
  toggleKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  toggleKnobActive: {
    backgroundColor: "#FFF",
    alignSelf: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: "100%",
    alignItems: "center",
  },
  modalImageContainer: {
    width: 160,
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    borderWidth: 3,
    backgroundColor: "#FFF",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalTrigger: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  modalExercise: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  modalStats: {
    flexDirection: "row",
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  modalStatItem: {
    alignItems: "center",
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  modalStatLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  completedText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4CAF50",
  },
  completeButton: {
    width: "100%",
    marginBottom: Spacing.md,
  },
  completeButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
  skipButton: {
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: 14,
    color: "#666",
  },
});
