import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Circle, Line, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { useOnboarding } from "@/contexts/OnboardingContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 120;
const CHART_HEIGHT = 120;

type OnboardingNavigationProp = NativeStackNavigationProp<any, "OnboardingProgress">;

const progressData = [
  { date: "Jan 27", weight: 32 },
  { date: "Feb 15", weight: 35 },
  { date: "Mar 10", weight: 38 },
  { date: "Apr 5", weight: 42 },
  { date: "May 12", weight: 45 },
  { date: "Jun 18", weight: 48 },
  { date: "Jul 22", weight: 50 },
  { date: "Aug 15", weight: 54 },
  { date: "Sep 21", weight: 57 },
];

function MiniChart() {
  const minWeight = 29;
  const maxWeight = 60;
  const range = maxWeight - minWeight;

  const points = progressData.map((d, i) => ({
    x: (i / (progressData.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - ((d.weight - minWeight) / range) * CHART_HEIGHT,
  }));

  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (point.x - prev.x) / 3;
    const cp2x = prev.x + 2 * (point.x - prev.x) / 3;
    return `${acc} C ${cp1x} ${prev.y}, ${cp2x} ${point.y}, ${point.x} ${point.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

  return (
    <View style={styles.chartWrapper}>
      <View style={styles.yAxis}>
        <ThemedText style={styles.yAxisLabel}>60 kg</ThemedText>
        <ThemedText style={styles.yAxisLabel}>40 kg</ThemedText>
        <ThemedText style={styles.yAxisLabel}>29 kg</ThemedText>
      </View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 25}>
        <Defs>
          <SvgLinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.4" />
            <Stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {[0, 0.5, 1].map((ratio, i) => (
          <Line
            key={i}
            x1={0}
            y1={ratio * CHART_HEIGHT}
            x2={CHART_WIDTH}
            y2={ratio * CHART_HEIGHT}
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        <Path d={areaD} fill="url(#areaGrad)" />
        <Path d={pathD} stroke="#FF6B6B" strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {points.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={i === points.length - 1 ? 6 : 3}
            fill={i === points.length - 1 ? "#FF6B6B" : "#FFF"}
            stroke="#FF6B6B"
            strokeWidth={2}
          />
        ))}
      </Svg>
      <View style={styles.xAxis}>
        <ThemedText style={styles.xAxisLabel}>Jan 27</ThemedText>
        <ThemedText style={styles.xAxisLabel}>May 32</ThemedText>
        <ThemedText style={styles.xAxisLabel}>Sep 21</ThemedText>
      </View>
    </View>
  );
}

export default function OnboardingProgressScreen() {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();

  const handleNext = () => {
    navigation.navigate("OnboardingFoodPlate" as any);
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
          <View style={styles.cardContainer}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIconWrapper}>
                <Feather name="activity" size={20} color="#FF6B6B" />
              </View>
              <ThemedText style={styles.exerciseName}>Bench Press (Barbell)</ThemedText>
            </View>

            <View style={styles.currentStats}>
              <ThemedText style={styles.currentWeight}>57 kg</ThemedText>
              <ThemedText style={styles.currentDate}>September 21</ThemedText>
            </View>

            <MiniChart />

            <View style={styles.metricTabs}>
              <View style={[styles.metricTab, styles.metricTabActive]}>
                <ThemedText style={[styles.metricTabText, styles.metricTabTextActive]}>Heaviest Weight</ThemedText>
              </View>
              <View style={styles.metricTab}>
                <ThemedText style={styles.metricTabText}>One Rep Max</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.paginationDots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
        </ScrollView>

        <View style={styles.descriptionSection}>
          <ThemedText style={styles.mainTitle}>Measure progress</ThemedText>
          <ThemedText style={styles.description}>
            Analyze your workout history with in depth analytics.
          </ThemedText>

          <View style={styles.progressDots}>
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
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
    backgroundColor: "#F5F5F7",
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
  },
  skipText: {
    fontSize: 16,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.lg,
    justifyContent: "center",
    flexGrow: 1,
  },
  cardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exerciseIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
  },
  currentStats: {
    marginBottom: Spacing.sm,
  },
  currentWeight: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  currentDate: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  chartWrapper: {
    marginVertical: Spacing.sm,
  },
  yAxis: {
    position: "absolute",
    left: 0,
    top: 0,
    height: CHART_HEIGHT,
    justifyContent: "space-between",
    width: 45,
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#AAA",
  },
  xAxis: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 50,
    marginTop: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    color: "#AAA",
  },
  metricTabs: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  metricTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: "#F0F0F0",
  },
  metricTabActive: {
    backgroundColor: "#FF6B6B",
  },
  metricTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  metricTabTextActive: {
    color: "#FFF",
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#FF6B6B",
  },
  descriptionSection: {
    alignItems: "center",
    marginVertical: Spacing.xl,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
    marginBottom: Spacing.lg,
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  progressDotActive: {
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
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 3,
  },
});
