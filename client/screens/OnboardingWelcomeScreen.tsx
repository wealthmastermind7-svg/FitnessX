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
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useOnboarding } from "@/contexts/OnboardingContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingWelcome">;

export default function OnboardingWelcomeScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("OnboardingDiscover");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=90" }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <LinearGradient
          colors={["rgba(13, 2, 33, 0.4)", "rgba(26, 11, 46, 0.8)", "#0D0221"]}
          locations={[0, 0.4, 0.9]}
          style={styles.gradient}
        />

        <View style={[styles.container, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.header}>
            <BlurView intensity={20} tint="dark" style={styles.logoBlur}>
              <View style={styles.logo}>
                <Image source={require("@/assets/images/fitforge-icon.png")} style={styles.logoIcon} />
                <ThemedText style={styles.logoText}>FITFORGE</ThemedText>
              </View>
            </BlurView>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <ThemedText style={styles.skipText}>Skip</ThemedText>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.titleLine1}>UNLEASH</ThemedText>
              <ThemedText style={styles.titleLine2}>YOUR TRUE</ThemedText>
              <ThemedText style={styles.titleLine3}>POTENTIAL</ThemedText>
            </View>

            <ThemedText style={styles.subtitle}>
              Join the elite community. AI-driven workouts tailored to your exact physiology.
            </ThemedText>

            <View style={styles.badges}>
              <BlurView intensity={20} tint="dark" style={styles.badgeGlass}>
                <Feather name="zap" size={14} color="#FF6B6B" />
                <ThemedText style={styles.badgeText}>AI COACH</ThemedText>
              </BlurView>
              <BlurView intensity={20} tint="dark" style={styles.badgeGlass}>
                <Feather name="book" size={14} color="#FF6B6B" />
                <ThemedText style={styles.badgeText}>1,300+ EXERCISES</ThemedText>
              </BlurView>
              <BlurView intensity={20} tint="dark" style={styles.badgeGlass}>
                <Feather name="target" size={14} color="#FF6B6B" />
                <ThemedText style={styles.badgeText}>CUSTOM PLANS</ThemedText>
              </BlurView>
            </View>
          </View>

          <View style={styles.ctaContainer}>
            <Pressable
              onPress={handleGetStarted}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <LinearGradient
                colors={["#FF6B6B", "#FF4B4B"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <ThemedText style={styles.primaryButtonText}>Get Started</ThemedText>
              <Feather name="arrow-right" size={20} color="white" />
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
    backgroundColor: "#0D0221",
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.6,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoBlur: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    gap: Spacing.xs,
  },
  logoIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "800",
    color: "white",
    letterSpacing: 2,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingTop: 100,
  },
  titleContainer: {
    marginBottom: Spacing.md,
  },
  titleLine1: {
    fontSize: 56,
    fontWeight: "900",
    color: "white",
    lineHeight: 56,
    letterSpacing: -2,
  },
  titleLine2: {
    fontSize: 56,
    fontWeight: "900",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 56,
    letterSpacing: -2,
  },
  titleLine3: {
    fontSize: 56,
    fontWeight: "900",
    color: "white",
    lineHeight: 56,
    letterSpacing: -2,
  },
  subtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 28,
    marginBottom: Spacing.xl,
    fontWeight: "500",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badgeGlass: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
    letterSpacing: 1,
  },
  ctaContainer: {
    paddingBottom: Spacing.xl,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    borderRadius: 24,
    overflow: "hidden",
    gap: Spacing.sm,
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  homeIndicator: {
    position: "absolute",
    bottom: 8,
    left: "50%",
    marginLeft: -50,
    width: 100,
    height: 5,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
  },
});
