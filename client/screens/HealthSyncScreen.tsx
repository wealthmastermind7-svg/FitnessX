import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const PRIMARY_ACCENT = "#FF6B6B";

interface HealthPlatform {
  id: string;
  name: string;
  subtitle: string;
  icon: keyof typeof Feather.glyphMap;
  available: boolean;
}

const HEALTH_PLATFORMS: HealthPlatform[] = [
  {
    id: "apple_health",
    name: "Apple Health",
    subtitle: "iOS Native",
    icon: "heart",
    available: Platform.OS === "ios",
  },
  {
    id: "google_fit",
    name: "Google Fit",
    subtitle: "Cross-platform",
    icon: "activity",
    available: true,
  },
];

const BENEFITS = [
  {
    icon: "heart" as const,
    title: "Track Heart Rate",
    description: "Analyze cardiovascular health with high-precision data logs.",
  },
  {
    icon: "trending-up" as const,
    title: "Sync Daily Steps",
    description: "Consolidate movement patterns from all your wearable devices.",
  },
  {
    icon: "zap" as const,
    title: "Auto-Log Activity",
    description: "Never miss a workout with intelligent automated detection.",
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HealthSyncScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const togglePlatform = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleConnectAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSyncing(true);
    
    // Simulate real platform connection handshake
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const healthSyncSettings = {
      appleHealth: selectedPlatforms.has("apple_health"),
      googleFit: selectedPlatforms.has("google_fit"),
      syncEnabled: true,
      connectedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem("healthSyncSettings", JSON.stringify(healthSyncSettings));
    
    setIsSyncing(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Sync Successful", 
      "Your health data is now being synchronized with FitForge.",
      [{ text: "Great!", onPress: () => navigation.goBack() }]
    );
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await AsyncStorage.setItem("healthSyncSkipped", "true");
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#000000", "#0a0a12", "#000000"]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.cinematicGradient} />
      <View style={styles.particleBg} />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + Spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <BlurView intensity={20} tint="dark" style={styles.backButtonBlur}>
              <Feather name="chevron-left" size={24} color="white" />
            </BlurView>
          </Pressable>
          <ThemedText style={styles.headerBadge}>PREMIUM ACCESS</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.headline}>
          <ThemedText style={styles.title}>Sync Your</ThemedText>
          <ThemedText style={styles.titleFaded}>Health Data</ThemedText>
          <ThemedText style={styles.subtitle}>
            INTEGRATE YOUR FAVORITE ECOSYSTEMS
          </ThemedText>
        </View>

        <View style={styles.platformGrid}>
          {HEALTH_PLATFORMS.map((platform) => (
            <Pressable
              key={platform.id}
              style={[
                styles.platformCard,
                selectedPlatforms.has(platform.id) && styles.platformCardSelected,
              ]}
              onPress={() => togglePlatform(platform.id)}
            >
              <BlurView intensity={15} tint="dark" style={styles.platformCardInner}>
                <View style={styles.platformIconContainer}>
                  <Feather name={platform.icon} size={32} color="white" />
                </View>
                <ThemedText style={styles.platformName}>{platform.name}</ThemedText>
                <ThemedText style={styles.platformSubtitle}>{platform.subtitle}</ThemedText>
                {selectedPlatforms.has(platform.id) && (
                  <View style={styles.checkmark}>
                    <Feather name="check" size={16} color={PRIMARY_ACCENT} />
                  </View>
                )}
              </BlurView>
            </Pressable>
          ))}
        </View>

        <View style={styles.benefitsCard}>
          <BlurView intensity={15} tint="dark" style={styles.benefitsCardInner}>
            <View style={styles.benefitsContent}>
              <ThemedText style={styles.benefitsTitle}>WHY SYNCHRONIZE?</ThemedText>
              
              {BENEFITS.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <View style={styles.benefitIconContainer}>
                    <Feather name={benefit.icon} size={18} color={PRIMARY_ACCENT} />
                  </View>
                  <View style={styles.benefitTextContainer}>
                    <ThemedText style={styles.benefitTitle}>{benefit.title}</ThemedText>
                    <ThemedText style={styles.benefitDescription}>{benefit.description}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </BlurView>
        </View>

        <View style={styles.ctaContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.connectButton,
              (pressed || isSyncing) && styles.connectButtonPressed,
              isSyncing && { opacity: 0.8 }
            ]}
            onPress={handleConnectAll}
            disabled={isSyncing}
          >
            <LinearGradient
              colors={[PRIMARY_ACCENT, "#FF4B4B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {isSyncing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <ThemedText style={styles.connectButtonText}>Connect All & Start Syncing</ThemedText>
                <Feather name="arrow-right" size={20} color="white" />
              </>
            )}
          </Pressable>

          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <ThemedText style={styles.skipButtonText}>Maybe Later</ThemedText>
          </Pressable>
        </View>

        <View style={styles.homeIndicator} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  cinematicGradient: {
    position: "absolute",
    top: "25%",
    left: "50%",
    width: "100%",
    height: "100%",
    transform: [{ translateX: "-50%" }],
    backgroundColor: "transparent",
    borderRadius: 9999,
    opacity: 0.15,
    shadowColor: PRIMARY_ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 150,
  },
  particleBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
  },
  backButtonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    color: `${PRIMARY_ACCENT}cc`,
  },
  headerSpacer: {
    width: 40,
  },
  headline: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 44,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -1,
  },
  titleFaded: {
    fontSize: 44,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 48,
    letterSpacing: -1,
  },
  subtitle: {
    marginTop: Spacing.md,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 2,
    textAlign: "center",
  },
  platformGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  platformCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  platformCardSelected: {
    borderColor: PRIMARY_ACCENT,
  },
  platformCardInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  platformIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  platformName: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  platformSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  checkmark: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 107, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitsCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  benefitsCardInner: {
    padding: 2,
  },
  benefitsContent: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  benefitsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY_ACCENT,
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${PRIMARY_ACCENT}33`,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
  },
  ctaContainer: {
    marginTop: "auto",
    gap: Spacing.md,
  },
  connectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    gap: Spacing.sm,
    shadowColor: PRIMARY_ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  connectButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    letterSpacing: -0.3,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255,255,255,0.4)",
  },
  homeIndicator: {
    alignSelf: "center",
    marginTop: Spacing.lg,
    width: 128,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
