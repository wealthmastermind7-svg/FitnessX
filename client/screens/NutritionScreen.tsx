import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { api } from "@/lib/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface DayLog {
  date: string;
  meals: Meal[];
}

const STORAGE_KEY = "@fitforge_nutrition";
const GOALS_KEY = "@fitforge_macro_goals";

const DEFAULT_GOALS: MacroGoals = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fats: 65,
};

interface NutritionData {
  name: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function NutritionScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<MacroGoals>(DEFAULT_GOALS);
  const [todayMeals, setTodayMeals] = useState<Meal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [newMeal, setNewMeal] = useState<Partial<Meal>>({});
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [mealSuggestions, setMealSuggestions] = useState<NutritionData[]>([]);

  const { data: suggestions = [] } = useQuery({
    queryKey: ["/api/nutrition/suggestions"],
    queryFn: async () => {
      try {
        const data = await api.nutrition.suggestions();
        return data.map(item => ({
          name: item.name,
          quantity: 100,
          unit: "g",
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fats: item.fats,
        })) as NutritionData[];
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (suggestions.length > 0) {
      setMealSuggestions(suggestions);
    }
    loadData();
  }, [suggestions]);

  const loadData = async () => {
    try {
      const storedGoals = await AsyncStorage.getItem(GOALS_KEY);
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      }

      const storedNutrition = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedNutrition) {
        const logs: DayLog[] = JSON.parse(storedNutrition);
        const today = new Date().toDateString();
        const todayLog = logs.find((l) => l.date === today);
        if (todayLog) {
          setTodayMeals(todayLog.meals);
        }
      }
    } catch (error) {
      console.error("Error loading nutrition data:", error);
    }
  };

  const saveMeals = async (meals: Meal[]) => {
    try {
      const storedNutrition = await AsyncStorage.getItem(STORAGE_KEY);
      let logs: DayLog[] = storedNutrition ? JSON.parse(storedNutrition) : [];
      const today = new Date().toDateString();
      const existingIndex = logs.findIndex((l) => l.date === today);

      if (existingIndex >= 0) {
        logs[existingIndex].meals = meals;
      } else {
        logs = [{ date: today, meals }, ...logs];
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      setTodayMeals(meals);
    } catch (error) {
      console.error("Error saving meals:", error);
    }
  };

  const saveGoals = async (newGoals: MacroGoals) => {
    try {
      await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(newGoals));
      setGoals(newGoals);
      setShowGoalsModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error saving goals:", error);
    }
  };

  const analyzeMealMutation = useMutation({
    mutationFn: async (meal: Partial<Meal>) => {
      if (!meal.name || !meal.calories) throw new Error("Missing meal data");
      return api.nutrition.analyze(meal.name);
    },
    onSuccess: (data, meal) => {
      const newMealFull: Meal = {
        id: Date.now().toString(),
        name: meal.name || "Unknown",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        calories: data.calories || meal.calories || 0,
        protein: data.protein || meal.protein || 0,
        carbs: data.carbs || meal.carbs || 0,
        fats: data.fats || meal.fats || 0,
      };
      const newMeals = [...todayMeals, newMealFull];
      saveMeals(newMeals);
      setNewMeal({});
      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const addMeal = (meal: Partial<Meal>) => {
    if (!meal.name || !meal.calories) return;
    analyzeMealMutation.mutate(meal);
  };

  const deleteMeal = (mealId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newMeals = todayMeals.filter((m) => m.id !== mealId);
    saveMeals(newMeals);
  };

  const totals = todayMeals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i);
      days.push(date);
    }
    return days;
  };

  const MacroCircle = ({
    label,
    current,
    goal,
    color,
    unit,
  }: {
    label: string;
    current: number;
    goal: number;
    color: string;
    unit: string;
  }) => {
    const progress = Math.min(current / goal, 1);
    return (
      <View style={styles.macroCircle}>
        <View style={styles.circleContainer}>
          <View style={[styles.circleProgress, { borderColor: color + "30" }]}>
            <View
              style={[
                styles.circleProgressFill,
                {
                  borderColor: color,
                  borderTopColor: progress > 0.25 ? color : "transparent",
                  borderRightColor: progress > 0.5 ? color : "transparent",
                  borderBottomColor: progress > 0.75 ? color : "transparent",
                  transform: [{ rotate: `${progress * 360}deg` }],
                },
              ]}
            />
            <ThemedText style={styles.circleValue}>{Math.round(current)}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.macroLabel}>{label}</ThemedText>
      </View>
    );
  };

  if (showGoalsModal) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowGoalsModal(false);
            }}
          >
            <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Set Goals</ThemedText>
          <Pressable onPress={() => saveGoals(goals)}>
            <ThemedText style={styles.saveButton}>Save</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        >
          {[
            { key: "calories", label: "Daily Calories", unit: "kcal" },
            { key: "protein", label: "Protein", unit: "g" },
            { key: "carbs", label: "Carbohydrates", unit: "g" },
            { key: "fats", label: "Fats", unit: "g" },
          ].map((item) => (
            <View key={item.key} style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>
                {item.label} ({item.unit})
              </ThemedText>
              <TextInput
                style={styles.input}
                value={goals[item.key as keyof MacroGoals].toString()}
                onChangeText={(text) =>
                  setGoals({ ...goals, [item.key]: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
          ))}

          <View style={styles.presetSection}>
            <ThemedText style={styles.sectionLabel}>Quick Presets</ThemedText>
            {[
              { name: "Weight Loss", calories: 1600, protein: 140, carbs: 120, fats: 55 },
              { name: "Maintenance", calories: 2000, protein: 150, carbs: 200, fats: 65 },
              { name: "Muscle Gain", calories: 2500, protein: 180, carbs: 280, fats: 75 },
            ].map((preset) => (
              <Pressable
                key={preset.name}
                style={styles.presetCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGoals(preset);
                }}
              >
                <ThemedText style={styles.presetName}>{preset.name}</ThemedText>
                <ThemedText style={styles.presetDetails}>
                  {preset.calories} kcal | P: {preset.protein}g | C: {preset.carbs}g | F: {preset.fats}g
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  if (showAddModal) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(false);
              setNewMeal({});
            }}
          >
            <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Add Meal</ThemedText>
          <Pressable onPress={() => addMeal(newMeal)}>
            <ThemedText style={styles.saveButton}>Add</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        >
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Meal Name</ThemedText>
            <TextInput
              style={styles.input}
              value={newMeal.name || ""}
              onChangeText={(text) => setNewMeal({ ...newMeal, name: text })}
              placeholder="Enter meal name"
              placeholderTextColor={Colors.dark.textSecondary}
            />
          </View>

          <View style={styles.macroInputRow}>
            <View style={styles.macroInput}>
              <ThemedText style={styles.inputLabel}>Calories</ThemedText>
              <TextInput
                style={styles.input}
                value={newMeal.calories?.toString() || ""}
                onChangeText={(text) =>
                  setNewMeal({ ...newMeal, calories: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
            <View style={styles.macroInput}>
              <ThemedText style={styles.inputLabel}>Protein (g)</ThemedText>
              <TextInput
                style={styles.input}
                value={newMeal.protein?.toString() || ""}
                onChangeText={(text) =>
                  setNewMeal({ ...newMeal, protein: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
          </View>

          <View style={styles.macroInputRow}>
            <View style={styles.macroInput}>
              <ThemedText style={styles.inputLabel}>Carbs (g)</ThemedText>
              <TextInput
                style={styles.input}
                value={newMeal.carbs?.toString() || ""}
                onChangeText={(text) =>
                  setNewMeal({ ...newMeal, carbs: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
            <View style={styles.macroInput}>
              <ThemedText style={styles.inputLabel}>Fats (g)</ThemedText>
              <TextInput
                style={styles.input}
                value={newMeal.fats?.toString() || ""}
                onChangeText={(text) =>
                  setNewMeal({ ...newMeal, fats: parseInt(text) || 0 })
                }
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
          </View>

          <ThemedText style={styles.sectionLabel}>Quick Add</ThemedText>
          <View style={styles.suggestionsGrid}>
            {(mealSuggestions.length > 0 ? mealSuggestions : [
              { name: "Chicken Breast", calories: 280, protein: 42, carbs: 0, fats: 12, quantity: 200, unit: "g" },
              { name: "Brown Rice", calories: 420, protein: 15, carbs: 72, fats: 10, quantity: 150, unit: "g" },
              { name: "Salmon", calories: 450, protein: 38, carbs: 0, fats: 28, quantity: 200, unit: "g" },
              { name: "Sweet Potato", calories: 150, protein: 3, carbs: 34, fats: 0, quantity: 200, unit: "g" },
              { name: "Eggs", calories: 155, protein: 13, carbs: 1, fats: 11, quantity: 100, unit: "g" },
              { name: "Oats", calories: 380, protein: 14, carbs: 67, fats: 8, quantity: 100, unit: "g" },
            ]).map((suggestion, idx) => (
              <Pressable
                key={idx}
                style={styles.suggestionCard}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  addMeal({
                    name: suggestion.name,
                    calories: suggestion.calories,
                    protein: suggestion.protein,
                    carbs: suggestion.carbs,
                    fats: suggestion.fats,
                  });
                }}
              >
                <ThemedText style={styles.suggestionName}>{suggestion.name}</ThemedText>
                <ThemedText style={styles.suggestionCalories}>
                  {suggestion.calories} kcal
                </ThemedText>
              </Pressable>
            ))}
          </View>
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
        <ThemedText style={styles.headerTitle}>Nutrition</ThemedText>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowGoalsModal(true);
          }}
        >
          <Feather name="settings" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      >
        <View style={styles.weekSelector}>
          {getWeekDays().map((date) => {
            const isSelected = date.toDateString() === selectedDay.toDateString();
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <Pressable
                key={date.toISOString()}
                style={[styles.dayPill, isSelected && styles.dayPillSelected]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedDay(date);
                }}
              >
                <ThemedText style={styles.dayName}>
                  {date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 3)}
                </ThemedText>
                <ThemedText
                  style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}
                >
                  {date.getDate()}
                </ThemedText>
                {isToday && <View style={styles.todayDot} />}
              </Pressable>
            );
          })}
        </View>

        <View style={styles.dailyIntake}>
          <View style={styles.dailyIntakeHeader}>
            <ThemedText style={styles.sectionTitle}>Your daily intake</ThemedText>
            <Pressable>
              <Feather name="info" size={18} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.macrosRow}>
            <MacroCircle
              label="Protein"
              current={totals.protein}
              goal={goals.protein}
              color="#FF6B6B"
              unit="g"
            />
            <MacroCircle
              label="Fats"
              current={totals.fats}
              goal={goals.fats}
              color="#4ECDC4"
              unit="g"
            />
            <MacroCircle
              label="Carbs"
              current={totals.carbs}
              goal={goals.carbs}
              color="#FFB347"
              unit="g"
            />
            <MacroCircle
              label="Kcal"
              current={totals.calories}
              goal={goals.calories}
              color="#9D4EDD"
              unit=""
            />
          </View>
        </View>

        <View style={styles.mealsSection}>
          <ThemedText style={styles.sectionTitle}>Today's Meals</ThemedText>
          {todayMeals.length === 0 ? (
            <View style={styles.emptyMeals}>
              <Feather name="coffee" size={48} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.emptyText}>No meals logged today</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Tap the + button to add your first meal
              </ThemedText>
            </View>
          ) : (
            todayMeals.map((meal) => (
              <Pressable
                key={meal.id}
                style={styles.mealCard}
                onLongPress={() => deleteMeal(meal.id)}
              >
                <View style={styles.mealHeader}>
                  <View>
                    <ThemedText style={styles.mealName}>{meal.name}</ThemedText>
                    <ThemedText style={styles.mealTime}>{meal.time}</ThemedText>
                  </View>
                  <ThemedText style={styles.mealCalories}>{meal.calories} kcal</ThemedText>
                </View>
                <View style={styles.mealMacros}>
                  <View style={styles.mealMacro}>
                    <View style={[styles.macroDot, { backgroundColor: "#FF6B6B" }]} />
                    <ThemedText style={styles.mealMacroText}>P: {meal.protein}g</ThemedText>
                  </View>
                  <View style={styles.mealMacro}>
                    <View style={[styles.macroDot, { backgroundColor: "#FFB347" }]} />
                    <ThemedText style={styles.mealMacroText}>C: {meal.carbs}g</ThemedText>
                  </View>
                  <View style={styles.mealMacro}>
                    <View style={[styles.macroDot, { backgroundColor: "#4ECDC4" }]} />
                    <ThemedText style={styles.mealMacroText}>F: {meal.fats}g</ThemedText>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddModal(true);
        }}
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
  cancelButton: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    ...Typography.body,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  weekSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  dayPill: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  dayPillSelected: {
    backgroundColor: Colors.dark.accent,
  },
  dayName: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  dayNumber: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.xs,
  },
  dayNumberSelected: {
    color: "#fff",
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.dark.accent,
    marginTop: Spacing.xs,
  },
  dailyIntake: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  dailyIntakeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  macroCircle: {
    alignItems: "center",
  },
  circleContainer: {
    width: 60,
    height: 60,
    marginBottom: Spacing.xs,
  },
  circleProgress: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  circleProgressFill: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
  },
  circleValue: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  macroLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  mealsSection: {
    marginTop: Spacing.xl,
  },
  emptyMeals: {
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
    marginTop: Spacing.xs,
  },
  mealCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mealName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  mealTime: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  mealCalories: {
    ...Typography.h3,
    color: Colors.dark.accent,
  },
  mealMacros: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  mealMacro: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  mealMacroText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.dark.text,
    ...Typography.body,
  },
  macroInputRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  macroInput: {
    flex: 1,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  suggestionCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2,
  },
  suggestionName: {
    ...Typography.body,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  suggestionCalories: {
    ...Typography.small,
    color: Colors.dark.accent,
  },
  presetSection: {
    marginTop: Spacing.lg,
  },
  presetCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  presetName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  presetDetails: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
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
});
