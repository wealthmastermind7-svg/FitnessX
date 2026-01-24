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
import { GlassView } from "expo-glass-effect";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList, Workout } from "@/navigation/RootStackNavigator";
import { Image as ExpoImage } from "expo-image";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MUSCLE_GROUPS = [
  { name: "Chest", sets: 12, progress: 0.75 },
  { name: "Back", sets: 8, progress: 0.4 },
  { name: "Shoulders", sets: 10, progress: 0.6 },
  { name: "Arms", sets: 14, progress: 0.9 },
  { name: "Legs", sets: 16, progress: 0.8 },
];

const muscleGroupImages: Record<string, any> = {
  "Chest": require("../assets/muscle-groups/chest.jpeg"),
  "Back": require("../assets/muscle-groups/back.jpeg"),
  "Shoulders": require("../assets/muscle-groups/shoulders.jpeg"),
  "Arms": require("../assets/muscle-groups/arms.jpeg"),
  "Legs": require("../assets/muscle-groups/legs.jpeg"),
};

const POPULAR_WORKOUTS = [
  {
    id: "1",
    name: "Push Day",
    description: "Chest, shoulders, and triceps focus.",
    muscleGroups: ["Chest", "Shoulders", "Triceps"],
    equipment: ["Dumbbell", "Barbell"],
    difficulty: "Intermediate",
    duration: "45 MIN",
    calories: "520 KCAL",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Chest" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Chest" },
      { name: "Overhead Press", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Shoulders" },
      { name: "Lateral Raises", sets: 3, reps: "12-15", restSeconds: 45, muscleGroup: "Shoulders" },
      { name: "Tricep Pushdowns", sets: 3, reps: "12-15", restSeconds: 60, muscleGroup: "Triceps" },
    ],
  },
  {
    id: "2",
    name: "Pull Day",
    description: "Back and biceps focus",
    muscleGroups: ["Back", "Biceps"],
    equipment: ["Dumbbell", "Barbell", "Cable"],
    difficulty: "Advanced",
    duration: "60 MIN",
    calories: "680 KCAL",
    exercises: [
      { name: "Barbell Rows", sets: 4, reps: "8-10", restSeconds: 90, muscleGroup: "Back" },
      { name: "Lat Pulldown", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" },
      { name: "Seated Cable Row", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Back" },
      { name: "Barbell Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" },
      { name: "Hammer Curls", sets: 3, reps: "10-12", restSeconds: 60, muscleGroup: "Biceps" },
    ],
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function MuscleCard({ item, navigation }: { item: typeof MUSCLE_GROUPS[0]; navigation: NavigationProp }) {
  const muscleImagePath = muscleGroupImages[item.name];
  
  return (
    <Pressable onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      navigation.navigate("ExerciseBrowser", { filterByMuscle: item.name });
    }}>
      <GlassView glassEffectStyle="regular" style={styles.muscleCard}>
        <View style={styles.muscleProgressContainer}>
          <ExpoImage
            source={muscleImagePath}
            style={styles.muscleAnatomyImage}
            contentFit="contain"
          />
          <View style={styles.progressRing}>
             <ThemedText style={styles.progressText}>{Math.round(item.progress * 100)}%</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.muscleCardTitle}>{item.name}</ThemedText>
        <ThemedText style={styles.muscleCardSub}>{item.sets} SETS WEEKLY</ThemedText>
      </GlassView>
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <GlassView glassEffectStyle="regular" style={styles.workoutCard}>
          <View style={styles.workoutCardBadge}>
            <ThemedText style={styles.workoutCardBadgeText}>{workout.difficulty.toUpperCase()}</ThemedText>
          </View>
          <View>
            <ThemedText style={styles.workoutCardTitle}>{workout.name}</ThemedText>
            <ThemedText style={styles.workoutCardDesc}>{workout.description}</ThemedText>
          </View>
          <View style={styles.workoutStatsRow}>
            <GlassView glassEffectStyle="clear" style={styles.statPill}>
              <ThemedText style={styles.statPillText}>{workout.duration}</ThemedText>
            </GlassView>
            <GlassView glassEffectStyle="clear" style={styles.statPill}>
              <ThemedText style={styles.statPillText}>{workout.calories}</ThemedText>
            </GlassView>
          </View>
        </GlassView>
      </Animated.View>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();

  const handleWorkoutPress = useCallback((workoutTemplate: typeof POPULAR_WORKOUTS[0]) => {
    const workout = {
      id: workoutTemplate.id,
      name: workoutTemplate.name,
      description: workoutTemplate.description,
      muscleGroups: workoutTemplate.muscleGroups,
      equipment: workoutTemplate.equipment,
      exercises: workoutTemplate.exercises,
      difficulty: workoutTemplate.difficulty,
    } as Workout;
    
    navigation.navigate("WorkoutDetail", { workout });
  }, [navigation]);

  const { data: bodyParts, isLoading: isLoadingBodyParts } = useQuery<string[]>({
    queryKey: [getApiUrl() + "api/exercises/bodyPartList"],
  });

  const muscleGroups = bodyParts?.slice(0, 5).map((part, index) => ({
    name: part.charAt(0).toUpperCase() + part.slice(1),
    sets: 10 + index * 2,
    progress: 0.4 + (index * 0.1),
  })) || MUSCLE_GROUPS;

  return (
    <ThemedView style={styles.container}>
      <Image 
        source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBme9Gva_wwuvfxHgjWuuqJFLGiNpOZigc3wPpjYth5CwmcZVZVsgPJmu5w_KCDw-Uh8T9liHT9jIATxZlk6_l4rrShbOO_Y5BouTR2Yh4vq-bmOWGD4T5JHSkYTS1wdDOwYFNMlsLwA2RaVjiiRLCETlQQjvQXr5u02yjcscQpYtv9_h9VRSiAbmBE8ZMsy5IcJU_EEevGYFQXDvQSS_OeJIV1cOcEjGSf0ZozLWWuMlpHrAxf4yrYHtHFkKDWf3j99SKRYeOU_YiQ" }}
        style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
        blurRadius={10}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText style={styles.brandTitle}>FITFORGE PREMIUM</ThemedText>
        <View style={styles.headerRight}>
          <GlassView glassEffectStyle="regular" style={styles.iconButton}>
            <Feather name="bell" size={18} color="#fff" />
          </GlassView>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>JD</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <ThemedText style={styles.dateText}>Monday, June 20</ThemedText>
          <ThemedText style={styles.heroTitle}>DISCOVER</ThemedText>
          <ThemedText style={styles.heroSubtitle}>
            Elite performance starts with precision planning.
          </ThemedText>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Popular Workouts</ThemedText>
            <Pressable onPress={() => (navigation as any).navigate("Main", { screen: "Generate" })}>
              <ThemedText style={styles.seeAll}>SEE ALL</ThemedText>
            </Pressable>
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
          style={styles.aiCoachCardContainer}
        >
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(0,0,0,0.3)"]}
            style={styles.aiCoachCard}
          >
            <View style={styles.aiCoachBadgeRow}>
              <View style={styles.aiEliteBadge}>
                <ThemedText style={styles.aiEliteText}>AI ELITE</ThemedText>
              </View>
              <ThemedText style={styles.aiCoachSub}>ACTIVE NEURAL LINK</ThemedText>
            </View>
            <ThemedText style={styles.aiCoachTitle}>AI COACH</ThemedText>
            <ThemedText style={styles.aiCoachDesc}>Personalized recovery insights</ThemedText>
          </LinearGradient>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Muscle Groups</ThemedText>
            <View style={styles.pageIndicator}>
              <View style={styles.indicatorActive} />
              <View style={styles.indicatorInactive} />
              <View style={styles.indicatorInactive} />
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {muscleGroups.map((item) => (
              <MuscleCard key={item.name} item={item} navigation={navigation} />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  brandTitle: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 3,
    color: "rgba(255,255,255,0.4)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "800",
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  heroSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl * 1.5,
  },
  dateText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontSize: 64,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -2,
    lineHeight: 64,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    marginTop: Spacing.sm,
    maxWidth: "80%",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  seeAll: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 1,
  },
  horizontalScroll: {
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  workoutCard: {
    width: SCREEN_WIDTH * 0.75,
    height: 380,
    borderRadius: 40,
    padding: Spacing.xl,
    justifyContent: "space-between",
  },
  workoutCardBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  workoutCardBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 1,
  },
  workoutCardTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
  },
  workoutCardDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  workoutStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  statPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statPillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
  },
  aiCoachCardContainer: {
    marginBottom: Spacing.xl,
  },
  aiCoachCard: {
    padding: 30,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  aiCoachBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  aiEliteBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  aiEliteText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "900",
  },
  aiCoachSub: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
  },
  aiCoachTitle: {
    fontSize: 48,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    lineHeight: 48,
    marginBottom: 8,
  },
  aiCoachDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  muscleCard: {
    width: 200,
    padding: 24,
    borderRadius: 40,
    alignItems: "center",
  },
  muscleProgressContainer: {
    width: "100%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  muscleAnatomyImage: {
    width: "80%",
    height: "80%",
    position: "absolute",
    opacity: 0.8,
  },
  progressRing: {
    width: "100%",
    height: "100%",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  progressText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
  },
  muscleCardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  muscleCardSub: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
  },
  pageIndicator: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  indicatorActive: {
    width: 30,
    height: 2,
    backgroundColor: "#fff",
    borderRadius: 1,
  },
  indicatorInactive: {
    width: 8,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 1,
  },
});

