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
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useOnboarding } from "@/contexts/OnboardingContext";

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingFoodPlate">;

export default function OnboardingFoodPlateScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const handleNext = () => {
    navigation.navigate("OnboardingProgress");
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
          <View style={styles.plateContainer}>
            <View style={styles.plateImageWrapper}>
              <Image 
                source={{ uri: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80" }} 
                style={styles.plateImage} 
              />
              <View style={styles.scanningOverlay}>
                <View style={styles.scanLine} />
              </View>
              
              {/* Health Score Circle Overlay */}
              <View style={styles.scoreCircleOverlay}>
                <View style={styles.scoreCircle}>
                  <ThemedText style={styles.scoreValue}>85</ThemedText>
                  <ThemedText style={styles.scoreLabel}>Health Score</ThemedText>
                </View>
              </View>

              {/* Labels overlay simulation */}
              <View style={[styles.foodLabel, { top: '20%', left: '15%' }]}>
                <View style={styles.labelDot} />
                <ThemedText style={styles.labelText}>Salmon</ThemedText>
              </View>
              <View style={[styles.foodLabel, { top: '65%', left: '55%' }]}>
                <View style={styles.labelDot} />
                <ThemedText style={styles.labelText}>Mixed Greens</ThemedText>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>450</ThemedText>
                <ThemedText style={styles.statLabel}>Calories</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>30g</ThemedText>
                <ThemedText style={styles.statLabel}>Protein</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>20g</ThemedText>
                <ThemedText style={styles.statLabel}>Carbs</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>25g</ThemedText>
                <ThemedText style={styles.statLabel}>Fat</ThemedText>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.descriptionSection}>
          <ThemedText style={styles.mainTitle}>
            <ThemedText style={styles.titleItalic}>Analyze Your</ThemedText>
          </ThemedText>
          <ThemedText style={styles.mainTitleBold}>Food Plate</ThemedText>

          <ThemedText style={styles.description}>
            Snap a photo of your meal and get instant nutritional breakdowns and AI-powered health scoring.
          </ThemedText>

          <View style={styles.progressDots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
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
    justifyContent: 'center',
    flexGrow: 1,
  },
  plateContainer: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: 32,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
    alignItems: 'center',
  },
  plateImageWrapper: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  scoreCircleOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(13, 2, 33, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  scoreLabel: {
    fontSize: 10,
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  plateImage: {
    width: '100%',
    height: '100%',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  scanLine: {
    height: 2,
    backgroundColor: '#FF6B6B',
    width: '100%',
    position: 'absolute',
    top: '40%',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  foodLabel: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginRight: 6,
  },
  labelText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
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
