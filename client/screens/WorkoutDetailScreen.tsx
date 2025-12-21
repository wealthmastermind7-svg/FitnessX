import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography, Gradients } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList, Exercise } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type WorkoutDetailRouteProp = RouteProp<RootStackParamList, "WorkoutDetail">;

function ExerciseCard({ exercise, index }: { exercise: Exercise; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

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

  return (
    <Animated.View
      style={[
        styles.exerciseCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.exerciseInfo}>
        <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
        <ThemedText style={styles.exerciseMuscle}>{exercise.muscleGroup}</ThemedText>
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
  );
}

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<WorkoutDetailRouteProp>();
  const { workout } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;
  const baseUrl = getApiUrl();

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

          {workout.exercises.map((exercise, index) => (
            <ExerciseCard key={index} exercise={exercise} index={index} />
          ))}

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
  exerciseInfo: {
    marginBottom: Spacing.md,
  },
  exerciseName: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  exerciseMuscle: {
    ...Typography.small,
    color: Colors.dark.accent,
  },
  exerciseDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
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
