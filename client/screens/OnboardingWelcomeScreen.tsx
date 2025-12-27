import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingWelcome">;

export default function OnboardingWelcomeScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleGetStarted = () => {
    navigation.navigate("OnboardingDiscover");
  };

  const handleSkip = () => {
    navigation.navigate("Main");
  };

  return (
    <ThemedView style={styles.root}>
      {/* Background gradient overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.9)"] as const}
        style={styles.gradient}
      />

      {/* Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + Spacing.xl,
        }}
        scrollEnabled={false}
      >
        {/* Header with logo and skip */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Feather name="zap" size={24} color={Colors.dark.accent} />
            <ThemedText style={styles.logoText}>FitForge</ThemedText>
          </View>
          <Pressable onPress={handleSkip}>
            <ThemedText style={styles.skipText}>Skip Intro</ThemedText>
          </Pressable>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <ThemedText style={styles.title}>
            UNLEASH{"\n"}
            <ThemedText style={styles.titleGradient}>YOUR TRUE</ThemedText>
            {"\n"}POTENTIAL
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Join the elite community. AI-driven workouts tailored to your exact
            physiology.
          </ThemedText>

          {/* Feature badges */}
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Feather name="zap" size={14} color={Colors.dark.accent} />
              <ThemedText style={styles.badgeText}>AI COACH</ThemedText>
            </View>
            <View style={styles.badge}>
              <Feather name="book-open" size={14} color={Colors.dark.accent} />
              <ThemedText style={styles.badgeText}>1,300+ EXERCISES</ThemedText>
            </View>
            <View style={styles.badge}>
              <Feather name="target" size={14} color={Colors.dark.accent} />
              <ThemedText style={styles.badgeText}>CUSTOM PLANS</ThemedText>
            </View>
          </View>
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaContainer}>
          <LinearGradient
            colors={["#FF6B6B", "#FFB347"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Pressable
              onPress={handleGetStarted}
              style={({ pressed }) => [
                styles.primaryButtonInner,
                pressed && styles.buttonPressed,
              ]}
            >
              <ThemedText style={styles.primaryButtonText}>
                Get Started
              </ThemedText>
              <Feather
                name="arrow-right"
                size={20}
                color="white"
                style={styles.arrowIcon}
              />
            </Pressable>
          </LinearGradient>

          <View style={styles.loginContainer}>
            <ThemedText style={styles.loginText}>Already have an account?</ThemedText>
            <Pressable onPress={handleSkip}>
              <ThemedText style={styles.loginLink}>Log In</ThemedText>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
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
    marginBottom: Spacing.xxl,
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  logoText: {
    ...Typography.h2,
    color: Colors.dark.text,
    fontWeight: "700",
  },
  skipText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.display,
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
    lineHeight: 64,
  },
  titleGradient: {
    color: Colors.dark.accentSecondary,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  badges: {
    flexDirection: "column",
    gap: Spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.dark.text,
  },
  ctaContainer: {
    gap: Spacing.md,
  },
  primaryButton: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  primaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    ...Typography.h3,
    color: "white",
    fontWeight: "700",
  },
  arrowIcon: {
    marginLeft: Spacing.sm,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loginText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  loginLink: {
    ...Typography.small,
    color: Colors.dark.text,
    fontWeight: "600",
  },
});
