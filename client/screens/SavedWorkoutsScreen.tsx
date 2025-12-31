import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  FlatList,
  ListRenderItemInfo,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList, Workout } from "@/navigation/RootStackNavigator";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useRevenueCat } from "@/lib/revenuecat";

export default function SavedWorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isProUser } = useRevenueCat();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedWorkouts();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSavedWorkouts();
    }, [])
  );

  const loadSavedWorkouts = async () => {
    try {
      const savedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      if (savedWorkouts) {
        setWorkouts(JSON.parse(savedWorkouts));
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading saved workouts:", error);
      setIsLoading(false);
    }
  };

  const handleWorkoutPress = useCallback((workout: Workout, index: number) => {
    if (!isProUser && index >= 5) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Pro Feature",
        "You've reached the free limit of 5 saved workouts. Upgrade to Pro to save up to 100 workouts and access all 1,300+ exercises.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => navigation.navigate("Paywall") },
        ]
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate("WorkoutDetail", { workout });
  }, [navigation, isProUser]);

  const handleDelete = useCallback((id: string) => {
    const updated = workouts.filter(w => w.id !== id);
    setWorkouts(updated);
    AsyncStorage.setItem("savedWorkouts", JSON.stringify(updated));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [workouts]);

  const renderWorkoutCard = ({ item, index }: ListRenderItemInfo<Workout>) => {
    const isLocked = !isProUser && index >= 5;
    return (
    <Pressable
      style={[styles.workoutCard, isLocked && styles.workoutCardLocked]}
      onPress={() => handleWorkoutPress(item, index)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleContainer}>
          <ThemedText style={styles.cardTitle}>{item.name}</ThemedText>
          <ThemedText style={styles.cardDifficulty}>{item.difficulty}</ThemedText>
        </View>
        <View style={styles.cardActions}>
          {isLocked && (
            <View style={styles.lockBadge}>
              <Feather name="lock" size={14} color="#9D4EDD" />
            </View>
          )}
          <Pressable
            onPress={() => handleDelete(item.id)}
            hitSlop={8}
            style={styles.deleteButton}
          >
            <Feather name="trash-2" size={18} color={Colors.dark.accent} />
          </Pressable>
        </View>
      </View>

      <ThemedText style={styles.cardDescription}>{item.description}</ThemedText>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Feather name="target" size={14} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.metaText}>
            {item.muscleGroups.join(", ")}
          </ThemedText>
        </View>
        <View style={styles.metaItem}>
          <Feather name="tool" size={14} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.metaText}>
            {item.equipment.length} equip.
          </ThemedText>
        </View>
        <View style={styles.metaItem}>
          <Feather name="repeat" size={14} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.metaText}>
            {item.exercises.length} ex.
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
  };

  const emptyView = () => (
    <View style={styles.emptyContainer}>
      <Feather name="inbox" size={48} color={Colors.dark.textSecondary} />
      <ThemedText style={styles.emptyTitle}>No Saved Workouts</ThemedText>
      <ThemedText style={styles.emptySubtitle}>
        Discover workouts and save them to access later
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Feather name="chevron-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Saved Workouts</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={workouts}
        keyExtractor={(item, index) => (item as any).savedAt ? (item as any).savedAt.toString() : `${item.id}-${index}`}
        renderItem={renderWorkoutCard}
        contentContainerStyle={[
          styles.listContent,
          workouts.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={emptyView}
        scrollIndicatorInsets={{ right: 1 }}
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
  headerTitle: {
    ...Typography.h3,
    flex: 1,
    textAlign: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: Spacing.md,
    textAlign: "center",
  },
  emptySubtitle: {
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    textAlign: "center",
    maxWidth: 280,
  },
  workoutCard: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
    flexWrap: "wrap",
  },
  cardDifficulty: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  deleteButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  cardMeta: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  lockBadge: {
    backgroundColor: Colors.dark.accent + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  workoutCardLocked: {
    opacity: 0.6,
  },
});
