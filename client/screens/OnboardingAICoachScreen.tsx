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

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingAICoach">;

export default function OnboardingAICoachScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    navigation.navigate("OnboardingWorkout");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.root}>
      {/* Background */}
      <LinearGradient
        colors={["rgba(147,112,219,0.1)", "rgba(0,0,0,0.95)"] as const}
        style={styles.gradient}
      />

      {/* Progress indicator */}
      <View
        style={[
          styles.progressBar,
          { paddingTop: insets.top + Spacing.lg },
        ]}
      >
        <View style={styles.progressDots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
        <Pressable onPress={() => navigation.navigate("Main")}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + Spacing.xl,
        }}
      >
        {/* Chat UI Mock */}
        <View style={styles.chatContainer}>
          <View style={styles.chatHeader}>
            <Feather
              name="circle"
              size={40}
              color="#9370DB"
              style={styles.coachAvatar}
            />
            <ThemedText style={styles.chatTitle}>Your AI Fitness Coach</ThemedText>
          </View>

          <View style={styles.messagesContainer}>
            {/* Coach message */}
            <View style={styles.coachMessage}>
              <View style={styles.coachBubble}>
                <ThemedText style={styles.messageText}>
                  Hey! I'm your AI fitness coach. I can help you with workout advice,
                  form checks, and recovery strategies.
                </ThemedText>
              </View>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>

            {/* User message */}
            <View style={styles.userMessage}>
              <View style={styles.userBubble}>
                <ThemedText style={styles.userMessageText}>
                  How can I build muscle faster?
                </ThemedText>
              </View>
            </View>

            {/* Suggested questions */}
            <View style={styles.suggestionsContainer}>
              <Pressable style={styles.suggestionChip}>
                <ThemedText style={styles.suggestionText}>
                  Best abs workout?
                </ThemedText>
              </Pressable>
              <Pressable style={styles.suggestionChip}>
                <ThemedText style={styles.suggestionText}>
                  Fix my squat form
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <ThemedText style={styles.mainTitle}>
            Your Personal{"\n"}
            <ThemedText style={styles.highlightText}>AI Fitness Coach</ThemedText>
          </ThemedText>

          <ThemedText style={styles.description}>
            Get instant expert advice, custom workout plans, and form corrections
            anytime, anywhere.
          </ThemedText>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={20} color={Colors.dark.accent} />
              <ThemedText style={styles.featureText}>Expert fitness advice</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={20} color={Colors.dark.accent} />
              <ThemedText style={styles.featureText}>Form corrections</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check-circle" size={20} color={Colors.dark.accent} />
              <ThemedText style={styles.featureText}>Custom workout plans</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.lg },
        ]}
      >
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.secondaryButtonText}>BACK</ThemedText>
        </Pressable>

        <LinearGradient
          colors={["#FF6B6B", "#FFB347"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButton}
        >
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.primaryButtonInner,
              pressed && styles.buttonPressed,
            ]}
          >
            <ThemedText style={styles.primaryButtonText}>NEXT</ThemedText>
          </Pressable>
        </LinearGradient>
      </View>
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
  progressBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    zIndex: 10,
  },
  progressDots: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 1.5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  dotActive: {
    width: 32,
    backgroundColor: Colors.dark.accent,
  },
  skipText: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  chatContainer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  coachAvatar: {
    width: 40,
    height: 40,
  },
  chatTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  messagesContainer: {
    gap: Spacing.md,
  },
  coachMessage: {
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  coachBubble: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: "85%",
  },
  messageText: {
    ...Typography.small,
    color: Colors.dark.text,
    lineHeight: 18,
  },
  typingIndicator: {
    flexDirection: "row",
    gap: Spacing.xs,
    alignItems: "center",
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.textSecondary,
  },
  userMessage: {
    alignItems: "flex-end",
  },
  userBubble: {
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: "85%",
  },
  userMessageText: {
    ...Typography.small,
    color: "white",
    fontWeight: "600",
    lineHeight: 18,
  },
  suggestionsContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    flexWrap: "wrap",
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  suggestionText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  descriptionSection: {
    gap: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  mainTitle: {
    ...Typography.h1,
    color: Colors.dark.text,
    lineHeight: 40,
  },
  highlightText: {
    color: Colors.dark.accent,
  },
  description: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
  },
  featureList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  primaryButton: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  primaryButtonInner: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    ...Typography.h3,
    color: "white",
    fontWeight: "700",
  },
  secondaryButton: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.text,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...Typography.h3,
    color: Colors.dark.text,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
