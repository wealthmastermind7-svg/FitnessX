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
      // Always get the true count from saved workouts to ensure accuracy
      const savedWorkouts = await AsyncStorage.getItem("savedWorkouts");
      const workoutsList = savedWorkouts ? JSON.parse(savedWorkouts) : [];
      const actualWorkoutCount = workoutsList.length;

      const savedStats = await AsyncStorage.getItem("workoutStats");
      const stats = savedStats ? JSON.parse(savedStats) : { totalWorkouts: 0, favoriteMuscle: "None yet", currentStreak: 0 };
      
      // Update totalWorkouts to match actual saved count
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

  const toggleHealthService = async (service: "appleHealth" | "googleFit") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSettings = {
      ...healthSync,
      [service]: !healthSync[service],
      syncEnabled: true,
    };
    setHealthSync(newSettings);
    await AsyncStorage.setItem("healthSyncSettings", JSON.stringify(newSettings));
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
        {/* Workout Days Log - Real Data */}
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

        {/* Muscle Distribution - Radar Chart */}
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

        {/* Personal Records Modal */}
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
                      1RM (One Rep Max) uses reps and weight from a set to estimate the max weight you could lift for a single rep. This is the highest 1RM you've ever achieved.
                    </ThemedText>
                  </View>

                  <View style={styles.prModalItem}>
                    <ThemedText style={styles.prModalLabel}>Best Set Volume</ThemedText>
                    <ThemedText style={styles.prModalDescription}>
                      The set in which you lifted the most volume (weight x reps).
                    </ThemedText>
                  </View>

                  <View style={styles.prModalItem}>
                    <ThemedText style={styles.prModalLabel}>Best Session Volume</ThemedText>
                    <ThemedText style={styles.prModalDescription}>
                      Max Session Volume is the session you lifted the most weight in total over all your sets in this exercise.
                    </ThemedText>
                  </View>

                  <Pressable
                    style={styles.prModalButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsPRModalVisible(false);
                    }}
                  >
                    <ThemedText style={styles.prModalButtonText}>Ok</ThemedText>
                  </Pressable>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Exercise Records */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Personal Records</ThemedText>
            <Pressable 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsPRModalVisible(true);
              }}
              style={styles.infoIcon}
            >
              <Feather name="info" size={18} color="#FF6B6B" />
            </Pressable>
          </View>
          <View style={styles.recordsGrid}>
            <View style={styles.recordCard}>
              <Feather name="trending-up" size={20} color="#FF6B6B" />
              <ThemedText style={styles.recordValue}>{exerciseRecords.heaviestWeight}</ThemedText>
              <ThemedText style={styles.recordLabel}>Heaviest Weight</ThemedText>
            </View>
            <View style={styles.recordCard}>
              <Feather name="target" size={20} color="#FF6B6B" />
              <ThemedText style={styles.recordValue}>{exerciseRecords.best1RM}</ThemedText>
              <ThemedText style={styles.recordLabel}>Best 1RM</ThemedText>
            </View>
            <View style={styles.recordCard}>
              <Feather name="layers" size={20} color="#FF6B6B" />
              <ThemedText style={styles.recordValue}>{exerciseRecords.bestSetVolume}</ThemedText>
              <ThemedText style={styles.recordLabel}>Best Set Vol.</ThemedText>
            </View>
            <View style={styles.recordCard}>
              <Feather name="award" size={20} color="#FF6B6B" />
              <ThemedText style={styles.recordValue}>{exerciseRecords.bestSession}</ThemedText>
              <ThemedText style={styles.recordLabel}>Best Session</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
          
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="activity"
              label="Health Sync"
              value={healthSync.syncEnabled ? "Active" : "Not Connected"}
              onPress={() => navigation.navigate("HealthSync")}
            />
            <View style={styles.settingsDivider} />
            <SettingsRow
              icon="user"
              label="Display Name"
              value={profile.displayName}
              onPress={handleNameChange}
            />
            <View style={styles.settingsDivider} />
            
            <View style={styles.settingRowContainer}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconContainer}>
                  <Feather name="bar-chart-2" size={20} color="#FF6B6B" />
                </View>
                <ThemedText style={styles.settingsLabel}>Experience Level</ThemedText>
              </View>
              <View style={styles.buttonTabContainer}>
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      saveProfile({ ...profile, experienceLevel: level });
                    }}
                    style={[
                      styles.buttonTab,
                      profile.experienceLevel === level && styles.buttonTabActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.buttonTabText,
                        profile.experienceLevel === level && styles.buttonTabTextActive,
                      ]}
                    >
                      {level.slice(0, 3)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.settingsDivider} />
            
            <View style={styles.settingRowContainer}>
              <View style={styles.settingsRowLeft}>
                <View style={styles.settingsIconContainer}>
                  <Feather name="globe" size={20} color="#FF6B6B" />
                </View>
                <ThemedText style={styles.settingsLabel}>Units</ThemedText>
              </View>
              <View style={styles.buttonTabContainer}>
                {[
                  { label: "kg", value: "metric" },
                  { label: "lbs", value: "imperial" },
                ].map((unit) => (
                  <Pressable
                    key={unit.value}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      saveProfile({ ...profile, preferredUnits: unit.value as "metric" | "imperial" });
                    }}
                    style={[
                      styles.buttonTab,
                      profile.preferredUnits === unit.value && styles.buttonTabActive,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.buttonTabText,
                        profile.preferredUnits === unit.value && styles.buttonTabTextActive,
                      ]}
                    >
                      {unit.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Subscription</ThemedText>
          
          <View style={styles.settingsCard}>
            <Pressable
              style={styles.settingsRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isProUser) {
                  navigation.navigate("CustomerCenter");
                } else {
                  navigation.navigate("Paywall");
                }
              }}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.settingsIconContainer, { backgroundColor: "#FF6B6B" + '20' }]}>
                  <Feather name="zap" size={20} color="#FF6B6B" />
                </View>
                <View>
                  <ThemedText style={styles.settingsLabel}>
                    {isRevenueCatLoading ? "Loading..." : isProUser ? "FitForgeX Pro" : "Upgrade to Pro"}
                  </ThemedText>
                  {!isRevenueCatLoading && !isProUser && (
                    <ThemedText style={[styles.settingsValue, { marginLeft: 0, marginTop: 2 }]}>
                      Unlock all AI features
                    </ThemedText>
                  )}
                </View>
              </View>
              <View style={styles.settingsRowRight}>
                {isProUser ? (
                  <View style={styles.proBadge}>
                    <ThemedText style={styles.proBadgeText}>ACTIVE</ThemedText>
                  </View>
                ) : (
                  <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
                )}
              </View>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Health Data Sync</ThemedText>
          
          <View style={styles.healthSyncCard}>
            <Pressable
              style={styles.healthSyncRow}
              onPress={() => toggleHealthService("appleHealth")}
            >
              <View style={styles.healthSyncRowLeft}>
                <View style={[styles.healthSyncIconContainer, healthSync.appleHealth && styles.healthSyncIconActive]}>
                  <Feather name="heart" size={20} color={healthSync.appleHealth ? HEALTH_SYNC_BLUE : Colors.dark.textSecondary} />
                </View>
                <View>
                  <ThemedText style={styles.settingsLabel}>Apple Health</ThemedText>
                  <ThemedText style={styles.healthSyncSubtitle}>iOS Native</ThemedText>
                </View>
              </View>
              <View style={[styles.healthSyncToggle, healthSync.appleHealth && styles.healthSyncToggleActive]}>
                <View style={[styles.healthSyncToggleKnob, healthSync.appleHealth && styles.healthSyncToggleKnobActive]} />
              </View>
            </Pressable>
            
            <View style={styles.settingsDivider} />
            
            <Pressable
              style={styles.healthSyncRow}
              onPress={() => toggleHealthService("googleFit")}
            >
              <View style={styles.healthSyncRowLeft}>
                <View style={[styles.healthSyncIconContainer, healthSync.googleFit && styles.healthSyncIconActive]}>
                  <Feather name="activity" size={20} color={healthSync.googleFit ? HEALTH_SYNC_BLUE : Colors.dark.textSecondary} />
                </View>
                <View>
                  <ThemedText style={styles.settingsLabel}>Google Fit</ThemedText>
                  <ThemedText style={styles.healthSyncSubtitle}>Cross-platform</ThemedText>
                </View>
              </View>
              <View style={[styles.healthSyncToggle, healthSync.googleFit && styles.healthSyncToggleActive]}>
                <View style={[styles.healthSyncToggleKnob, healthSync.googleFit && styles.healthSyncToggleKnobActive]} />
              </View>
            </Pressable>
            
            <View style={styles.settingsDivider} />
            
            <Pressable
              style={styles.healthSyncSetupRow}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("HealthSync");
              }}
            >
              <ThemedText style={styles.healthSyncSetupText}>Configure Health Sync</ThemedText>
              <Feather name="chevron-right" size={18} color={HEALTH_SYNC_BLUE} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Data</ThemedText>
          
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="trash-2"
              label="Clear All Data"
              onPress={handleClearData}
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Legal</ThemedText>
          
          <View style={styles.legalLinksContainer}>
            <Pressable 
              style={styles.legalLink}
              onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/terms')}
            >
              <ThemedText style={styles.legalLinkText}>Terms of Use</ThemedText>
            </Pressable>
            
            <Pressable 
              style={styles.legalLink}
              onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/privacy-policy')}
            >
              <ThemedText style={styles.legalLinkText}>Privacy Policy</ThemedText>
            </Pressable>
            
            <Pressable 
              style={styles.legalLink}
              onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/sources')}
            >
              <ThemedText style={styles.legalLinkText}>Sources & Citations</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>FitForge v1.0.0</ThemedText>
          <ThemedText style={styles.footerText}>Built with care</ThemedText>
        </View>
      </ScrollView>
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
  screenTagline: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 2,
    color: Colors.dark.accent,
    marginBottom: Spacing.xs,
  },
  screenTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: Colors.dark.text,
    marginBottom: Spacing.xl,
    letterSpacing: -0.5,
    lineHeight: 58,
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
    ...Typography.h1,
    color: Colors.dark.text,
    lineHeight: 40,
  },
  experienceLevel: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  statValue: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  streakBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  calendarCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  calendarDayLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    width: 32,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayActive: {
    backgroundColor: '#FF6B6B',
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.dark.text,
  },
  calendarDayTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  calendarMonthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  calendarEmptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  muscleDistCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    position: 'relative',
  },
  muscleDistEmptyOverlayText: {
    position: 'absolute',
    bottom: Spacing.md,
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  muscleBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  muscleBarLabel: {
    width: 50,
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  muscleBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: 6,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  muscleBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  muscleBarValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    textAlign: 'right',
  },
  infoIcon: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  prModalContent: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  prModalTitle: {
    ...Typography.h3,
    color: '#000',
    marginBottom: Spacing.lg,
  },
  prModalItem: {
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  prModalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  prModalDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  prModalButton: {
    backgroundColor: '#007AFF',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  prModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  muscleDistEmpty: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  muscleDistEmptyText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  recordsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  recordCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    gap: Spacing.xs,
  },
  recordValue: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  recordLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  radarCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    width: '100%',
  },
  radarWebContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarWebLine: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    position: 'absolute',
  },
  radarPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowRadius: 4,
    shadowOpacity: 0.5,
  },
  radarLabels: {
    ...StyleSheet.absoluteFillObject,
  },
  radarLabelText: {
    position: 'absolute',
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
    width: 60,
    textAlign: 'center',
    alignSelf: 'center',
  },
  radarLegend: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  settingsCard: {
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.accent + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingsLabel: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  settingsValue: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  settingRowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  buttonTabContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexShrink: 0,
  },
  buttonTab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.border,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minWidth: 40,
    alignItems: "center",
  },
  buttonTabActive: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  buttonTabText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  buttonTabTextActive: {
    color: "#FFF",
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  footerText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  proBadge: {
    backgroundColor: "#FF6B6B20",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  proBadgeText: {
    ...Typography.small,
    color: "#FFF",
    fontWeight: "700" as const,
    fontSize: 10,
  },
  legalLinksContainer: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  legalLink: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  legalLinkText: {
    ...Typography.body,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  healthSyncCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  healthSyncRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.md,
  },
  healthSyncRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  healthSyncIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  healthSyncIconActive: {
    backgroundColor: `${HEALTH_SYNC_BLUE}20`,
    borderColor: `${HEALTH_SYNC_BLUE}40`,
  },
  healthSyncSubtitle: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  healthSyncToggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 3,
    justifyContent: "center",
  },
  healthSyncToggleActive: {
    backgroundColor: HEALTH_SYNC_BLUE,
  },
  healthSyncToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  healthSyncToggleKnobActive: {
    backgroundColor: "white",
    alignSelf: "flex-end",
  },
  healthSyncSetupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  healthSyncSetupText: {
    ...Typography.body,
    color: HEALTH_SYNC_BLUE,
    fontWeight: "600",
  },
});
