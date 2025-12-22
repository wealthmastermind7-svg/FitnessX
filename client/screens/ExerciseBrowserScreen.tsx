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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { api, getExerciseImageUrl, ExerciseDBExercise } from "@/lib/api";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

type RoutePropType = RouteProp<RootStackParamList, "ExerciseBrowser">;

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

// Map display names from DiscoverScreen to ExerciseDB body part names
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBodyPart, setSelectedBodyPart] = useState(
    route.params?.filterByMuscle ? normalizeBodyPartName(route.params.filterByMuscle) : "all"
  );
  const [refreshing, setRefreshing] = useState(false);

  const queryKey = useMemo(() => {
    if (searchQuery.trim()) {
      return ["/api/exercises/name", searchQuery.trim()];
    }
    if (selectedBodyPart !== "all") {
      return ["/api/exercises/bodyPart", selectedBodyPart];
    }
    return ["/api/exercises"];
  }, [searchQuery, selectedBodyPart]);

  const {
    data: exercises,
    isLoading,
    refetch,
    error,
  } = useQuery<ExerciseDBExercise[]>({
    queryKey,
    queryFn: async () => {
      if (searchQuery.trim()) {
        return api.exercises.search(searchQuery.trim());
      } else if (selectedBodyPart !== "all") {
        return api.exercises.getByBodyPart(selectedBodyPart);
      }
      return api.exercises.list();
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleExercisePress = (exercise: ExerciseDBExercise, index: number) => {
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

  const renderExerciseCard = ({ item, index }: { item: ExerciseDBExercise; index: number }) => {
    const imageUrl = getExerciseImageUrl(item.id, 180);
    console.log(`[ExerciseBrowserScreen] Loading image for ${item.id}: ${imageUrl}`);
    return (
      <Pressable
        onPress={() => handleExercisePress(item, index)}
        style={({ pressed }) => [
          styles.exerciseCard,
          pressed && styles.exerciseCardPressed,
        ]}
      >
      <View style={styles.exerciseImageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.exerciseImage}
          contentFit="cover"
          transition={200}
          placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
          onError={(error) => {
            console.error(`[ExerciseBrowserScreen] Image load FAILED for ${item.id}:`, imageUrl, error);
          }}
          onLoadStart={() => {
            console.log(`[ExerciseBrowserScreen] Image loading START: ${item.id}`);
          }}
          onLoad={() => {
            console.log(`[ExerciseBrowserScreen] Image loaded SUCCESS: ${item.id}`);
          }}
        />
        <View style={styles.exerciseOverlay}>
          <View style={styles.targetBadge}>
            <ThemedText style={styles.targetBadgeText}>{item.target}</ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.exerciseInfo}>
        <ThemedText style={styles.exerciseName} numberOfLines={2}>
          {item.name}
        </ThemedText>
        <View style={styles.exerciseMeta}>
          <View style={styles.metaItem}>
            <Feather name="target" size={12} color={Colors.dark.accent} />
            <ThemedText style={styles.metaText}>{item.bodyPart}</ThemedText>
          </View>
          <View style={styles.metaItem}>
            <Feather name="tool" size={12} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.metaText}>{item.equipment}</ThemedText>
          </View>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
    </Pressable>
    );
  };

  const ListHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color={Colors.dark.textSecondary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search 1,300+ exercises..."
          placeholderTextColor={Colors.dark.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSearchQuery("");
            }}
          >
            <Feather name="x" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bodyPartScroll}
      >
        {BODY_PARTS.map((part) => (
          <Pressable
            key={part.id}
            onPress={() => handleBodyPartSelect(part.id)}
            style={[
              styles.bodyPartChip,
              selectedBodyPart === part.id && styles.bodyPartChipSelected,
            ]}
          >
            <Feather
              name={part.icon as any}
              size={14}
              color={
                selectedBodyPart === part.id ? "#FFF" : Colors.dark.textSecondary
              }
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
        {selectedBodyPart !== "all" && (
          <Pressable
            onPress={() => handleBodyPartSelect("all")}
            style={styles.clearFilter}
          >
            <ThemedText style={styles.clearFilterText}>Clear filter</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );

  const ListEmpty = () => {
    const errorMessage = error ? String(error).toLowerCase() : "";
    const isApiKeyError = errorMessage.includes("api key") || errorMessage.includes("rapidapi");
    
    return (
      <View style={styles.emptyContainer}>
        {isLoading ? (
          <>
            <ActivityIndicator size="large" color={Colors.dark.accent} />
            <ThemedText style={styles.emptySubtitle}>Loading exercises...</ThemedText>
          </>
        ) : error ? (
          <>
            <Feather name="alert-circle" size={48} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.emptyTitle}>Unable to load exercises</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              {isApiKeyError 
                ? "Exercise database is temporarily unavailable. Check your API configuration."
                : "Check your connection and try again"}
            </ThemedText>
            <Pressable onPress={onRefresh} style={styles.retryButton}>
              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
            </Pressable>
          </>
        ) : (
          <>
            <Feather name="search" size={48} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.emptyTitle}>No exercises found</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Try a different search term or filter
            </ThemedText>
          </>
        )}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.headerButton}
        >
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Exercise Library</ThemedText>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate("Main");
          }}
          style={styles.headerButton}
        >
          <Feather name="home" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>
      <FlatList
        data={exercises || []}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
            progressViewOffset={0}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  headerButton: {
    padding: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    flex: 1,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    color: Colors.dark.text,
    fontSize: 16,
  },
  bodyPartScroll: {
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  bodyPartChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.xs,
  },
  bodyPartChipSelected: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
  },
  bodyPartText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  bodyPartTextSelected: {
    color: "#FFF",
    fontWeight: "600",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultsCount: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  clearFilter: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  clearFilterText: {
    ...Typography.small,
    color: Colors.dark.accent,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  exerciseCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  exerciseImageContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundDefault,
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xs,
  },
  targetBadge: {
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  targetBadgeText: {
    fontSize: 10,
    color: "#FFF",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: Spacing.xs,
  },
  exerciseMeta: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textTransform: "capitalize",
  },
  separator: {
    height: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 3,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.body,
    color: "#FFF",
    fontWeight: "600",
  },
});
