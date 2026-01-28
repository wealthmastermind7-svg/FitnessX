import React, { useState, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import KeyboardAwareScrollViewCompat from "@/components/KeyboardAwareScrollViewCompat";
import { Colors, Spacing, BorderRadius, Typography, Shadows, Gradients } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRevenueCat } from "@/lib/revenuecat";
import { Alert } from "react-native";

const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Arms", "Forearms", "Legs", "Calves", "Core", "Glutes", "Quads", "Hamstrings", "Biceps", "Triceps", "Cardio"
];

const MUSCLE_API_NAMES: Record<string, string> = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  arms: "biceps,triceps",
  biceps: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  legs: "quadriceps,hamstrings,glutes",
  quads: "quadriceps",
  quadriceps: "quadriceps",
  hamstrings: "hamstrings",
  glutes: "glutes",
  calves: "calves",
  core: "abdominals",
  abs: "abdominals",
  obliques: "abdominals",
  cardio: "chest", // Fallback for cardio visualization
};

const EQUIPMENT_OPTIONS = [
  "Any", "Barbell", "Dumbbell", "Cable", "Machine", "Bodyweight", "Kettlebell",
];

const DIFFICULTY_LEVELS = ["Beginner", "Intermediate", "Advanced"];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function SelectableChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.chip,
          selected && styles.chipSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <ThemedText style={[styles.chipText, selected && styles.chipTextSelected]}>
          {label}
        </ThemedText>
      </Animated.View>
    </Pressable>
  );
}

export default function GenerateScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const { isProUser } = useRevenueCat();
  
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(["Any"]);
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionLength, setSessionLength] = useState(45);
  
  const buttonScale = useRef(new Animated.Value(1)).current;
  const baseUrl = getApiUrl();

  const mappedMuscles = selectedMuscles.map(m => MUSCLE_API_NAMES[m.toLowerCase()] || m.toLowerCase());
  const uniqueMappedMuscles = [...new Set(mappedMuscles)];
  
  const muscleImageUrl = selectedMuscles.length > 0
    ? `${baseUrl}api/muscle-image?muscles=${uniqueMappedMuscles.join(",")}&color=255,107,107`
    : `${baseUrl}api/muscle-image?base=true`;

  const toggleMuscle = useCallback((muscle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  }, []);

  const toggleEquipment = useCallback((equip: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (equip === "Any") {
      setSelectedEquipment(["Any"]);
    } else {
      setSelectedEquipment((prev) => {
        const filtered = prev.filter((e) => e !== "Any");
        return filtered.includes(equip)
          ? filtered.filter((e) => e !== equip)
          : [...filtered, equip];
      });
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selectedMuscles.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!isProUser) {
      const savedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      const workouts = savedWorkouts ? JSON.parse(savedWorkouts) : [];
      if (workouts.length >= 5) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "Workout Limit Reached",
          "Free users can generate and save up to 5 workouts. Upgrade to Pro to generate and save up to 100 workouts and access all 1,300+ exercises.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Upgrade", onPress: () => navigation.navigate("Paywall") },
          ]
        );
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setIsGenerating(true);

    try {
      const response = await fetch(`${baseUrl}api/generate-workout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muscleGroups: selectedMuscles,
          equipment: selectedEquipment.includes("Any") ? ["any"] : selectedEquipment.map(e => e.toLowerCase()),
          description: description || `A ${difficulty.toLowerCase()} workout targeting ${selectedMuscles.join(", ")}`,
        }),
      });

      if (response.ok) {
        const workout = await response.json();
        navigation.navigate("WorkoutDetail", { workout });
      } else {
        const errorData = await response.json().catch(() => ({}));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          "Generation Failed",
          errorData.error || "Unable to generate workout. Please try again.",
          [{ text: "OK", style: "default" }]
        );
      }
    } catch (error) {
      console.error("Error generating workout:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Error",
        "Failed to generate workout. Please check your connection and try again.",
        [{ text: "OK", style: "default" }]
      );
    } finally {
      setIsGenerating(false);
    }
  }, [selectedMuscles, selectedEquipment, difficulty, description, navigation, baseUrl, isProUser]);

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.buttonHeight + Spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.screenTagline}>CREATE YOUR</ThemedText>
        <ThemedText style={styles.screenTitle}>
          Custom <ThemedText style={styles.screenTitleAccent}>Workout</ThemedText>
        </ThemedText>
        <ThemedText style={styles.screenSubtitle}>
          Select muscle groups and equipment to generate your perfect routine
        </ThemedText>

        <View style={styles.muscleImageContainer}>
          <Image
            source={{ uri: muscleImageUrl }}
            style={styles.muscleImage}
            resizeMode="contain"
          />
          {selectedMuscles.length === 0 && (
            <View style={styles.muscleImageOverlay}>
              <ThemedText style={styles.muscleImageHint}>
                Select muscles below
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>MUSCLE GROUPS</ThemedText>
          <View style={styles.chipContainer}>
            {MUSCLE_GROUPS.map((muscle) => (
              <SelectableChip
                key={muscle}
                label={muscle}
                selected={selectedMuscles.includes(muscle)}
                onPress={() => toggleMuscle(muscle)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>EQUIPMENT</ThemedText>
          <View style={styles.chipContainer}>
            {EQUIPMENT_OPTIONS.map((equip) => (
              <SelectableChip
                key={equip}
                label={equip}
                selected={selectedEquipment.includes(equip)}
                onPress={() => toggleEquipment(equip)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>DIFFICULTY</ThemedText>
          <View style={styles.difficultyContainer}>
            {DIFFICULTY_LEVELS.map((level) => (
              <Pressable
                key={level}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDifficulty(level);
                }}
                style={[
                  styles.difficultyOption,
                  difficulty === level && styles.difficultyOptionSelected,
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

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>SESSION LENGTH</ThemedText>
          <View style={styles.difficultyContainer}>
            {[30, 45, 60, 90].map((mins) => (
              <Pressable
                key={mins}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSessionLength(mins);
                }}
                style={[
                  styles.difficultyOption,
                  sessionLength === mins && styles.difficultyOptionSelected,
                ]}
              >
                <ThemedText
                  style={[
                    styles.difficultyText,
                    sessionLength === mins && styles.difficultyTextSelected,
                  ]}
                >
                  {mins}m
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Plate Calculator Section */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>UTILITY TOOLS</ThemedText>
          <Card elevation={2} style={styles.utilityCard}>
            <View style={styles.utilityHeader}>
              <Feather name="settings" size={20} color={Colors.dark.accent} />
              <ThemedText style={styles.utilityTitle}>Plate Calculator</ThemedText>
            </View>
            <ThemedText style={styles.utilityDescription}>
              Quickly calculate how many plates you need for your target weight.
            </ThemedText>
            <Pressable 
              style={styles.utilityButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("PlateCalculator");
              }}
            >
              <ThemedText style={styles.utilityButtonText}>Open Calculator</ThemedText>
              <Feather name="external-link" size={14} color="#FFF" />
            </Pressable>
          </Card>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>NOTES (OPTIONAL)</ThemedText>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Add any specific requests..."
            placeholderTextColor={Colors.dark.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>
      </KeyboardAwareScrollViewCompat>

      <Animated.View
        style={[
          styles.floatingButtonContainer,
          {
            bottom: tabBarHeight + Spacing.lg,
            transform: [{ scale: buttonScale }],
          },
        ]}
      >
        <Pressable
          onPressIn={handleButtonPressIn}
          onPressOut={handleButtonPressOut}
          onPress={handleGenerate}
          disabled={isGenerating || selectedMuscles.length === 0}
        >
          <LinearGradient
            colors={["#FF6B6B", "#FF4B4B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.floatingButton,
              Shadows.floatingButton,
            ]}
          >
            {isGenerating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Feather name="zap" size={20} color="#FFF" style={{ marginRight: Spacing.sm }} />
                <ThemedText style={styles.floatingButtonText}>
                  Generate Workout
                </ThemedText>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
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
    color: Colors.dark.accent,
    marginBottom: Spacing.xs,
  },
  screenTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
    lineHeight: 42,
  },
  screenTitleAccent: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FF6B6B",
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  muscleImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  muscleImage: {
    width: "100%",
    height: "100%",
  },
  muscleImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(10,14,26,0.5)",
  },
  muscleImageHint: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.dark.backgroundDefault,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  chipSelected: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  chipText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  chipTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  difficultyContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  difficultyOptionSelected: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  difficultyText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  difficultyTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  utilityCard: {
    padding: Spacing.md,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  utilityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  utilityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  utilityDescription: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  utilityButton: {
    backgroundColor: Colors.dark.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  utilityButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.dark.text,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  floatingButtonContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
  },
  floatingButton: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  floatingButtonText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
