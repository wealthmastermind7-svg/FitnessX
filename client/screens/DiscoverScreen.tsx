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

import { BlurView } from "expo-blur";
import polyline from "@mapbox/polyline";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import ReadinessWidget from "@/components/ReadinessWidget";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import type { RootStackParamList, Workout } from "@/navigation/RootStackNavigator";
import { Image as ExpoImage } from "expo-image";
import { useStrava } from "@/lib/strava";
import Svg, { Polyline as SvgPolyline } from "react-native-svg";

import CommunityFeedScreen from "./CommunityFeedScreen";

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

const CATEGORIES = [
  "strength",
  "cardio",
  "mobility",
  "balance",
  "stretching",
  "plyometrics",
  "rehabilitation",
];

// Hardcoded muscle group images
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
          source={muscleImagePath}
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

function StravaActivityMapCard({ activity }: { activity: any }) {
  const MAP_WIDTH = SCREEN_WIDTH * 0.7;
  const MAP_HEIGHT = 120;
  
  const decodeAndNormalize = () => {
    if (!activity.map?.summary_polyline) return null;
    
    try {
      const decoded = polyline.decode(activity.map.summary_polyline);
      if (decoded.length < 2) return null;
      
      const lats = decoded.map(([lat]) => lat);
      const lngs = decoded.map(([, lng]) => lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      
      const padding = 10;
      const width = MAP_WIDTH - padding * 2;
      const height = MAP_HEIGHT - padding * 2;
      
      const points = decoded.map(([lat, lng]) => {
        const x = padding + ((lng - minLng) / (maxLng - minLng || 1)) * width;
        const y = padding + ((maxLat - lat) / (maxLat - minLat || 1)) * height;
        return `${x},${y}`;
      }).join(' ');
      
      return points;
    } catch (e) {
      return null;
    }
  };
  
  const pathPoints = decodeAndNormalize();
  
  const sportIcon = activity.sport_type === 'Run' ? 'wind' : 
                    activity.sport_type === 'Ride' ? 'compass' : 
                    activity.sport_type === 'Swim' ? 'droplet' : 'activity';
  
  return (
    <View style={styles.stravaMapCard}>
      <View style={styles.stravaMapContainer}>
        {pathPoints ? (
          <Svg width={MAP_WIDTH} height={MAP_HEIGHT}>
            <SvgPolyline
              points={pathPoints}
              fill="none"
              stroke="#FC4C02"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : (
          <View style={styles.stravaMapPlaceholder}>
            <Feather name={sportIcon} size={32} color="#FC4C02" />
          </View>
        )}
      </View>
      <View style={styles.stravaMapInfo}>
        <ThemedText style={styles.stravaMapName} numberOfLines={1}>{activity.name}</ThemedText>
        <View style={styles.stravaMapStats}>
          <View style={styles.stravaMapStat}>
            <Feather name="map-pin" size={12} color="#FC4C02" />
            <ThemedText style={styles.stravaMapStatText}>{(activity.distance / 1000).toFixed(1)}km</ThemedText>
          </View>
          <View style={styles.stravaMapStat}>
            <Feather name="clock" size={12} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.stravaMapStatText}>{Math.floor(activity.moving_time / 60)}min</ThemedText>
          </View>
          {activity.total_elevation_gain > 0 && (
            <View style={styles.stravaMapStat}>
              <Feather name="trending-up" size={12} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.stravaMapStatText}>{Math.round(activity.total_elevation_gain)}m</ThemedText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const scrollY = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<NavigationProp>();
  const { isConnected: isStravaConnected, activities: stravaActivities, isLoading: isStravaLoading } = useStrava();

  // Demo activities to show when not connected or no activities
  const demoActivities = [
    {
      id: 'demo-1',
      name: 'Morning Coastal Run',
      sport_type: 'Run',
      distance: 8500,
      moving_time: 2700,
      total_elevation_gain: 45,
      map: {
        summary_polyline: '|_~iFv~uVGY_@c@u@w@mAgAmBeBoCcCwDqDsEiEmFiFmGiGqHiHqIiIiJiJkKkKmLiLmMiMmNiNmOiOmPiPmQiQmRiRmSiSmTiTmUiUmViVmWiWmXiXmYiYmZiZm[i[m\\i\\m]i]m^i^m_i_m`i`maia'
      }
    },
    {
      id: 'demo-2',
      name: 'Mountain Peak Climb',
      sport_type: 'Ride',
      distance: 25400,
      moving_time: 5400,
      total_elevation_gain: 850,
      map: {
        summary_polyline: 's_~iFv~uV_@c@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@_@u@_@w@'
      }
    }
  ];

  const displayActivities = isStravaConnected && stravaActivities.length > 0 ? stravaActivities : demoActivities;

  const { data: generatedWorkouts, isLoading } = useQuery<Workout[]>({
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

  const parallaxTransform = scrollY.interpolate({
    inputRange: [-100, 0, 200],
    outputRange: [50, 0, -100],
    extrapolate: "clamp",
  });

  console.log("Strava State:", { isStravaConnected, activitiesCount: stravaActivities.length, isStravaLoading });

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
        {/* Premium Food Analysis Highlight */}
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

              {/* Floating Result Bubbles - Removed static values that don't match scan results */}
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
            <View style={styles.stravaSectionTitle}>
              <Feather name="compass" size={18} color="#FC4C02" />
              <ThemedText style={[styles.sectionTitle, { color: "#FC4C02" }]}>
                {isStravaConnected && stravaActivities.length > 0 ? "Strava Activities" : "Strava Performance"}
              </ThemedText>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("Main", { screen: "Profile" } as any);
              }}
            >
              <ThemedText style={styles.seeAllText}>
                {isStravaConnected ? "See All" : "Connect"}
              </ThemedText>
            </Pressable>
          </View>
          {!isStravaConnected && (
            <ThemedText style={[styles.stravaMapStatText, { marginLeft: Spacing.lg, marginBottom: Spacing.sm }]}>
              Sync your runs and rides to see interactive maps and stats
            </ThemedText>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {displayActivities.slice(0, 5).map((activity) => (
              <StravaActivityMapCard key={activity.id} activity={activity} />
            ))}
          </ScrollView>
        </View>

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
          {/* Micro-Habits Card */}
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

          {/* AI Coach Card */}
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

          {/* Generate Workout Plan Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("Main", { screen: "Workout" } as any);
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
                    Generate Plan
                  </ThemedText>
                  <ThemedText style={[styles.exerciseLibrarySubtitle, { color: "rgba(255,255,255,0.7)" }]}>
                    Create a personalized multi-week training program
                  </ThemedText>
                </View>
                <View style={styles.exerciseLibraryPreview}>
                  <View style={[styles.previewCard, { backgroundColor: 'rgba(157, 78, 221, 0.2)', borderWidth: 0 }]}>
                    <Feather name="calendar" size={32} color="#9D4EDD" />
                  </View>
                </View>
              </View>
              <View style={styles.exerciseLibraryArrow}>
                <Feather name="arrow-right" size={20} color="#9D4EDD" />
              </View>
            </View>
          </Pressable>

          {/* Nutrition Advice Card */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              navigation.navigate("Main", { screen: "AI" } as any);
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
                    Nutrition Advice
                  </ThemedText>
                  <ThemedText style={[styles.exerciseLibrarySubtitle, { color: "rgba(255,255,255,0.7)" }]}>
                    Get personalized nutrition recommendations for your goals
                  </ThemedText>
                </View>
                <View style={styles.exerciseLibraryPreview}>
                  <View style={[styles.previewCard, { backgroundColor: 'rgba(157, 78, 221, 0.2)', borderWidth: 0 }]}>
                    <Feather name="heart" size={32} color="#9D4EDD" />
                  </View>
                </View>
              </View>
              <View style={styles.exerciseLibraryArrow}>
                <Feather name="arrow-right" size={20} color="#9D4EDD" />
              </View>
            </View>
          </Pressable>

          {/* Micro-Habits Autopilot Card */}
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
                      NEW
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
        </ScrollView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Categories</ThemedText>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {CATEGORIES.map((category, index) => (
              <Pressable
                key={category}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate("ExerciseBrowser", { filterByCategory: category });
                }}
                style={({ pressed }) => [
                  styles.categoryCard,
                  pressed && { opacity: 0.8 }
                ]}
              >
                <BlurView intensity={40} tint="dark" style={styles.categoryBlur}>
                  <ThemedText style={styles.categoryName}>{category}</ThemedText>
                </BlurView>
              </Pressable>
            ))}
          </ScrollView>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Community Activity</ThemedText>
          </View>
          <CommunityFeedScreen isNested={true} />
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
    paddingTop: Spacing.lg,
  },
  heroTagline: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: Colors.dark.accent,
    marginBottom: Spacing.xs,
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    letterSpacing: -1,
    lineHeight: 60,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    fontWeight: "400",
    lineHeight: 24,
  },
  premiumHighlightContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  premiumCirclePressable: {
    width: SCREEN_WIDTH * 0.75,
    aspectRatio: 1,
  },
  premiumCircleOuter: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.4,
    overflow: 'visible',
    backgroundColor: '#1A1A1A',
    borderWidth: 4,
    borderColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  premiumCircleImage: {
    width: '100%',
    height: '100%',
    borderRadius: SCREEN_WIDTH * 0.4,
    opacity: 0.8,
  },
  premiumCircleGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: SCREEN_WIDTH * 0.4,
  },
  premiumCircleContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  premiumBadge: {
    display: 'none',
    position: 'absolute',
    top: 30,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'white',
  },
  premiumCircleTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: Spacing.md,
  },
  premiumScanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  premiumScanText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
  resultBubble: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  resultBubbleValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  resultBubbleLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    opacity: 0.8,
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
    fontSize: 22,
    fontWeight: "700",
    color: Colors.dark.text,
    letterSpacing: -0.3,
  },
  horizontalScroll: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  workoutCard: {
    width: SCREEN_WIDTH * 0.7,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  workoutCardBlur: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
  },
  workoutCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  workoutCardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    letterSpacing: -0.3,
    flex: 1,
    flexWrap: "wrap",
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
  categoryCard: {
    width: 140,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  categoryBlur: {
    padding: Spacing.md,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    textTransform: 'capitalize',
  },
  muscleCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    aspectRatio: 1,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
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
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    letterSpacing: -0.2,
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
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
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
  stravaSectionTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  seeAllText: {
    ...Typography.small,
    color: "#FC4C02",
    fontWeight: "600",
  },
  stravaMapCard: {
    width: SCREEN_WIDTH * 0.7,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(252, 76, 2, 0.2)",
  },
  stravaMapContainer: {
    height: 120,
    backgroundColor: "rgba(252, 76, 2, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  stravaMapPlaceholder: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(252, 76, 2, 0.08)",
  },
  stravaMapInfo: {
    padding: Spacing.md,
  },
  stravaMapName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  stravaMapStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  stravaMapStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stravaMapStatText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
});
