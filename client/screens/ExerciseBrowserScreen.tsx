import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { RootStackParamList, ExerciseDBExercise } from "@/navigation/RootStackNavigator";
import { useRevenueCat } from "@/lib/revenuecat";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - Spacing.lg * 3) / 2;

const BODY_PARTS = [
  { id: "all", label: "All", icon: "grid" },
  { id: "chest", label: "Chest", icon: "activity" },
  { id: "back", label: "Back", icon: "anchor" },
  { id: "shoulders", label: "Shoulders", icon: "chevrons-up" },
  { id: "upper arms", label: "Arms", icon: "zap" },
  { id: "lower arms", label: "Forearms", icon: "edit-3" },
  { id: "upper legs", label: "Legs", icon: "trending-up" },
  { id: "lower legs", label: "Calves", icon: "minus" },
  { id: "waist", label: "Core", icon: "circle" },
  { id: "cardio", label: "Cardio", icon: "heart" },
];

const normalizeBodyPartName = (name: string): string => {
  const nameMap: Record<string, string> = {
    "arms": "upper arms",
    "legs": "upper legs",
    "calves": "lower legs",
    "forearms": "lower arms",
    "core": "waist",
  };
  return nameMap[name.toLowerCase()] || name.toLowerCase();
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ExerciseBrowserScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RoutePropType>();
  const baseUrl = getApiUrl();
  const { isProUser } = useRevenueCat();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState(
    route.params?.filterByMuscle ? normalizeBodyPartName(route.params.filterByMuscle) : "all"
  );
  const [refreshing, setRefreshing] = useState(false);

  const exerciseLimit = isProUser ? 1000 : 100;

  const fetchUrl = useMemo(() => {
    if (searchQuery.trim()) {
      return `${baseUrl}api/exercises/name/${encodeURIComponent(searchQuery.trim())}?limit=${exerciseLimit}`;
    }
    if (selectedBodyPart !== "all") {
      return `${baseUrl}api/exercises/bodyPart/${encodeURIComponent(selectedBodyPart)}?limit=${exerciseLimit}`;
    }
    return `${baseUrl}api/exercises?limit=${exerciseLimit}`;
  }, [baseUrl, searchQuery, selectedBodyPart, exerciseLimit]);

  const {
    data: exercises,
    isLoading,
    refetch,
    error,
  } = useQuery<ExerciseDBExercise[]>({
    queryKey: [fetchUrl],
    staleTime: 5 * 60 * 1000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleExercisePress = (exercise: ExerciseDBExercise, index: number) => {
    if (!isProUser && index >= 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Pro Feature",
        "Free users can browse the first 10 exercises. Upgrade to Pro to access all 1,300+ exercises and generate and save up to 100 workouts.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => navigation.navigate("Paywall") },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("ExerciseDetail", { 
      exercise, 
      exercises,
      exerciseIndex: index 
    });
  };

  const handleBodyPartSelect = (bodyPart: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedBodyPart(bodyPart);
    setSearchQuery("");
  };

  const getExerciseImageUrl = (exerciseId: string, resolution: string = "360") => {
    return `${baseUrl}api/exercises/image/${exerciseId}?resolution=${resolution}`;
  };

  const renderExerciseCard = ({ item, index }: { item: ExerciseDBExercise; index: number }) => {
    const isLocked = !isProUser && index >= 10;
    return (
      <Pressable
        onPress={() => handleExercisePress(item, index)}
        style={({ pressed }) => [
          styles.exerciseCard,
          pressed && styles.exerciseCardPressed,
        ]}
      >
        <BlurView intensity={20} tint="dark" style={styles.glassCard}>
          <View style={styles.exerciseImageContainer}>
            <Image
              source={{ uri: getExerciseImageUrl(item.id, "360") }}
              style={[styles.exerciseImage, isLocked && styles.exerciseImageLocked]}
              contentFit="cover"
              transition={200}
              placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
            />
            <LinearGradient
              colors={["transparent", "rgba(13, 2, 33, 0.8)"]}
              style={styles.imageOverlay}
            />
            {isLocked && (
              <View style={styles.lockOverlay}>
                <BlurView intensity={30} tint="dark" style={styles.lockBlur}>
                  <Feather name="lock" size={24} color="#9D4EDD" />
                </BlurView>
              </View>
            )}
            <View style={styles.targetBadge}>
              <ThemedText style={styles.targetBadgeText}>{item.target}</ThemedText>
            </View>
          </View>
          <View style={styles.exerciseInfo}>
            <ThemedText style={styles.exerciseName} numberOfLines={2}>
              {item.name}
            </ThemedText>
            <View style={styles.exerciseMeta}>
              <Feather name="activity" size={12} color="#9D4EDD" />
              <ThemedText style={styles.metaText}>{item.bodyPart}</ThemedText>
            </View>
          </View>
        </BlurView>
      </Pressable>
    );
  };

  const ListHeader = () => (
    <View style={styles.listHeader}>
      <BlurView intensity={30} tint="dark" style={styles.searchBlur}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="rgba(255,255,255,0.6)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search 1,300+ exercises..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </BlurView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bodyPartScroll}
      >
        {BODY_PARTS.map((part) => (
          <Pressable
            key={part.id}
            onPress={() => handleBodyPartSelect(part.id)}
            style={({ pressed }) => [
              styles.bodyPartChip,
              selectedBodyPart === part.id && styles.bodyPartChipSelected,
              pressed && { scale: 0.95 },
            ]}
          >
            {selectedBodyPart === part.id ? (
              <LinearGradient
                colors={["#9D4EDD", "#5A189A"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            )}
            <Feather
              name={part.icon as any}
              size={14}
              color={selectedBodyPart === part.id ? "#FFF" : "rgba(255,255,255,0.6)"}
            />
            <ThemedText
              style={[
                styles.bodyPartText,
                selectedBodyPart === part.id && styles.bodyPartTextSelected,
              ]}
            >
              {part.label}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.resultsHeader}>
        <ThemedText style={styles.resultsCount}>
          {exercises?.length || 0} exercises found
        </ThemedText>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={["#0D0221", "#1A0B2E"]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Feather name="chevron-left" size={28} color="#FFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Discover</ThemedText>
        <View style={styles.headerButton} />
      </View>

      <FlatList
        data={exercises || []}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#9D4EDD" />
            ) : (
              <ThemedText style={styles.emptyText}>No exercises found</ThemedText>
            )}
          </View>
        )}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9D4EDD"
          />
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h2,
    color: "#FFF",
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  listHeader: {
    marginBottom: Spacing.lg,
  },
  searchBlur: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    height: 54,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: "#FFF",
    fontSize: 16,
  },
  bodyPartScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  bodyPartChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: Spacing.xs,
  },
  bodyPartChipSelected: {
    borderColor: "#9D4EDD",
  },
  bodyPartText: {
    ...Typography.small,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
  },
  bodyPartTextSelected: {
    color: "#FFF",
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  exerciseCard: {
    width: COLUMN_WIDTH,
  },
  exerciseCardPressed: {
    transform: [{ scale: 0.97 }],
  },
  glassCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  exerciseImageContainer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseImageLocked: {
    opacity: 0.4,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  lockBlur: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  targetBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(157, 78, 221, 0.8)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  targetBadgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "700",
    textTransform: "uppercase",
  },
  exerciseInfo: {
    padding: Spacing.sm,
  },
  exerciseName: {
    fontSize: 14,
    color: "#FFF",
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    textTransform: "capitalize",
  },
  resultsHeader: {
    marginTop: Spacing.sm,
  },
  resultsCount: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
  },
  emptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 16,
  },
});
