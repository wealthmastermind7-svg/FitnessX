import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography, Gradients } from "@/constants/theme";
import { useRevenueCat } from "@/lib/revenuecat";

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
          <Feather name={icon} size={20} color={Colors.dark.accent} />
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
      <Feather name={icon} size={24} color={Colors.dark.accent} style={{ marginBottom: Spacing.sm }} />
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText style={styles.statLabel}>{label}</ThemedText>
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

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

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
      const savedStats = await AsyncStorage.getItem("workoutStats");
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error("Error loading stats:", error);
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
            colors={Gradients.accent as [string, string]}
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

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Settings</ThemedText>
          
          <View style={styles.settingsCard}>
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
                  <Feather name="bar-chart-2" size={20} color={Colors.dark.accent} />
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
                  <Feather name="globe" size={20} color={Colors.dark.accent} />
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
                <View style={[styles.settingsIconContainer, { backgroundColor: Colors.dark.accent + '20' }]}>
                  <Feather name="zap" size={20} color={Colors.dark.accent} />
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
          <ThemedText style={styles.sectionTitle}>Data</ThemedText>
          
          <View style={styles.settingsCard}>
            <SettingsRow
              icon="trash-2"
              label="Clear All Data"
              onPress={handleClearData}
            />
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
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
    marginBottom: Spacing.md,
  },
  settingsCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.dark.border,
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
  },
  buttonTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.border,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  buttonTabActive: {
    backgroundColor: Colors.dark.accent,
    borderColor: Colors.dark.accent,
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
    backgroundColor: Colors.dark.accent,
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
});
