import React, { useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList, Workout } from "@/navigation/RootStackNavigator";
import { Image as ExpoImage } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Abs",
  "Obliques",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
];

// Map display names to RapidAPI muscle group names
const getMuscleApiName = (displayName: string): string => {
  const muscleMap: Record<string, string> = {
    "Quads": "quadriceps",
    "Hamstrings": "hamstring",
    "Glutes": "glutes",
    "Calves": "calf",
    "Obliques": "oblique",
  };
  return muscleMap[displayName] || displayName.toLowerCase();
};

const POPULAR_WORKOUTS = [
  {
    id: "1",
    name: "Push Day",
    description: "Chest, shoulders, and triceps",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    equipment: ["any"],
    difficulty: "Intermediate",
  },
  {
    id: "2",
    name: "Pull Day",
    description: "Back and biceps focus",
    muscleGroups: ["Back", "Biceps"],
    equipment: ["any"],
    difficulty: "Intermediate",
  },
  {
    id: "3",
    name: "Leg Day",
    description: "Complete lower body",
    muscleGroups: ["Quads", "Hamstrings", "Glutes", "Calves"],
    equipment: ["any"],
    difficulty: "Advanced",
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function MuscleCard({ muscle, index, navigation }: { muscle: string; index: number; navigation: NavigationProp }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const baseUrl = getApiUrl();
  const apiMuscleName = getMuscleApiName(muscle);
  const imageUrl = `${baseUrl}api/muscle-image?muscles=${apiMuscleName}&color=255,107,107`;

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

  // Gradient colors for fallback background
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
          source={{ uri: imageUrl }}
          style={[styles.muscleImage, { opacity: imageLoaded ? 1 : 0 }]}
          contentFit="contain"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            console.log(`Failed to load image for ${muscle}`);
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
      </Animated.View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<NavigationProp>();

  const { data: generatedWorkouts, isLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
  });

  const handleWorkoutPress = useCallback(async (workoutTemplate: typeof POPULAR_WORKOUTS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/generate-workout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          muscleGroups: workoutTemplate.muscleGroups,
          equipment: workoutTemplate.equipment,
          description: workoutTemplate.description,
        }),
      });
      
      if (response.ok) {
        const workout = await response.json();
        navigation.navigate("WorkoutDetail", { workout });
      }
    } catch (error) {
      console.error("Error generating workout:", error);
    }
  }, [navigation]);

  const parallaxTransform = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [50, 0, -100],
    extrapolate: "clamp",
  });

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
        <Animated.View
          style={[
            styles.heroSection,
            { transform: [{ translateY: parallaxTransform }] },
          ]}
        >
          <ThemedText style={styles.heroTitle}>FitForge</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Forge your perfect workout
          </ThemedText>
        </Animated.View>

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

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("AIChat");
          }}
          style={({ pressed }) => [
            styles.aiChatCard,
            pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
          ]}
        >
          <LinearGradient
            colors={["#9D4EDD", "#5A189A"] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.exerciseLibraryGradient}
          >
            <View style={styles.exerciseLibraryContent}>
              <View style={styles.exerciseLibraryText}>
                <View style={[styles.exerciseLibraryBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Feather name="cpu" size={14} color="#fff" />
                  <ThemedText style={[styles.exerciseLibraryBadgeText, { color: "#fff" }]}>
                    AI Powered
                  </ThemedText>
                </View>
                <ThemedText style={styles.exerciseLibraryTitle}>
                  AI Coach
                </ThemedText>
                <ThemedText style={[styles.exerciseLibrarySubtitle, { color: "rgba(255,255,255,0.8)" }]}>
                  Get personalized fitness advice powered by GPT-4
                </ThemedText>
              </View>
              <View style={styles.exerciseLibraryPreview}>
                <Feather name="message-circle" size={40} color="rgba(255,255,255,0.6)" />
              </View>
            </View>
            <View style={styles.exerciseLibraryArrow}>
              <Feather name="arrow-right" size={20} color="#fff" />
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Your Fitness Hub</ThemedText>
          </View>
          <View style={styles.featureGrid}>
            <Pressable
              style={styles.featureCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("WorkoutDiary");
              }}
            >
              <View style={[styles.featureIcon, { backgroundColor: Colors.dark.accent + "20" }]}>
                <Feather name="edit-3" size={24} color={Colors.dark.accent} />
              </View>
              <ThemedText style={styles.featureTitle}>Workout Diary</ThemedText>
              <ThemedText style={styles.featureSubtitle}>Log your sessions</ThemedText>
            </Pressable>

            <Pressable
              style={styles.featureCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Progress");
              }}
            >
              <View style={[styles.featureIcon, { backgroundColor: "#4ECDC420" }]}>
                <Feather name="trending-up" size={24} color="#4ECDC4" />
              </View>
              <ThemedText style={styles.featureTitle}>Progress</ThemedText>
              <ThemedText style={styles.featureSubtitle}>Track your gains</ThemedText>
            </Pressable>

            <Pressable
              style={styles.featureCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Nutrition");
              }}
            >
              <View style={[styles.featureIcon, { backgroundColor: "#FFB34720" }]}>
                <Feather name="coffee" size={24} color="#FFB347" />
              </View>
              <ThemedText style={styles.featureTitle}>Nutrition</ThemedText>
              <ThemedText style={styles.featureSubtitle}>Plan your meals</ThemedText>
            </Pressable>

            <Pressable
              style={styles.featureCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("ExerciseBrowser");
              }}
            >
              <View style={[styles.featureIcon, { backgroundColor: "#9D4EDD20" }]}>
                <Feather name="play-circle" size={24} color="#9D4EDD" />
              </View>
              <ThemedText style={styles.featureTitle}>Exercises</ThemedText>
              <ThemedText style={styles.featureSubtitle}>1,300+ demos</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Community & Coaches</ThemedText>
          </View>
          <View style={styles.socialRow}>
            <Pressable
              style={styles.socialCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Community");
              }}
            >
              <LinearGradient
                colors={["#1A1F2E", "#252B3D"] as any}
                style={styles.socialCardGradient}
              >
                <Feather name="users" size={28} color={Colors.dark.accent} />
                <ThemedText style={styles.socialCardTitle}>Community</ThemedText>
                <ThemedText style={styles.socialCardSubtitle}>Connect with athletes</ThemedText>
              </LinearGradient>
            </Pressable>

            <Pressable
              style={styles.socialCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("Coaches");
              }}
            >
              <LinearGradient
                colors={["#1A1F2E", "#252B3D"] as any}
                style={styles.socialCardGradient}
              >
                <Feather name="award" size={28} color="#FFB347" />
                <ThemedText style={styles.socialCardTitle}>Coaches</ThemedText>
                <ThemedText style={styles.socialCardSubtitle}>Hire a pro trainer</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Muscle Groups</ThemedText>
          </View>
          <View style={styles.muscleGrid}>
            {MUSCLE_GROUPS.map((muscle, index) => (
              <MuscleCard key={muscle} muscle={muscle} index={index} navigation={navigation} />
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
    backgroundColor: Colors.dark.backgroundRoot,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  heroSection: {
    marginBottom: Spacing.xxl,
    paddingTop: Spacing.xl,
  },
  heroTitle: {
    ...Typography.display,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    ...Typography.h3,
    color: Colors.dark.textSecondary,
    fontWeight: "400",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  horizontalScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  workoutCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  workoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  workoutCardTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  difficultyBadge: {
    backgroundColor: Colors.dark.accent + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  difficultyText: {
    ...Typography.small,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  workoutCardDescription: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  workoutCardMuscles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  musclePill: {
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  musclePillText: {
    ...Typography.small,
    color: Colors.dark.text,
  },
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  muscleCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    aspectRatio: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  muscleImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  muscleGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    justifyContent: "flex-end",
    height: "50%",
  },
  muscleName: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  exerciseLibraryCard: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  exerciseLibraryGradient: {
    padding: Spacing.lg,
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
    gap: Spacing.xs,
    backgroundColor: Colors.dark.accent + "20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
    marginBottom: Spacing.sm,
  },
  exerciseLibraryBadgeText: {
    ...Typography.small,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  exerciseLibraryTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  exerciseLibrarySubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  exerciseLibraryPreview: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  previewStack: {
    width: 60,
    height: 60,
    position: "relative",
  },
  previewCard: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  previewCard1: {
    top: 0,
    left: 0,
    zIndex: 2,
  },
  previewCard2: {
    bottom: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: "#9D4EDD20",
  },
  exerciseLibraryArrow: {
    position: "absolute",
    right: Spacing.lg,
    bottom: Spacing.lg,
  },
  aiChatCard: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  featureCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  featureSubtitle: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  socialRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  socialCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  socialCardGradient: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  socialCardTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  socialCardSubtitle: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
});
