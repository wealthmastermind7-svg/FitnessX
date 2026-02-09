import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography, Gradients } from "@/constants/theme";
import { useRevenueCat } from "@/lib/revenuecat";

import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';

interface UserProfile {
  displayName: string;
  experienceLevel: string;
  preferredUnits: "metric" | "imperial";
}

interface WorkoutStats {
  totalWorkouts: number;
  favoriteMuscle: string;
  currentStreak: number;
}

interface MuscleDistribution {
  back: number;
  chest: number;
  core: number;
  legs: number;
  arms: number;
}

interface SavedWorkout {
  id: string;
  name: string;
  savedAt: string;
  muscleGroups: string[];
  exercises: Array<{
    name: string;
    muscleGroup: string;
  }>;
}

interface HealthSyncSettings {
  appleHealth: boolean;
  googleFit: boolean;
  syncEnabled: boolean;
}

const HEALTH_SYNC_BLUE = "#FF6B6B";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}) {
  return (
    <Pressable
      style={styles.settingsRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsRowLeft}>
        <View style={styles.settingsIconContainer}>
          <Feather name={icon} size={20} color="#FF6B6B" />
        </View>
        <ThemedText style={styles.settingsLabel}>{label}</ThemedText>
      </View>
      <View style={styles.settingsRowRight}>
        {value ? (
          <ThemedText style={styles.settingsValue}>{value}</ThemedText>
        ) : null}
        {showChevron && (
          <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
        )}
      </View>
    </Pressable>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: keyof typeof Feather.glyphMap }) {
  return (
    <View style={styles.statCard}>
      <Feather name={icon} size={24} color="#FF6B6B" style={{ marginBottom: Spacing.sm }} />
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
    </View>
  );
}

function RadarChart({ data }: { data: MuscleDistribution }) {
  const size = 300;
  const center = size / 2;
  const radius = (size / 2) - 50;
  const levels = 5;
  
  const axes = [
    { key: 'back', label: 'Back' },
    { key: 'chest', label: 'Chest' },
    { key: 'core', label: 'Core' },
    { key: 'legs', label: 'Legs' },
    { key: 'arms', label: 'Arms' },
  ];
  
  const angleStep = (Math.PI * 2) / axes.length;
  
  // Calculate points for a value at a certain radius
  const getPoint = (val: number, r: number, i: number) => {
    const angle = i * angleStep - Math.PI / 2;
    const distance = (val / 100) * r;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Grid levels
  const gridPolygons = Array.from({ length: levels }).map((_, levelIndex) => {
    const r = (radius / levels) * (levelIndex + 1);
    const points = axes.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');
    return points;
  });

  // Data points
  const dataPoints = axes.map((axis, i) => {
    const val = data[axis.key as keyof MuscleDistribution] || 10; // Min value for visibility
    const point = getPoint(Math.max(val, 15), radius, i);
    return `${point.x},${point.y}`;
  }).join(' ');

  return (
    <View style={styles.radarContainer}>
      <Svg height={size} width={size}>
        {/* Grid */}
        {gridPolygons.map((points, i) => (
          <Polygon
            key={i}
            points={points}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />
        ))}
        
        {/* Axes */}
        {axes.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <Line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Area */}
        <Polygon
          points={dataPoints}
          fill="rgba(255, 107, 107, 0.3)"
          stroke="#FF6B6B"
          strokeWidth="2"
        />

        {/* Labels */}
        {axes.map((axis, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = radius + 30;
          const x = center + labelR * Math.cos(angle);
          const y = center + labelR * Math.sin(angle);
          
          return (
            <SvgText
              key={i}
              x={x}
              y={y}
              fill={Colors.dark.textSecondary}
              fontSize="12"
              fontWeight="600"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {axis.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isProUser, isLoading: isRevenueCatLoading } = useRevenueCat();
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "Athlete",
    experienceLevel: "Intermediate",
    preferredUnits: "metric",
  });
  const [stats, setStats] = useState<WorkoutStats>({
    totalWorkouts: 0,
    favoriteMuscle: "None yet",
    currentStreak: 0,
  });
  const [healthSync, setHealthSync] = useState<HealthSyncSettings>({
    appleHealth: false,
    googleFit: false,
    syncEnabled: false,
  });
  const [workoutDates, setWorkoutDates] = useState<number[]>([]);
  const [muscleDistribution, setMuscleDistribution] = useState<MuscleDistribution>({
    back: 0,
    chest: 0,
    core: 0,
    legs: 0,
    arms: 0,
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [exerciseRecords, setExerciseRecords] = useState({
    heaviestWeight: "-",
    best1RM: "-",
    bestSetVolume: "-",
    bestSession: "-",
  });

  const [isPRModalVisible, setIsPRModalVisible] = useState(false);

  useEffect(() => {
    loadProfile();
    loadStats();
    loadHealthSyncSettings();
    loadWorkoutData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
      loadWorkoutData();
      loadExerciseRecords();
    }, [])
  );

  const loadExerciseRecords = async () => {
    try {
      const savedRecords = await AsyncStorage.getItem("exerciseRecords");
      if (savedRecords) {
        const records = JSON.parse(savedRecords);
        setExerciseRecords({
          heaviestWeight: records.heaviestWeight ? `${records.heaviestWeight}${profile.preferredUnits === "metric" ? "kg" : "lbs"}` : "-",
          best1RM: records.best1RM ? `${records.best1RM}${profile.preferredUnits === "metric" ? "kg" : "lbs"}` : "-",
          bestSetVolume: records.bestSetVolume ? `${records.bestSetVolume}${profile.preferredUnits === "metric" ? "kg" : "lbs"}` : "-",
          bestSession: records.bestSession ? `${records.bestSession} exercises` : "-",
        });
      }
    } catch (error) {
      console.error("Error loading exercise records:", error);
    }
  };

  const loadWorkoutData = async () => {
    try {
      const savedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      const workouts: SavedWorkout[] = savedWorkouts ? JSON.parse(savedWorkouts) : [];
      
      const now = new Date();
      const currentMonthDates: number[] = [];
      const muscleCount: Record<string, number> = {
        back: 0,
        chest: 0,
        core: 0,
        legs: 0,
        arms: 0,
      };

      workouts.forEach((workout) => {
        if (workout.savedAt) {
          const workoutDate = new Date(workout.savedAt);
          if (
            workoutDate.getMonth() === now.getMonth() &&
            workoutDate.getFullYear() === now.getFullYear()
          ) {
            const dayOfMonth = workoutDate.getDate();
            if (!currentMonthDates.includes(dayOfMonth - 1)) {
              currentMonthDates.push(dayOfMonth - 1);
            }
          }
        }

        const muscleGroups = workout.muscleGroups || [];
        muscleGroups.forEach((muscle) => {
          const lowerMuscle = muscle.toLowerCase();
          if (lowerMuscle.includes("back") || lowerMuscle.includes("lats")) {
            muscleCount.back++;
          } else if (lowerMuscle.includes("chest") || lowerMuscle.includes("pec")) {
            muscleCount.chest++;
          } else if (lowerMuscle.includes("core") || lowerMuscle.includes("abs") || lowerMuscle.includes("abdominal")) {
            muscleCount.core++;
          } else if (lowerMuscle.includes("leg") || lowerMuscle.includes("quad") || lowerMuscle.includes("hamstring") || lowerMuscle.includes("glute") || lowerMuscle.includes("calf")) {
            muscleCount.legs++;
          } else if (lowerMuscle.includes("arm") || lowerMuscle.includes("bicep") || lowerMuscle.includes("tricep") || lowerMuscle.includes("shoulder")) {
            muscleCount.arms++;
          }
        });
      });

      setWorkoutDates(currentMonthDates);

      const totalMuscleHits = Object.values(muscleCount).reduce((a, b) => a + b, 0);
      if (totalMuscleHits > 0) {
        setMuscleDistribution({
          back: Math.round((muscleCount.back / totalMuscleHits) * 100),
          chest: Math.round((muscleCount.chest / totalMuscleHits) * 100),
          core: Math.round((muscleCount.core / totalMuscleHits) * 100),
          legs: Math.round((muscleCount.legs / totalMuscleHits) * 100),
          arms: Math.round((muscleCount.arms / totalMuscleHits) * 100),
        });
      }
    } catch (error) {
      console.error("Error loading workout data:", error);
    }
  };

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem("userProfile");
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadStats = async () => {
    try {
      const savedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      const workoutsList = savedWorkouts ? JSON.parse(savedWorkouts) : [];
      const actualWorkoutCount = workoutsList.length;

      const savedStats = await AsyncStorage.getItem("workoutStats");
      const stats = savedStats ? JSON.parse(savedStats) : { totalWorkouts: 0, favoriteMuscle: "None yet", currentStreak: 0 };
      
      stats.totalWorkouts = actualWorkoutCount;
      setStats(stats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadHealthSyncSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem("healthSyncSettings");
      if (settings) {
        setHealthSync(JSON.parse(settings));
      }
    } catch (error) {
      console.error("Error loading health sync settings:", error);
    }
  };

  const saveProfile = async (newProfile: UserProfile) => {
    try {
      await AsyncStorage.setItem("userProfile", JSON.stringify(newProfile));
      setProfile(newProfile);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const handleNameChange = useCallback(() => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "Display Name",
        "Enter your name",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Save",
            onPress: (name?: string) => {
              if (name && name.trim()) {
                saveProfile({ ...profile, displayName: name.trim() });
              }
            },
          },
        ],
        "plain-text",
        profile.displayName
      );
    } else {
      const levels = ["Athlete", "Champion", "Legend", "Warrior"];
      const currentIndex = levels.indexOf(profile.displayName);
      const nextIndex = (currentIndex + 1) % levels.length;
      saveProfile({ ...profile, displayName: levels[nextIndex] });
    }
  }, [profile]);

  const handleExperienceChange = useCallback(() => {
    const levels = ["Beginner", "Intermediate", "Advanced"];
    const currentIndex = levels.indexOf(profile.experienceLevel);
    const nextIndex = (currentIndex + 1) % levels.length;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveProfile({ ...profile, experienceLevel: levels[nextIndex] });
  }, [profile]);

  const toggleUnits = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    saveProfile({
      ...profile,
      preferredUnits: profile.preferredUnits === "metric" ? "imperial" : "metric",
    });
  }, [profile]);

  const handleClearData = useCallback(() => {
    Alert.alert(
      "Clear All Data",
      "This will delete all your saved workouts and stats. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setStats({
                totalWorkouts: 0,
                favoriteMuscle: "None yet",
                currentStreak: 0,
              });
              setProfile({
                displayName: "Athlete",
                experienceLevel: "Intermediate",
                preferredUnits: "metric",
              });
              setWorkoutDates([]);
              setMuscleDistribution({
                back: 0,
                chest: 0,
                core: 0,
                legs: 0,
                arms: 0,
              });
              setExerciseRecords({
                heaviestWeight: "-",
                best1RM: "-",
                bestSetVolume: "-",
                bestSession: "-",
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              Alert.alert(
                "Data Cleared",
                "Your data has been cleared. The app will now refresh.",
                [{ text: "OK", onPress: () => navigation.reset({ index: 0, routes: [{ name: "MainTabs" as any }] }) }]
              );
            } catch (error) {
              console.error("Error clearing data:", error);
              Alert.alert("Error", "Failed to clear data. Please try again.");
            }
          },
        },
      ]
    );
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg, paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.screenTagline}>YOUR</ThemedText>
        <ThemedText style={styles.screenTitle}>Profile</ThemedText>

        <View style={styles.avatarSection}>
          <LinearGradient
            colors={["#FF6B6B", "#FF4B4B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarContainer}
          >
            <Feather name="user" size={48} color="#FFF" />
          </LinearGradient>
          <ThemedText style={styles.displayName}>{profile.displayName}</ThemedText>
          <ThemedText style={styles.experienceLevel}>{profile.experienceLevel}</ThemedText>
        </View>

        <Pressable
          onPress={() => {
            if (stats.totalWorkouts > 0) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate("SavedWorkouts");
            }
          }}
          disabled={stats.totalWorkouts === 0}
        >
          <View style={styles.statsContainer}>
            <StatCard label="Workouts" value={stats.totalWorkouts} icon="activity" />
            <StatCard label="Streak" value={`${stats.currentStreak}d`} icon="zap" />
            <StatCard label="Top Muscle" value={stats.favoriteMuscle} icon="award" />
          </View>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("ProgressAnalytics");
          }}
          style={styles.progressAnalyticsCard}
        >
          <LinearGradient
            colors={["rgba(255, 107, 107, 0.15)", "rgba(255, 107, 107, 0.05)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.progressAnalyticsGradient}
          >
            <View style={styles.progressAnalyticsLeft}>
              <View style={styles.progressAnalyticsIcon}>
                <Feather name="trending-up" size={24} color="#FF6B6B" />
              </View>
              <View>
                <ThemedText style={styles.progressAnalyticsTitle}>Progress Analytics</ThemedText>
                <ThemedText style={styles.progressAnalyticsSubtitle}>Track your strength gains over time</ThemedText>
              </View>
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Workout Days Log</ThemedText>
            <View style={styles.streakBadge}>
              <Feather name="zap" size={14} color="#FF6B6B" />
              <ThemedText style={styles.streakBadgeText}>{workoutDates.length} this month</ThemedText>
            </View>
          </View>
          <View style={styles.calendarCard}>
            <ThemedText style={styles.calendarMonthLabel}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </ThemedText>
            <View style={styles.calendarHeader}>
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <ThemedText key={i} style={styles.calendarDayLabel}>{day}</ThemedText>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => (
                <View key={i} style={[
                  styles.calendarDay,
                  workoutDates.includes(i) && styles.calendarDayActive
                ]}>
                  <ThemedText style={[
                    styles.calendarDayText,
                    workoutDates.includes(i) && styles.calendarDayTextActive
                  ]}>{i + 1}</ThemedText>
                </View>
              ))}
            </View>
            {workoutDates.length === 0 && (
              <ThemedText style={styles.calendarEmptyText}>
                No workouts saved this month yet
              </ThemedText>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Muscle Distribution</ThemedText>
          <View style={styles.muscleDistCard}>
            <RadarChart data={muscleDistribution} />
            {!Object.values(muscleDistribution).some(v => v > 0) && (
              <ThemedText style={styles.muscleDistEmptyOverlayText}>
                No workouts tracked yet this month
              </ThemedText>
            )}
          </View>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={isPRModalVisible}
          onRequestClose={() => setIsPRModalVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsPRModalVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.prModalContent}>
                  <ThemedText style={styles.prModalTitle}>Personal Records</ThemedText>
                  
                  <View style={styles.prModalItem}>
                    <ThemedText style={styles.prModalLabel}>Heaviest Weight</ThemedText>
                    <ThemedText style={styles.prModalDescription}>
                      The heaviest weight you've ever lifted for this exercise.
                    </ThemedText>
                  </View>

                  <View style={styles.prModalItem}>
                    <ThemedText style={styles.prModalLabel}>Best 1RM</ThemedText>
                    <ThemedText style={styles.prModalDescription}>
                      Calculated 1-Rep Max based on your best set.
                    </ThemedText>
                  </View>

                  <View style={styles.prModalItem}>
                    <ThemedText style={styles.prModalLabel}>Best Session Volume</ThemedText>
                    <ThemedText style={styles.prModalDescription}>
                      Total weight moved in a single exercise session (sets x reps x weight).
                    </ThemedText>
                  </View>

                  <Pressable
                    style={styles.prModalCloseButton}
                    onPress={() => setIsPRModalVisible(false)}
                  >
                    <ThemedText style={styles.prModalCloseText}>Close</ThemedText>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Personal Bests</ThemedText>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsPRModalVisible(true);
              }}
            >
              <Feather name="info" size={16} color={Colors.dark.textSecondary} />
            </Pressable>
          </View>
          <View style={styles.settingsCard}>
            <View style={styles.recordRow}>
              <View style={styles.recordLeft}>
                <View style={[styles.recordIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                  <Feather name="trending-up" size={18} color="#FF6B6B" />
                </View>
                <ThemedText style={styles.recordLabel}>Heaviest Weight</ThemedText>
              </View>
              <ThemedText style={styles.recordValue}>{exerciseRecords.heaviestWeight}</ThemedText>
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.recordRow}>
              <View style={styles.recordLeft}>
                <View style={[styles.recordIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                  <Feather name="star" size={18} color="#FF6B6B" />
                </View>
                <ThemedText style={styles.recordLabel}>Best 1RM</ThemedText>
              </View>
              <ThemedText style={styles.recordValue}>{exerciseRecords.best1RM}</ThemedText>
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.recordRow}>
              <View style={styles.recordLeft}>
                <View style={[styles.recordIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                  <Feather name="layers" size={18} color="#FF6B6B" />
                </View>
                <ThemedText style={styles.recordLabel}>Max Set Volume</ThemedText>
              </View>
              <ThemedText style={styles.recordValue}>{exerciseRecords.bestSetVolume}</ThemedText>
            </View>
            <View style={styles.settingsDivider} />
            <View style={styles.recordRow}>
              <View style={styles.recordLeft}>
                <View style={[styles.recordIconContainer, { backgroundColor: 'rgba(255, 107, 107, 0.1)' }]}>
                  <Feather name="zap" size={18} color="#FF6B6B" />
                </View>
                <ThemedText style={styles.recordLabel}>Longest Session</ThemedText>
              </View>
              <ThemedText style={styles.recordValue}>{exerciseRecords.bestSession}</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="user"
              label="Name"
              value={profile.displayName}
              onPress={handleNameChange}
            />
            <View style={styles.settingsDivider} />
            <SettingsRow
              icon="award"
              label="Experience"
              value={profile.experienceLevel}
              onPress={handleExperienceChange}
            />
            <View style={styles.settingsDivider} />
            <SettingsRow
              icon="settings"
              label="Units"
              value={profile.preferredUnits.charAt(0).toUpperCase() + profile.preferredUnits.slice(1)}
              onPress={toggleUnits}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Data & Connectivity</ThemedText>
          <View style={styles.settingsCard}>
            {/* Health Sync Hidden */}
            {/*
            <SettingsRow
              icon="activity"
              label="Health Sync"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("HealthSync");
              }}
            />
            <View style={styles.settingsDivider} />
            */}
            <SettingsRow
              icon="trash-2"
              label="Clear All Data"
              onPress={handleClearData}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Legal</ThemedText>
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="shield"
              label="Privacy Policy"
              onPress={() => WebBrowser.openBrowserAsync("https://fitforgex.com/privacy")}
            />
            <View style={styles.settingsDivider} />
            <SettingsRow
              icon="file-text"
              label="Terms of Service"
              onPress={() => WebBrowser.openBrowserAsync("https://fitforgex.com/terms")}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.versionText}>FitForgeX v1.0.2 Build 6</ThemedText>
          <ThemedText style={styles.copyrightText}>© 2026 FitForgeX. All rights reserved.</ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  screenTagline: {
    ...Typography.caption,
    color: "#FF6B6B",
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  screenTitle: {
    ...Typography.h1,
    fontSize: 42,
    marginBottom: Spacing.xl,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  displayName: {
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  experienceLevel: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    marginHorizontal: Spacing.xs,
  },
  statValue: {
    ...Typography.h3,
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  progressAnalyticsCard: {
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.2)",
  },
  progressAnalyticsGradient: {
    padding: Spacing.lg,
  },
  progressAnalyticsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  progressAnalyticsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  progressAnalyticsTitle: {
    ...Typography.h3,
    fontSize: 18,
    marginBottom: 2,
  },
  progressAnalyticsSubtitle: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
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
    ...Typography.h3,
    fontSize: 18,
    color: Colors.dark.textSecondary,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  streakBadgeText: {
    ...Typography.caption,
    color: "#FF6B6B",
    fontWeight: "700",
  },
  calendarCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  calendarMonthLabel: {
    ...Typography.h3,
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  calendarDayLabel: {
    ...Typography.caption,
    width: 35,
    textAlign: "center",
    color: Colors.dark.textSecondary,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 12,
  },
  calendarDay: {
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarDayActive: {
    backgroundColor: "#FF6B6B",
  },
  calendarDayText: {
    ...Typography.caption,
    fontSize: 12,
  },
  calendarDayTextActive: {
    color: "#FFF",
    fontWeight: "700",
  },
  calendarEmptyText: {
    ...Typography.caption,
    textAlign: "center",
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
  muscleDistCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    position: "relative",
  },
  radarContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  muscleDistEmptyOverlayText: {
    ...Typography.caption,
    position: "absolute",
    bottom: Spacing.xl,
    color: Colors.dark.textSecondary,
    fontStyle: "italic",
  },
  settingsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingsLabel: {
    ...Typography.body,
    fontWeight: "600",
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsValue: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginRight: Spacing.xs,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginLeft: Spacing.lg + 36 + Spacing.md,
  },
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  recordLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  recordLabel: {
    ...Typography.body,
    fontWeight: "500",
  },
  recordValue: {
    ...Typography.h3,
    fontSize: 16,
    color: "#FF6B6B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  prModalContent: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  prModalTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  prModalItem: {
    marginBottom: Spacing.lg,
  },
  prModalLabel: {
    ...Typography.h3,
    fontSize: 18,
    color: "#FF6B6B",
    marginBottom: 4,
  },
  prModalDescription: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  prModalCloseButton: {
    backgroundColor: "#FF6B6B",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  prModalCloseText: {
    ...Typography.body,
    fontWeight: "700",
    color: "#FFF",
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  versionText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginBottom: 4,
  },
  copyrightText: {
    ...Typography.caption,
    fontSize: 10,
    color: Colors.dark.textSecondary,
    opacity: 0.5,
  },
});
