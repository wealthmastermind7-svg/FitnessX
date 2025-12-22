import React, { useRef, useEffect, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography, Gradients } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList, Exercise } from "@/navigation/RootStackNavigator";

interface ExerciseDBData {
  id: string;
  name: string;
  gifUrl: string;
  bodyPart: string;
  target: string;
  equipment: string;
  instructions: string[];
  secondaryMuscles: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type WorkoutDetailRouteProp = RouteProp<RootStackParamList, "WorkoutDetail">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function ExerciseCard({ 
  exercise, 
  index,
  exerciseData,
  onPress 
}: { 
  exercise: Exercise; 
  index: number;
  exerciseData: ExerciseDBData;
  onPress: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const baseUrl = getApiUrl();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const gifUrl = `${baseUrl}api/exercises/image/${exerciseData.id}`;

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.exerciseCard,
          {
            opacity: fadeAnim,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.exerciseCardContent}>
          <View style={styles.gifContainer}>
            <Image
              source={{ uri: gifUrl }}
              style={styles.exerciseGif}
              contentFit="cover"
            />
          </View>
          <View style={styles.exerciseInfo}>
            <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
            <ThemedText style={styles.exerciseMuscle}>{exercise.muscleGroup}</ThemedText>
            {exerciseData ? (
              <View style={styles.exerciseTags}>
                <View style={styles.exerciseTag}>
                  <ThemedText style={styles.exerciseTagText}>{exerciseData.target}</ThemedText>
                </View>
                <View style={styles.exerciseTag}>
                  <ThemedText style={styles.exerciseTagText}>{exerciseData.equipment}</ThemedText>
                </View>
              </View>
            ) : null}
          </View>
          <View style={styles.chevronContainer}>
            <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
          </View>
        </View>
        <View style={styles.exerciseDetails}>
          <View style={styles.exerciseStat}>
            <ThemedText style={styles.exerciseStatValue}>{exercise.sets}</ThemedText>
            <ThemedText style={styles.exerciseStatLabel}>Sets</ThemedText>
          </View>
          <View style={styles.exerciseStat}>
            <ThemedText style={styles.exerciseStatValue}>{exercise.reps}</ThemedText>
            <ThemedText style={styles.exerciseStatLabel}>Reps</ThemedText>
          </View>
          <View style={styles.exerciseStat}>
            <ThemedText style={styles.exerciseStatValue}>{exercise.restSeconds}s</ThemedText>
            <ThemedText style={styles.exerciseStatLabel}>Rest</ThemedText>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const muscleToBodyPart: Record<string, string> = {
  chest: "chest",
  back: "back",
  shoulders: "shoulders",
  arms: "upper arms",
  biceps: "upper arms",
  triceps: "upper arms",
  forearms: "lower arms",
  legs: "upper legs",
  quadriceps: "upper legs",
  hamstrings: "upper legs",
  glutes: "upper legs",
  calves: "lower legs",
  core: "waist",
  abs: "waist",
  cardio: "cardio",
};

const fallbackExercises: Record<string, ExerciseDBData> = {
  chest: { id: "0025", name: "bench press", gifUrl: "", bodyPart: "chest", target: "pectorals", equipment: "barbell", instructions: [], secondaryMuscles: [] },
  back: { id: "0027", name: "bent over row", gifUrl: "", bodyPart: "back", target: "lats", equipment: "barbell", instructions: [], secondaryMuscles: [] },
  shoulders: { id: "0405", name: "shoulder press", gifUrl: "", bodyPart: "shoulders", target: "deltoids", equipment: "dumbbell", instructions: [], secondaryMuscles: [] },
  "upper arms": { id: "0294", name: "bicep curl", gifUrl: "", bodyPart: "upper arms", target: "biceps", equipment: "dumbbell", instructions: [], secondaryMuscles: [] },
  "lower arms": { id: "0294", name: "wrist curl", gifUrl: "", bodyPart: "lower arms", target: "forearms", equipment: "dumbbell", instructions: [], secondaryMuscles: [] },
  "upper legs": { id: "0043", name: "squat", gifUrl: "", bodyPart: "upper legs", target: "quads", equipment: "barbell", instructions: [], secondaryMuscles: [] },
  "lower legs": { id: "0483", name: "calf raise", gifUrl: "", bodyPart: "lower legs", target: "calves", equipment: "body weight", instructions: [], secondaryMuscles: [] },
  waist: { id: "0002", name: "crunch", gifUrl: "", bodyPart: "waist", target: "abs", equipment: "body weight", instructions: [], secondaryMuscles: [] },
  cardio: { id: "1160", name: "jumping jacks", gifUrl: "", bodyPart: "cardio", target: "cardiovascular system", equipment: "body weight", instructions: [], secondaryMuscles: [] },
};

function buildInitialFallbacks(exercises: Exercise[]): Record<string, ExerciseDBData> {
  const result: Record<string, ExerciseDBData> = {};
  exercises.forEach(e => {
    const bodyPart = muscleToBodyPart[e.muscleGroup?.toLowerCase() || "chest"] || "chest";
    const fallback = fallbackExercises[bodyPart] || fallbackExercises.chest;
    result[e.name] = {
      ...fallback,
      name: e.name,
      instructions: [`Perform ${e.sets} sets of ${e.reps} reps`, `Rest ${e.restSeconds} seconds between sets`],
    };
  });
  return result;
}

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WorkoutDetailRouteProp>();
  const { workout } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;
  const baseUrl = getApiUrl();
  
  const [exerciseDataMap, setExerciseDataMap] = useState<Record<string, ExerciseDBData>>(() => 
    buildInitialFallbacks(workout.exercises)
  );

  useEffect(() => {
    const normalizeExerciseName = (name: string): string[] => {
      const base = name.toLowerCase().trim();
      const variants: string[] = [base];
      
      const singular = base
        .replace(/presses$/i, 'press')
        .replace(/raises$/i, 'raise')
        .replace(/curls$/i, 'curl')
        .replace(/rows$/i, 'row')
        .replace(/flyes$/i, 'fly')
        .replace(/flies$/i, 'fly')
        .replace(/extensions$/i, 'extension')
        .replace(/pulldowns$/i, 'pulldown')
        .replace(/pull-downs$/i, 'pulldown')
        .replace(/pushups$/i, 'push up')
        .replace(/push-ups$/i, 'push up')
        .replace(/situps$/i, 'sit up')
        .replace(/sit-ups$/i, 'sit up')
        .replace(/s$/, '');
      if (singular !== base) variants.push(singular);
      
      const normalized = base
        .replace(/-/g, ' ')
        .replace(/dumbbell /i, '')
        .replace(/barbell /i, '')
        .replace(/cable /i, '')
        .replace(/machine /i, '');
      if (normalized !== base) variants.push(normalized);
      
      const withoutParens = base.replace(/\s*\([^)]*\)/g, '').trim();
      if (withoutParens !== base) variants.push(withoutParens);
      
      const words = base.split(/[\s-]+/).filter(w => w.length > 3 && !['with', 'and', 'the'].includes(w));
      if (words.length >= 2) {
        variants.push(words.slice(0, 2).join(' '));
      }
      if (words.length > 0) {
        variants.push(words[words.length - 1]);
      }
      
      return [...new Set(variants)];
    };

    const fetchExerciseData = async () => {
      for (const exercise of workout.exercises) {
        try {
          const nameVariants = normalizeExerciseName(exercise.name);
          let foundExercise: ExerciseDBData | null = null;
          
          for (const variant of nameVariants) {
            if (foundExercise) break;
            const searchName = encodeURIComponent(variant);
            const response = await fetch(`${baseUrl}api/exercises/name/${searchName}`);
            if (response.ok) {
              const exercises: ExerciseDBData[] = await response.json();
              if (exercises.length > 0) {
                foundExercise = exercises[0];
              }
            }
          }
          
          if (!foundExercise && exercise.muscleGroup) {
            const bodyPart = muscleToBodyPart[exercise.muscleGroup.toLowerCase()] || "chest";
            try {
              const bodyPartResponse = await fetch(`${baseUrl}api/exercises/bodyPart/${encodeURIComponent(bodyPart)}`);
              if (bodyPartResponse.ok) {
                const bodyPartExercises: ExerciseDBData[] = await bodyPartResponse.json();
                if (bodyPartExercises.length > 0) {
                  const randomIndex = Math.floor(Math.random() * Math.min(bodyPartExercises.length, 10));
                  foundExercise = {
                    ...bodyPartExercises[randomIndex],
                    name: exercise.name,
                  };
                }
              }
            } catch {
              // Body part fetch failed, keep initial fallback
            }
          }
          
          if (foundExercise) {
            setExerciseDataMap(prev => ({ ...prev, [exercise.name]: foundExercise as ExerciseDBData }));
          }
        } catch (error) {
          console.error(`Error fetching exercise data for ${exercise.name}:`, error);
          const fallback = fallbackExercises.chest;
          const fallbackData = {
            ...fallback,
            name: exercise.name,
            instructions: [`Perform ${exercise.sets} sets of ${exercise.reps} reps`],
          };
          setExerciseDataMap(prev => ({ ...prev, [exercise.name]: fallbackData }));
        } finally {
          // Network request complete - exerciseDataMap already has fallback or upgraded data
        }
      }
    };

    fetchExerciseData();
  }, [workout.exercises, baseUrl]);

  const handleExercisePress = useCallback((exerciseData: ExerciseDBData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("ExerciseDetail", { exercise: exerciseData });
  }, [navigation]);

  const muscleImageUrl = workout.muscleGroups.length > 0
    ? `${baseUrl}api/dual-muscle-image?primary=${workout.muscleGroups[0].toLowerCase()}&secondary=${workout.muscleGroups.slice(1).join(",").toLowerCase()}`
    : `${baseUrl}api/muscle-image?base=true`;

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleSave = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    try {
      const savedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      const workouts = savedWorkouts ? JSON.parse(savedWorkouts) : [];
      workouts.push(workout);
      await AsyncStorage.setItem("savedWorkouts", JSON.stringify(workouts));

      const statsData = await AsyncStorage.getItem("workoutStats");
      const stats = statsData ? JSON.parse(statsData) : { totalWorkouts: 0, currentStreak: 0 };
      stats.totalWorkouts += 1;
      
      if (workout.muscleGroups.length > 0) {
        stats.favoriteMuscle = workout.muscleGroups[0];
      }
      
      await AsyncStorage.setItem("workoutStats", JSON.stringify(stats));
      
      navigation.goBack();
    } catch (error) {
      console.error("Error saving workout:", error);
    }
  }, [workout, navigation]);

  const parallaxTransform = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [50, 0, -100],
    extrapolate: "clamp",
  });

  const imageScale = scrollY.interpolate({
    inputRange: [-100, 0],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <ThemedView style={styles.container}>
      <Animated.View
        style={[
          styles.headerBackground,
          { paddingTop: insets.top, opacity: headerOpacity },
        ]}
      >
        <ThemedText style={styles.headerTitle}>{workout.name}</ThemedText>
      </Animated.View>

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={handleClose} style={styles.headerButton}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <Pressable onPress={handleSave} style={styles.headerButton}>
          <Feather name="bookmark" size={24} color={Colors.dark.accent} />
        </Pressable>
      </View>

      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <Animated.View
          style={[
            styles.heroSection,
            {
              transform: [
                { translateY: parallaxTransform },
                { scale: imageScale },
              ],
            },
          ]}
        >
          <Image
            source={{ uri: muscleImageUrl }}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <LinearGradient
            colors={["transparent", Colors.dark.backgroundRoot]}
            style={styles.heroGradient}
          />
        </Animated.View>

        <View style={styles.content}>
          <ThemedText style={styles.workoutName}>{workout.name}</ThemedText>
          <ThemedText style={styles.workoutDescription}>{workout.description}</ThemedText>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Feather name="target" size={18} color={Colors.dark.accent} />
              <ThemedText style={styles.metaText}>
                {workout.muscleGroups.join(", ")}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="tool" size={18} color={Colors.dark.accent} />
              <ThemedText style={styles.metaText}>
                {workout.equipment.join(", ")}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="bar-chart-2" size={18} color={Colors.dark.accent} />
              <ThemedText style={styles.metaText}>{workout.difficulty}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.exercisesTitle}>Exercises</ThemedText>

          {workout.exercises.map((exercise, index) => {
            const exerciseData = exerciseDataMap[exercise.name] || {
              id: `fallback-${index}`,
              name: exercise.name,
              bodyPart: exercise.muscleGroup || "chest",
              target: exercise.muscleGroup || "chest",
              equipment: "any",
              gifUrl: "",
              instructions: [`Perform ${exercise.sets} sets of ${exercise.reps} reps`],
              secondaryMuscles: [],
            };
            return (
              <ExerciseCard 
                key={`${exercise.name}-${index}`}
                exercise={exercise} 
                index={index}
                exerciseData={exerciseData}
                onPress={() => handleExercisePress(exerciseData)}
              />
            );
          })}

          <Pressable onPress={handleSave} style={styles.saveButton}>
            <LinearGradient
              colors={Gradients.accent as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Feather name="bookmark" size={20} color="#FFF" style={{ marginRight: Spacing.sm }} />
              <ThemedText style={styles.saveButtonText}>Save Workout</ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.dark.backgroundRoot,
    zIndex: 1,
    paddingBottom: Spacing.md,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    zIndex: 2,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundDefault + "CC",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingTop: 0,
  },
  heroSection: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  content: {
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xxl,
  },
  workoutName: {
    ...Typography.display,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  workoutDescription: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.lg,
  },
  metaContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metaText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  exercisesTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  exerciseCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  exerciseCardContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  gifContainer: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  exerciseGif: {
    width: 70,
    height: 70,
  },
  gifPlaceholder: {
    width: 70,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  exerciseName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: 2,
  },
  exerciseMuscle: {
    ...Typography.small,
    color: Colors.dark.accent,
    marginBottom: Spacing.xs,
  },
  exerciseTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  exerciseTag: {
    backgroundColor: Colors.dark.accent + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseTagText: {
    fontSize: 10,
    color: Colors.dark.accent,
    textTransform: "capitalize",
  },
  chevronContainer: {
    paddingLeft: Spacing.sm,
  },
  exerciseDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  exerciseStat: {
    alignItems: "center",
  },
  exerciseStatValue: {
    ...Typography.h3,
    color: Colors.dark.text,
    fontFamily: "ui-monospace",
  },
  exerciseStatLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  saveButton: {
    marginTop: Spacing.lg,
  },
  saveButtonGradient: {
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: {
    ...Typography.body,
    color: "#FFF",
    fontWeight: "600",
  },
});
