import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography, Gradients } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  gradient: [string, string];
  isPremium: boolean;
}

const AI_FEATURES: AIFeature[] = [
  {
    id: "chat",
    title: "AI Fitness Coach",
    description: "Get instant expert advice, workout tips, and form corrections",
    icon: "message-circle",
    gradient: ["#9D4EDD", "#5A189A"],
    isPremium: true,
  },
  {
    id: "workout-plan",
    title: "Generate Workout Plan",
    description: "Create a personalized multi-week training program",
    icon: "calendar",
    gradient: ["#9D4EDD", "#5A189A"],
    isPremium: true,
  },
  {
    id: "nutrition",
    title: "Nutrition Advice",
    description: "Get personalized nutrition recommendations for your goals",
    icon: "heart",
    gradient: ["#9D4EDD", "#5A189A"],
    isPremium: true,
  },
  {
    id: "food-analysis",
    title: "Analyze Food Plate",
    description: "Take a photo of your meal to get nutritional breakdown",
    icon: "camera",
    gradient: ["#9D4EDD", "#5A189A"],
    isPremium: true,
  },
];

export default function AIHubScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selectedGoal, setSelectedGoal] = useState<string>("Build muscle");
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [showWorkoutPlanModal, setShowWorkoutPlanModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [nutritionResult, setNutritionResult] = useState<any>(null);
  const [workoutPlanResult, setWorkoutPlanResult] = useState<any>(null);
  const [foodAnalysisResult, setFoodAnalysisResult] = useState<any>(null);
  const [showFoodResult, setShowFoodResult] = useState(false);
  const [showNutritionResult, setShowNutritionResult] = useState(false);
  const [showWorkoutResult, setShowWorkoutResult] = useState(false);
  const baseUrl = getApiUrl();

  const goals = ["Build muscle", "Lose fat", "Improve endurance", "General fitness", "Gain strength"];
  const dietaryRestrictions = ["None", "Vegetarian", "Vegan", "Gluten-free", "Dairy-free"];
  const [selectedDiet, setSelectedDiet] = useState("None");

  const handleFeaturePress = async (feature: AIFeature) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    switch (feature.id) {
      case "chat":
        navigation.navigate("AIChat");
        break;
      case "workout-plan":
        setShowWorkoutPlanModal(true);
        break;
      case "nutrition":
        setShowNutritionModal(true);
        break;
      case "food-analysis":
        handleFoodAnalysis();
        break;
    }
  };

  const handleFoodAnalysis = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access is required to analyze food plates");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setIsLoading(true);
      try {
        const base64 = result.assets[0].base64;
        if (!base64) {
          throw new Error("Failed to get image data");
        }

        console.log("[AIHub] Sending image to analysis...");
        const response = await fetch(`${baseUrl}api/ai/analyze-food`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("[AIHub] Analysis failed:", errorData);
          throw new Error(errorData.error || "Failed to analyze food");
        }

        const analysis = await response.json();
        console.log("[AIHub] Analysis received successfully");
        setFoodAnalysisResult(analysis);
        setShowFoodResult(true);
      } catch (error: any) {
        console.error("[AIHub] Analysis error:", error);
        Alert.alert("Error", error.message || "Failed to analyze food plate. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchNutritionAdvice = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}api/nutrition/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: selectedGoal,
          dietary_restrictions: [selectedDiet],
          health_conditions: ["None"],
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch nutrition advice");
      const data = await response.json();
      setNutritionResult(data);
      setShowNutritionModal(false);
      setShowNutritionResult(true);
    } catch (error) {
      Alert.alert("Error", "Failed to get nutrition advice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWorkoutPlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}api/ai/program`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weeks: 4,
          experience: "Intermediate",
          equipment: ["Dumbbells", "Barbell", "Machines"],
          targetMuscles: ["Chest", "Back", "Legs", "Shoulders", "Arms"],
          sessionsPerWeek: 4,
          sessionLength: 60,
          goal: selectedGoal,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate workout plan");
      const data = await response.json();
      setWorkoutPlanResult(data);
      setShowWorkoutPlanModal(false);
      setShowWorkoutResult(true);
    } catch (error) {
      Alert.alert("Error", "Failed to generate workout plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderFeatureCard = (feature: AIFeature) => (
    <Pressable
      key={feature.id}
      onPress={() => handleFeaturePress(feature)}
      style={({ pressed }) => [styles.featureCard, pressed && styles.featureCardPressed]}
    >
      <BlurView 
        intensity={80}
        tint="dark"
        style={styles.featureGlass}
      >
        <LinearGradient
          colors={feature.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featureGradient}
        >
          <View style={styles.featureIconContainer}>
            <Feather name={feature.icon} size={28} color="#FFF" />
          </View>
          <View style={styles.featureContent}>
            <View style={styles.featureTitleRow}>
              <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
              {feature.isPremium && (
                <View style={styles.proBadge}>
                  <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
                </View>
              )}
            </View>
            <ThemedText style={styles.featureDescription}>{feature.description}</ThemedText>
          </View>
          <Feather name="chevron-right" size={24} color="rgba(255,255,255,0.7)" />
        </LinearGradient>
      </BlurView>
    </Pressable>
  );

  const renderGoalSelector = () => (
    <View style={styles.goalSelector}>
      <ThemedText style={styles.selectorLabel}>Your Goal</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.goalScroll}>
        {goals.map((goal) => (
          <Pressable
            key={goal}
            onPress={() => setSelectedGoal(goal)}
            style={[styles.goalChip, selectedGoal === goal && styles.goalChipActive]}
          >
            <ThemedText style={[styles.goalChipText, selectedGoal === goal && styles.goalChipTextActive]}>
              {goal}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderNutritionModal = () => {
    if (!showNutritionModal) return null;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Nutrition Advice</ThemedText>
            <Pressable onPress={() => setShowNutritionModal(false)}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </Pressable>
          </View>
          
          <ThemedText style={styles.modalLabel}>Select your goal:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalScroll}>
            {goals.map((goal) => (
              <Pressable
                key={goal}
                onPress={() => setSelectedGoal(goal)}
                style={[styles.goalChip, selectedGoal === goal && styles.goalChipActive]}
              >
                <ThemedText style={[styles.goalChipText, selectedGoal === goal && styles.goalChipTextActive]}>
                  {goal}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <ThemedText style={styles.modalLabel}>Dietary restrictions:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalScroll}>
            {dietaryRestrictions.map((diet) => (
              <Pressable
                key={diet}
                onPress={() => setSelectedDiet(diet)}
                style={[styles.goalChip, selectedDiet === diet && styles.goalChipActive]}
              >
                <ThemedText style={[styles.goalChipText, selectedDiet === diet && styles.goalChipTextActive]}>
                  {diet}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable onPress={fetchNutritionAdvice} style={styles.modalButton} disabled={isLoading}>
            <LinearGradient colors={["#FF6B6B", "#FF4B4B"]} style={styles.modalButtonGradient}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.modalButtonText}>Get Advice</ThemedText>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderWorkoutPlanModal = () => {
    if (!showWorkoutPlanModal) return null;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Generate Workout Plan</ThemedText>
            <Pressable onPress={() => setShowWorkoutPlanModal(false)}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </Pressable>
          </View>
          
          <ThemedText style={styles.modalLabel}>Select your goal:</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalScroll}>
            {goals.map((goal) => (
              <Pressable
                key={goal}
                onPress={() => setSelectedGoal(goal)}
                style={[styles.goalChip, selectedGoal === goal && styles.goalChipActive]}
              >
                <ThemedText style={[styles.goalChipText, selectedGoal === goal && styles.goalChipTextActive]}>
                  {goal}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.planInfo}>
            <View style={styles.planInfoItem}>
              <Feather name="calendar" size={20} color="#FF6B6B" />
              <ThemedText style={styles.planInfoText}>4 weeks</ThemedText>
            </View>
            <View style={styles.planInfoItem}>
              <Feather name="repeat" size={20} color="#FF6B6B" />
              <ThemedText style={styles.planInfoText}>4 sessions/week</ThemedText>
            </View>
            <View style={styles.planInfoItem}>
              <Feather name="clock" size={20} color="#FF6B6B" />
              <ThemedText style={styles.planInfoText}>60 min each</ThemedText>
            </View>
          </View>

          <Pressable onPress={fetchWorkoutPlan} style={styles.modalButton} disabled={isLoading}>
            <LinearGradient colors={["#FF6B6B", "#FF4B4B"]} style={styles.modalButtonGradient}>
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <ThemedText style={styles.modalButtonText}>Generate Plan</ThemedText>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderFoodAnalysisResult = () => {
    if (!showFoodResult || !foodAnalysisResult) return null;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.resultContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>Food Analysis</ThemedText>
            <Pressable onPress={() => setShowFoodResult(false)}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </Pressable>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Spacing.xl }}
          >
            <View style={styles.healthScoreContainer}>
              <View style={styles.healthScoreCircle}>
                <ThemedText style={styles.healthScoreValue}>{foodAnalysisResult.healthScore}</ThemedText>
                <ThemedText style={styles.healthScoreLabel}>Health Score</ThemedText>
              </View>
            </View>

            <View style={styles.macrosGrid}>
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue}>{foodAnalysisResult.calories}</ThemedText>
                <ThemedText style={styles.macroLabel}>Calories</ThemedText>
              </View>
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue}>{foodAnalysisResult.protein}g</ThemedText>
                <ThemedText style={styles.macroLabel}>Protein</ThemedText>
              </View>
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue}>{foodAnalysisResult.carbs}g</ThemedText>
                <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
              </View>
              <View style={styles.macroItem}>
                <ThemedText style={styles.macroValue}>{foodAnalysisResult.fat}g</ThemedText>
                <ThemedText style={styles.macroLabel}>Fat</ThemedText>
              </View>
            </View>

            <ThemedText style={styles.sectionTitle}>Detected Foods</ThemedText>
            <View style={styles.foodsList}>
              {foodAnalysisResult.foods.map((food: string, i: number) => (
                <View key={i} style={styles.foodItem}>
                  <Feather name="check-circle" size={16} color="#FF6B6B" />
                  <ThemedText style={styles.foodItemText}>{food}</ThemedText>
                </View>
              ))}
            </View>

            <ThemedText style={styles.sectionTitle}>Suggestions</ThemedText>
            {foodAnalysisResult.suggestions.map((suggestion: string, i: number) => (
              <ThemedText key={i} style={styles.suggestionText}>{suggestion}</ThemedText>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  const renderNutritionResult = () => {
    if (!showNutritionResult || !nutritionResult) return null;
    const nutrition = nutritionResult;
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.resultContent}>
          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.modalTitle}>Nutrition Advice</ThemedText>
              <ThemedText style={styles.modalSubtitle}>{nutrition.goal || selectedGoal}</ThemedText>
            </View>
            <Pressable onPress={() => setShowNutritionResult(false)}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {nutrition.description ? (
              <View style={styles.nutritionCard}>
                <ThemedText style={styles.nutritionDesc}>{nutrition.description}</ThemedText>
                
                <View style={styles.macrosGrid}>
                  <View style={styles.macroItem}>
                    <ThemedText style={styles.macroValue}>{nutrition.calories_per_day}</ThemedText>
                    <ThemedText style={styles.macroLabel}>Daily Calories</ThemedText>
                  </View>
                </View>

                {nutrition.macronutrients && (
                  <View style={styles.macrosBreakdown}>
                    <ThemedText style={styles.sectionTitle}>Macronutrients</ThemedText>
                    <View style={styles.macroRow}>
                      <ThemedText style={styles.macroRowLabel}>Carbs</ThemedText>
                      <ThemedText style={styles.macroRowValue}>{nutrition.macronutrients.carbohydrates}</ThemedText>
                    </View>
                    <View style={styles.macroRow}>
                      <ThemedText style={styles.macroRowLabel}>Protein</ThemedText>
                      <ThemedText style={styles.macroRowValue}>{nutrition.macronutrients.proteins}</ThemedText>
                    </View>
                    <View style={styles.macroRow}>
                      <ThemedText style={styles.macroRowLabel}>Fats</ThemedText>
                      <ThemedText style={styles.macroRowValue}>{nutrition.macronutrients.fats}</ThemedText>
                    </View>
                  </View>
                )}

                {nutrition.advice && (
                  <View style={styles.adviceSection}>
                    <ThemedText style={styles.sectionTitle}>Key Advice</ThemedText>
                    <ThemedText style={styles.resultText}>{nutrition.advice}</ThemedText>
                  </View>
                )}
              </View>
            ) : (
              <ThemedText style={styles.resultText}>
                {typeof nutrition === "string" 
                  ? nutrition 
                  : JSON.stringify(nutrition, null, 2)}
              </ThemedText>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  const handleExercisePress = async (exerciseName: string) => {
    setIsLoading(true);
    try {
      const normalizedName = exerciseName
        .toLowerCase()
        .replace(/s$/i, '')
        .trim();
      
      console.log(`[AIHub] Searching for: ${normalizedName}`);
      const response = await fetch(`${baseUrl}api/exercises/name/${encodeURIComponent(normalizedName)}?limit=10`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate("ExerciseDetail", { exercise: data[0] });
        } else {
          // If no direct name match, search for parts of the name
          const words = normalizedName.split(' ').filter(w => w.length > 3);
          if (words.length > 0) {
            const secondResponse = await fetch(`${baseUrl}api/exercises/name/${encodeURIComponent(words[words.length - 1])}?limit=10`);
            if (secondResponse.ok) {
              const secondData = await secondResponse.json();
              if (Array.isArray(secondData) && secondData.length > 0) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("ExerciseDetail", { exercise: secondData[0] });
                return;
              }
            }
          }
          Alert.alert("Exercise not found", `Could not find details for ${exerciseName}. Try searching in the Discover tab.`);
        }
      }
    } catch (error) {
      console.error("Error fetching exercise details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWorkoutResult = () => {
    if (!showWorkoutResult || !workoutPlanResult) return null;
    
    // Attempt to parse the workout plan into a readable format
    const plan = workoutPlanResult;
    const days = plan.exercises || [];

    return (
      <View style={styles.modalOverlay}>
        <View style={styles.resultContent}>
          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.modalTitle}>Your Workout Plan</ThemedText>
              <ThemedText style={styles.modalSubtitle}>{plan.goal} • {plan.total_weeks} Weeks</ThemedText>
            </View>
            <Pressable onPress={() => setShowWorkoutResult(false)}>
              <Feather name="x" size={24} color={Colors.dark.text} />
            </Pressable>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            {days.length > 0 ? (
              days.map((day: any, idx: number) => (
                <View key={idx} style={styles.planDay}>
                  <ThemedText style={styles.planDayTitle}>{day.day}</ThemedText>
                  {day.exercises.map((ex: any, exIdx: number) => (
                    <Pressable 
                      key={exIdx} 
                      style={styles.planExercise}
                      onPress={() => handleExercisePress(ex.name)}
                    >
                      <View style={styles.planExerciseHeader}>
                        <ThemedText style={styles.planExerciseName}>{ex.name}</ThemedText>
                        <Feather name="chevron-right" size={16} color="#FF6B6B" />
                      </View>
                      <ThemedText style={styles.planExerciseDetails}>
                        {ex.reps || ex.repetitions} reps • {ex.sets} sets • {ex.duration !== "N/A" ? ex.duration : "Strength"}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ))
            ) : (
              <ThemedText style={styles.resultText}>
                {typeof plan === "string" ? plan : JSON.stringify(plan, null, 2)}
              </ThemedText>
            )}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>AI Features</ThemedText>
          <ThemedText style={styles.subtitle}>
            Powered by advanced AI to help you reach your fitness goals
          </ThemedText>
        </View>

        {renderGoalSelector()}

        <View style={styles.featuresContainer}>
          {AI_FEATURES.map(renderFeatureCard)}
        </View>

        <View style={styles.tipCard}>
          <LinearGradient
            colors={["rgba(157,78,221,0.2)", "rgba(90,24,154,0.2)"]}
            style={styles.tipGradient}
          >
            <Feather name="zap" size={24} color="#9D4EDD" />
            <View style={styles.tipContent}>
              <ThemedText style={styles.tipTitle}>Pro Tip</ThemedText>
              <ThemedText style={styles.tipText}>
                Use the AI Coach for personalized advice based on your workout history and goals.
              </ThemedText>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {renderNutritionModal()}
      {renderWorkoutPlanModal()}
      {renderFoodAnalysisResult()}
      {renderNutritionResult()}
      {renderWorkoutResult()}

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.dark.accent} />
          <ThemedText style={styles.loadingText}>Processing...</ThemedText>
        </View>
      )}
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
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  goalSelector: {
    marginBottom: Spacing.xl,
  },
  selectorLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  goalScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  goalChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  goalChipActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  goalChipText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  goalChipTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  featuresContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  featureCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  featureGlass: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  featureGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
  },
  proBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFF",
  },
  featureDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },
  tipCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  tipGradient: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 107, 0.2)',
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  modalLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalScroll: {
    marginBottom: Spacing.md,
  },
  planInfo: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.lg,
  },
  planInfoItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  planInfoText: {
    fontSize: 14,
    color: Colors.dark.text,
  },
  modalButton: {
    marginTop: Spacing.md,
  },
  modalButtonGradient: {
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  resultContent: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  resultScrollContent: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  resultContentInner: {
    padding: Spacing.lg,
  },
  resultText: {
    fontSize: 14,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  healthScoreContainer: {
    alignItems: "center",
    marginVertical: Spacing.lg,
  },
  healthScoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: '#FF6B6B',
  },
  healthScoreValue: {
    fontSize: 48,
    fontWeight: "700",
    color: '#FF6B6B',
    lineHeight: 56,
  },
  healthScoreLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  macrosGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.lg,
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  foodsList: {
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  foodItemText: {
    fontSize: 14,
    color: Colors.dark.text,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
    paddingLeft: Spacing.sm,
  },
  planDay: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.dark.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  planDayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF6B6B",
    marginBottom: Spacing.sm,
  },
  planExercise: {
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  planExerciseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  planExerciseDetails: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  nutritionCard: {
    gap: Spacing.md,
  },
  nutritionDesc: {
    fontSize: 15,
    color: Colors.dark.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  macrosBreakdown: {
    backgroundColor: Colors.dark.backgroundSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  macroRowLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  macroRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  adviceSection: {
    marginTop: Spacing.md,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Colors.dark.text,
    fontSize: 16,
  },
});
