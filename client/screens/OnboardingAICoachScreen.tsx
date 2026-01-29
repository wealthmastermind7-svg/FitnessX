import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useOnboarding } from "@/contexts/OnboardingContext";

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingAICoach">;

export default function OnboardingAICoachScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const handleNext = () => {
    navigation.navigate("OnboardingWorkout");
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.container, { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg }]}>
        <View style={styles.header}>
          <Image source={require("@/assets/images/fitforge-icon.png")} style={styles.headerIcon} />
          <Pressable onPress={handleSkip}>
            <ThemedText style={styles.skipText}>Skip</ThemedText>
          </Pressable>
        </View>

        <ScrollView 
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.chatContainer}>
            <View style={styles.chatBubbleRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Feather name="cpu" size={16} color="white" />
                </View>
              </View>
              <View style={styles.coachBubble}>
                <ThemedText style={styles.coachText}>
                  Hey! I'm your AI fitness coach. I can help you with workout advice, form checks, and recovery strategies.
                </ThemedText>
              </View>
            </View>

            <View style={styles.userBubbleRow}>
              <View style={styles.userBubble}>
                <ThemedText style={styles.userText}>
                  How can I build muscle faster?
                </ThemedText>
              </View>
            </View>

            <View style={styles.chatBubbleRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Feather name="cpu" size={16} color="white" />
                </View>
              </View>
              <View style={styles.typingBubble}>
                <View style={styles.typingDots}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              </View>
            </View>

            <View style={styles.suggestionsRow}>
              <View style={styles.suggestionChip}>
                <ThemedText style={styles.suggestionText}>Best abs workout?</ThemedText>
              </View>
              <View style={styles.suggestionChip}>
                <ThemedText style={styles.suggestionText}>Fix my squat form</ThemedText>
              </View>
            </View>

            <View style={styles.inputBar}>
              <Feather name="plus" size={20} color="#999" />
              <View style={styles.inputPlaceholder} />
              <Feather name="mic" size={20} color="#999" />
            </View>
          </View>
        </ScrollView>

        <View style={styles.descriptionSection}>
          <ThemedText style={styles.mainTitle}>
            <ThemedText style={styles.titleItalic}>Your Personal</ThemedText>
          </ThemedText>
          <ThemedText style={styles.mainTitleBold}>AI Fitness Coach</ThemedText>

          <ThemedText style={styles.description}>
            Get instant expert advice, custom workout plans, and form corrections anytime, anywhere.
          </ThemedText>

          <View style={styles.progressDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
        </View>

        <Pressable
          onPress={handleNext}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <ThemedText style={styles.primaryButtonText}>Continue</ThemedText>
          <Feather name="arrow-right" size={20} color="white" />
        </Pressable>
      </View>

      <View style={styles.homeIndicator} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0221",
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  skipText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "500",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.lg,
  },
  chatContainer: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  chatBubbleRow: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    alignItems: "flex-start",
  },
  avatarContainer: {
    marginRight: Spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
  },
  coachBubble: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    maxWidth: "85%",
  },
  coachText: {
    fontSize: 14,
    color: "white",
    lineHeight: 20,
  },
  userBubbleRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: Spacing.md,
  },
  userBubble: {
    backgroundColor: "#FF6B6B",
    borderRadius: 16,
    borderTopRightRadius: 4,
    padding: 14,
    maxWidth: "75%",
  },
  userText: {
    fontSize: 14,
    color: "white",
    lineHeight: 20,
  },
  typingBubble: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 14,
    paddingHorizontal: 20,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  suggestionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  suggestionChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  suggestionText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.full,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: Spacing.sm,
  },
  inputPlaceholder: {
    flex: 1,
    height: 20,
    backgroundColor: "transparent",
  },
  descriptionSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  mainTitle: {
    fontSize: 28,
    color: "white",
    textAlign: "center",
    lineHeight: 36,
  },
  titleItalic: {
    fontSize: 28,
    fontStyle: "italic",
    color: "white",
    lineHeight: 36,
  },
  mainTitleBold: {
    fontSize: 28,
    fontWeight: "700",
    fontStyle: "italic",
    color: "white",
    marginBottom: Spacing.md,
    lineHeight: 36,
  },
  description: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: Spacing.lg,
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#FF6B6B",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
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
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 3,
  },
});
