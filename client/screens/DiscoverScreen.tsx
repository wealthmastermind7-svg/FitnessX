import React, { useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ReadinessWidget from "@/components/ReadinessWidget";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList, Workout } from "@/navigation/RootStackNavigator";
import { Image as ExpoImage } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Arms",
  "Forearms",
  "Legs",
  "Calves",
  "Core",
  "Glutes",
  "Quads",
  "Hamstrings",
  "Biceps",
  "Triceps",
  "Cardio",
];

const muscleGroupImages: Record<string, any> = {
  "Chest": require("../assets/muscle-groups/chest.jpeg"),
  "Back": require("../assets/muscle-groups/back.jpeg"),
  "Shoulders": require("../assets/muscle-groups/shoulders.jpeg"),
  "Arms": require("../assets/muscle-groups/arms.jpeg"),
  "Forearms": require("../assets/muscle-groups/forearms.jpeg"),
  "Legs": require("../assets/muscle-groups/legs.jpeg"),
  "Calves": require("../assets/muscle-groups/calves.jpeg"),
  "Core": require("../assets/muscle-groups/core.jpeg"),
  "Glutes": require("../assets/muscle-groups/legs.jpeg"),
  "Quads": require("../assets/muscle-groups/legs.jpeg"),
  "Hamstrings": require("../assets/muscle-groups/legs.jpeg"),
  "Biceps": require("../assets/muscle-groups/arms.jpeg"),
  "Triceps": require("../assets/muscle-groups/arms.jpeg"),
  "Cardio": require("../assets/muscle-groups/cardio.jpeg"),
};

const POPULAR_WORKOUTS = [
  {
    id: "1",
    name: "Push Day",
    description: "Chest, shoulders, and triceps",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    equipment: ["any"],
    difficulty: "Intermediate",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Chest" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Chest" },
      { name: "Overhead Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Shoulders" },
      { name: "Lateral Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Shoulders" },
      { name: "Tricep Pushdowns", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Triceps" },
      { name: "Skull Crushers", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Triceps" },
    ],
  },
  {
    id: "2",
    name: "Pull Day",
    description: "Back and biceps focus",
    muscleGroups: ["Back", "Biceps"],
    equipment: ["any"],
    difficulty: "Intermediate",
    exercises: [
      { name: "Barbell Rows", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Back" },
      { name: "Lat Pulldown", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" },
      { name: "Seated Cable Row", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" },
      { name: "Face Pulls", sets: 3, reps: "15-20", restSeconds: 45, muscleGroup: "Back" },
      { name: "Barbell Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" },
      { name: "Hammer Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" },
    ],
  },
  {
    id: "3",
    name: "Leg Day",
    description: "Complete lower body",
    muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
    equipment: ["any"],
    difficulty: "Advanced",
    exercises: [
      { name: "Squats", sets: 4, reps: "8-10", restSeconds: 120, muscleGroup: "Quads" },
      { name: "Leg Press", sets: 3, reps: "10-12", restSeconds: 90, muscleGroup: "Quads" },
      { name: "Romanian Deadlifts", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Hamstrings" },
      { name: "Leg Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Hamstrings" },
      { name: "Hip Thrusts", sets: 4, reps: "10-12", restSeconds: 90, muscleGroup: "Glutes" },
      { name: "Standing Calf Raises", sets: 4, reps: "15-20", restSeconds: 45, muscleGroup: "Calves" },
    ],
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function MuscleCard({ muscle, index, navigation }: { muscle: string; index: number; navigation: NavigationProp }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const muscleImagePath = muscleGroupImages[muscle];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("ExerciseBrowser", { filterByMuscle: muscle });
  };

  const gradientColors = [
    ["#FF6B6B", "#FF8C8C"],
    ["#4ECDC4", "#6FE4DD"],
    ["#9D4EDD", "#B480E8"],
    ["#FFB347", "#FFD9A4"],
    ["#FF6B9D", "#FF8FB3"],
    ["#6BCB77", "#9AED9A"],
  ];
  
  const gradientColor = gradientColors[index % gradientColors.length];

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View
        style={[
          styles.muscleCard,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {!imageLoaded && (
          <LinearGradient
            colors={gradientColor as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.muscleImage}
          />
        )}
        <ExpoImage
          source={muscleImagePath}
          style={[styles.muscleImage, { opacity: imageLoaded ? 1 : 0 }]}
          contentFit="contain"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageLoaded(false);
          }}
        />
        <LinearGradient
          colors={["transparent", "rgba(10,14,26,0.95)"]}
          style={styles.muscleGradient}
        >
          <ThemedText style={styles.muscleName}>{muscle}</ThemedText>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

function WorkoutCard({ workout, onPress }: { workout: typeof POPULAR_WORKOUTS[0]; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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
        style={[styles.workoutCard, { transform: [{ scale: scaleAnim }] }]}
      >
        <BlurView intensity={40} tint="dark" style={styles.workoutCardBlur}>
          <View style={styles.workoutCardHeader}>
            <ThemedText style={styles.workoutCardTitle}>{workout.name}</ThemedText>
            <View style={styles.difficultyBadge}>
              <ThemedText style={styles.difficultyText}>{workout.difficulty}</ThemedText>
            </View>
          </View>
          <ThemedText style={styles.workoutCardDescription}>
            {workout.description}
          </ThemedText>
          <View style={styles.workoutCardMuscles}>
            {workout.muscleGroups.slice(0, 3).map((muscle, idx) => (
              <View key={idx} style={styles.musclePill}>
                <ThemedText style={styles.musclePillText}>{muscle}</ThemedText>
              </View>
            ))}
          </View>
        </BlurView>
      </Animated.View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<NavigationProp>();
  
  const { data: generatedWorkouts } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const handleWorkoutPress = useCallback((workoutTemplate: typeof POPULAR_WORKOUTS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const workout = {
      id: workoutTemplate.id,
      name: workoutTemplate.name,
      description: workoutTemplate.description,
      muscleGroups: workoutTemplate.muscleGroups,
      equipment: workoutTemplate.equipment,
      exercises: workoutTemplate.exercises,
      difficulty: workoutTemplate.difficulty,
    };
    
    navigation.navigate("WorkoutDetail", { workout });
  }, [navigation]);

  return (
    <ThemedView style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        <View style={styles.premiumHighlightContainer}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              navigation.navigate("FoodPlate");
            }}
            style={({ pressed }) => [
              styles.premiumCirclePressable,
              pressed && { transform: [{ scale: 0.96 }] },
            ]}
          >
            <View style={styles.premiumCircleOuter}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80" }} 
                style={styles.premiumCircleImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(13, 2, 33, 0.8)"]}
                style={styles.premiumCircleGradient}
              />
              
              <View style={styles.premiumCircleContent}>
                <ThemedText style={styles.premiumCircleTitle}>Analyse Food Plate</ThemedText>
                <View style={styles.premiumScanIndicator}>
                  <Feather name="camera" size={24} color="#FFF" />
                  <ThemedText style={styles.premiumScanText}>SCAN ME</ThemedText>
                </View>
              </View>

              <BlurView intensity={60} tint="dark" style={[styles.resultBubble, { top: '15%', right: '-5%' }]}>
                <Feather name="activity" size={24} color="#FF6B6B" />
                <ThemedText style={styles.resultBubbleLabel}>STATS</ThemedText>
              </BlurView>
              <BlurView intensity={60} tint="dark" style={[styles.resultBubble, { bottom: '25%', left: '-5%' }]}>
                <Feather name="pie-chart" size={24} color="#FF6B6B" />
                <ThemedText style={styles.resultBubbleLabel}>MACROS</ThemedText>
              </BlurView>
            </View>
          </Pressable>
        </View>

        <ReadinessWidget />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Popular Workouts</ThemedText>
            <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {POPULAR_WORKOUTS.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => handleWorkoutPress(workout)}
              />
            ))}
          </ScrollView>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.horizontalScroll, { paddingHorizontal: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.xl }]}
          decelerationRate="fast"
          snapToInterval={SCREEN_WIDTH * 0.85 + Spacing.md}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("MicroHabits");
            }}
            style={({ pressed }) => [
              styles.aiChatCard,
              { width: SCREEN_WIDTH * 0.85, marginBottom: 0 },
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={[styles.exerciseLibraryGradient, { backgroundColor: '#FF6B6B', height: '100%' }]}>
              <View style={styles.exerciseLibraryContent}>
                <View style={styles.exerciseLibraryText}>
                  <View style={[styles.exerciseLibraryBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                    <Feather name="coffee" size={14} color="#FFF" />
                    <ThemedText style={[styles.exerciseLibraryBadgeText, { color: "#FFF" }]}>
                      AUTOPILOT
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.exerciseLibraryTitle}>
                    Micro-Habits
                  </ThemedText>
                  <ThemedText style={[styles.exerciseLibrarySubtitle, { color: "rgba(255,255,255,0.85)" }]}>
                    30-90 sec movements triggered by daily moments
                  </ThemedText>
                </View>
                <View style={styles.exerciseLibraryPreview}>
                  <View style={[styles.previewCard, { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 0 }]}>
                    <Feather name="clock" size={32} color="#FFF" />
                  </View>
                </View>
              </View>
              <View style={styles.exerciseLibraryArrow}>
                <Feather name="arrow-right" size={20} color="#FFF" />
              </View>
            </View>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("AIChat");
            }}
            style={({ pressed }) => [
              styles.aiChatCard,
              { width: SCREEN_WIDTH * 0.85, marginBottom: 0 },
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={[styles.exerciseLibraryGradient, { backgroundColor: '#2C124B', height: '100%' }]}>
              <View style={styles.exerciseLibraryContent}>
                <View style={styles.exerciseLibraryText}>
                  <View style={[styles.exerciseLibraryBadge, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                    <Feather name="zap" size={14} color="#9D4EDD" />
                    <ThemedText style={[styles.exerciseLibraryBadgeText, { color: "#9D4EDD" }]}>
                      PRO
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.exerciseLibraryTitle}>
                    AI Coach
                  </ThemedText>
                  <ThemedText style={[styles.exerciseLibrarySubtitle, { color: "rgba(255,255,255,0.7)" }]}>
                    Programs, feedback, recovery & coaching
                  </ThemedText>
                </View>
                <View style={styles.exerciseLibraryPreview}>
                  <Feather name="message-circle" size={40} color="rgba(157, 78, 221, 0.5)" />
                </View>
              </View>
              <View style={styles.exerciseLibraryArrow}>
                <Feather name="arrow-right" size={20} color="#9D4EDD" />
              </View>
            </View>
          </Pressable>
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Exercise Library</ThemedText>
            <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
          </View>
          <View style={styles.muscleGrid}>
            {MUSCLE_GROUPS.map((muscle, index) => (
              <MuscleCard
                key={muscle}
                muscle={muscle}
                index={index}
                navigation={navigation}
              />
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  premiumHighlightContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.xl,
    height: 340,
  },
  premiumCirclePressable: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: "visible",
  },
  premiumCircleOuter: {
    width: "100%",
    height: "100%",
    borderRadius: 140,
    overflow: "hidden",
    position: "relative",
    borderWidth: 8,
    borderColor: "rgba(255, 107, 107, 0.3)",
    backgroundColor: "#000",
  },
  premiumCircleImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  premiumCircleGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  premiumCircleContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  premiumCircleTitle: {
    ...Typography.h2,
    color: "#FFF",
    textAlign: "center",
    fontSize: 28,
    marginBottom: Spacing.md,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  premiumScanIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  premiumScanText: {
    ...Typography.caption,
    color: "#FFF",
    fontWeight: "900",
    letterSpacing: 1,
  },
  resultBubble: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
  },
  resultBubbleLabel: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 4,
    color: "#FF6B6B",
    fontWeight: "800",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: 20,
  },
  horizontalScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.md,
    justifyContent: "space-between",
  },
  muscleCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.md * 2) / 2,
    height: 120,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
    marginHorizontal: Spacing.xs,
  },
  muscleImage: {
    ...StyleSheet.absoluteFillObject,
  },
  muscleGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: Spacing.md,
  },
  muscleName: {
    ...Typography.body,
    fontWeight: "700",
    color: "#FFF",
  },
  workoutCard: {
    width: SCREEN_WIDTH * 0.7,
    height: 160,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  workoutCardBlur: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "space-between",
  },
  workoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  workoutCardTitle: {
    ...Typography.h3,
    fontSize: 18,
    flex: 1,
    marginRight: Spacing.sm,
  },
  difficultyBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: "700",
  },
  workoutCardDescription: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  workoutCardMuscles: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  musclePill: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  musclePillText: {
    ...Typography.caption,
    fontSize: 10,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  aiChatCard: {
    height: 180,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  exerciseLibraryGradient: {
    padding: Spacing.xl,
    position: "relative",
  },
  exerciseLibraryContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseLibraryText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  exerciseLibraryBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: Spacing.sm,
  },
  exerciseLibraryBadgeText: {
    ...Typography.caption,
    fontWeight: "800",
    fontSize: 10,
  },
  exerciseLibraryTitle: {
    ...Typography.h2,
    color: "#FFF",
    marginBottom: 4,
  },
  exerciseLibrarySubtitle: {
    ...Typography.body,
    fontSize: 14,
  },
  exerciseLibraryPreview: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  previewCard: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseLibraryArrow: {
    position: "absolute",
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
});
