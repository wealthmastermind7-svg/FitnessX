import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ImageBackground,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useOnboarding } from "@/contexts/OnboardingContext";

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingDiscover">;

const MUSCLE_GROUPS = [
  { name: "Chest", selected: true, image: require("@/assets/images/muscle-chest.png") },
  { name: "Back", selected: false, image: require("@/assets/images/muscle-back.png") },
  { name: "Shoulders", selected: false, image: require("@/assets/images/muscle-shoulders.png") },
  { name: "Arms", selected: false, image: require("@/assets/images/muscle-arms.png") },
];

export default function OnboardingDiscoverScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const handleNext = () => {
    navigation.navigate("OnboardingAICoach");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80" }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]}
          locations={[0, 0.5, 1]}
          style={styles.gradient}
        />

        <View style={[styles.container, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <Image source={require("@/assets/images/fitforge-icon.png")} style={styles.headerIcon} />
            <View style={styles.progressDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
            <Pressable onPress={handleSkip}>
              <ThemedText style={styles.skipText}>SKIP</ThemedText>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.phoneFrame}>
              <View style={styles.phoneNotch} />
              <View style={styles.phoneScreen}>
                <ThemedText style={styles.phoneTitle}>MUSCLE GROUPS</ThemedText>
                <View style={styles.muscleGrid}>
                  {MUSCLE_GROUPS.map((group) => (
                    <View 
                      key={group.name} 
                      style={[
                        styles.muscleCard,
                        group.selected && styles.muscleCardSelected,
                      ]}
                    >
                      <Image
                        source={group.image}
                        style={styles.muscleImage}
                        resizeMode="contain"
                      />
                      <ThemedText style={styles.muscleName}>{group.name}</ThemedText>
                    </View>
                  ))}
                </View>
                <View style={styles.phoneTabBar}>
                  <View style={styles.phoneTab}>
                    <Feather name="search" size={18} color="#FF4D4D" />
                    <ThemedText style={styles.phoneTabTextActive}>Discover</ThemedText>
                  </View>
                  <View style={styles.phoneTab}>
                    <Feather name="zap" size={18} color="#666" />
                    <ThemedText style={styles.phoneTabText}>Generate</ThemedText>
                  </View>
                  <View style={styles.phoneTab}>
                    <Feather name="user" size={18} color="#666" />
                    <ThemedText style={styles.phoneTabText}>Profile</ThemedText>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.descriptionSection}>
            <View style={styles.statsIconRow}>
              <View style={styles.statsBar} />
              <View style={[styles.statsBar, styles.statsBarShort]} />
              <View style={[styles.statsBar, styles.statsBarTall]} />
              <View style={[styles.statsBar, styles.statsBarMedium]} />
            </View>
            <View style={styles.titleRow}>
              <ThemedText style={styles.mainTitle}>Discover</ThemedText>
              <View style={styles.exerciseRow}>
                <ThemedText style={styles.highlightNumber}>1,500+</ThemedText>
                <ThemedText style={styles.highlightText}> Exercises</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.description}>
              Explore our comprehensive library. Filter by muscle group, equipment, or difficulty to build your perfect routine.
            </ThemedText>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <ThemedText style={styles.secondaryButtonText}>BACK</ThemedText>
            </Pressable>

            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <ThemedText style={styles.primaryButtonText}>NEXT</ThemedText>
            </Pressable>
          </View>
        </View>

        <View style={styles.homeIndicator} />
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.5,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  headerIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  progressDots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    backgroundColor: "#FF4D4D",
  },
  skipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  phoneFrame: {
    width: 240,
    height: 380,
    backgroundColor: "#1A1A1A",
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#333",
    overflow: "hidden",
    position: "relative",
  },
  phoneNotch: {
    position: "absolute",
    top: 0,
    left: "50%",
    marginLeft: -40,
    width: 80,
    height: 24,
    backgroundColor: "#0A0A0A",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    zIndex: 10,
  },
  phoneScreen: {
    flex: 1,
    backgroundColor: "#0F0F0F",
    paddingTop: 36,
    paddingHorizontal: 12,
  },
  phoneTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  muscleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  muscleCard: {
    width: "47%",
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  muscleCardSelected: {
    borderColor: "rgba(255, 107, 107, 0.5)",
    backgroundColor: "rgba(255, 107, 107, 0.1)",
  },
  muscleImage: {
    width: 56,
    height: 56,
    marginBottom: 8,
  },
  muscleName: {
    fontSize: 11,
    fontWeight: "500",
    color: "white",
  },
  phoneTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  phoneTab: {
    alignItems: "center",
    gap: 2,
  },
  phoneTabText: {
    fontSize: 9,
    color: "#666",
  },
  phoneTabTextActive: {
    fontSize: 9,
    color: "#FF4D4D",
  },
  descriptionSection: {
    marginBottom: Spacing.xl,
  },
  statsIconRow: {
    flexDirection: "row",
    gap: 3,
    alignItems: "flex-end",
    marginBottom: Spacing.md,
  },
  statsBar: {
    width: 4,
    height: 20,
    backgroundColor: "#FF4D4D",
    borderRadius: 2,
  },
  statsBarShort: {
    height: 12,
    backgroundColor: "white",
  },
  statsBarTall: {
    height: 28,
    backgroundColor: "white",
  },
  statsBarMedium: {
    height: 16,
    backgroundColor: "white",
  },
  titleRow: {
    marginBottom: Spacing.md,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    lineHeight: 44,
  },
  highlightNumber: {
    fontSize: 36,
    fontWeight: "800",
    color: "white",
    lineHeight: 44,
  },
  highlightText: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FF4D4D",
    lineHeight: 44,
  },
  description: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FF4D4D",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    letterSpacing: 1,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
    letterSpacing: 1,
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    marginLeft: -50,
    width: 100,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
  },
});
