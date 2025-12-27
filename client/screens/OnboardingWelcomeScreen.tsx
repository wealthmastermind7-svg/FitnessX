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
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useOnboarding } from "@/hooks/useOnboarding";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingWelcome">;

export default function OnboardingWelcomeScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const handleGetStarted = () => {
    navigation.navigate("OnboardingDiscover");
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" }}
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
            <View style={styles.logo}>
              <Image source={require("@/assets/images/fitforge-icon.png")} style={styles.logoIcon} />
              <ThemedText style={styles.logoText}>FITFORGE</ThemedText>
            </View>
            <Pressable onPress={handleSkip}>
              <ThemedText style={styles.skipText}>Skip Intro</ThemedText>
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.titleContainer}>
              <ThemedText style={styles.title}>UNLEASH</ThemedText>
              <ThemedText style={styles.titleFaded}>YOUR TRUE</ThemedText>
              <ThemedText style={styles.title}>POTENTIAL</ThemedText>
            </View>

            <ThemedText style={styles.subtitle}>
              Join the elite community. AI-driven workouts tailored to your exact physiology.
            </ThemedText>

            <View style={styles.badges}>
              <View style={styles.badge}>
                <Feather name="zap" size={14} color="#FF4D4D" />
                <ThemedText style={styles.badgeText}>AI COACH</ThemedText>
              </View>
              <View style={styles.badge}>
                <Feather name="book" size={14} color="#FF4D4D" />
                <ThemedText style={styles.badgeText}>1,300+ EXERCISES</ThemedText>
              </View>
              <View style={styles.badge}>
                <Feather name="heart" size={14} color="#FF4D4D" />
                <ThemedText style={styles.badgeText}>CUSTOM PLANS</ThemedText>
              </View>
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
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  logoText: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    letterSpacing: 2,
  },
  skipText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: Spacing.xl,
  },
  titleContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 56,
    fontWeight: "800",
    color: "white",
    lineHeight: 58,
    letterSpacing: -1,
  },
  titleFaded: {
    fontSize: 56,
    fontWeight: "800",
    color: "rgba(255,255,255,0.5)",
    lineHeight: 58,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 26,
    marginBottom: Spacing.xl,
    maxWidth: 320,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "white",
    letterSpacing: 0.5,
  },
  ctaContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF4D4D",
    paddingVertical: 18,
    paddingHorizontal: Spacing.xl,
    borderRadius: 20,
    gap: Spacing.sm,
  },
  buttonPressed: {
    opacity: 0.9,
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
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 3,
  },
});
