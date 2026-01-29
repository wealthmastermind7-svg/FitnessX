import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 4;
const CHART_HEIGHT = 180;

interface ExerciseProgress {
  id: string;
  name: string;
  icon: string;
  currentWeight: number;
  date: string;
  oneRepMax: number;
  totalVolume: number;
  history: { date: string; weight: number }[];
}

const SAMPLE_EXERCISES: ExerciseProgress[] = [
  {
    id: "1",
    name: "Bench Press (Barbell)",
    icon: "https://api.exercisedb.io/image/4bv3r4/0025",
    currentWeight: 57,
    date: "September 21",
    oneRepMax: 68,
    totalVolume: 12500,
    history: [
      { date: "Jan 27", weight: 32 },
      { date: "Feb 15", weight: 35 },
      { date: "Mar 10", weight: 38 },
      { date: "Apr 5", weight: 42 },
      { date: "May 32", weight: 45 },
      { date: "Jun 18", weight: 48 },
      { date: "Jul 22", weight: 50 },
      { date: "Aug 15", weight: 54 },
      { date: "Sep 21", weight: 57 },
    ],
  },
  {
    id: "2",
    name: "Squat (Barbell)",
    icon: "https://api.exercisedb.io/image/4bv3r4/0043",
    currentWeight: 85,
    date: "September 20",
    oneRepMax: 102,
    totalVolume: 18200,
    history: [
      { date: "Jan 27", weight: 50 },
      { date: "Feb 15", weight: 55 },
      { date: "Mar 10", weight: 62 },
      { date: "Apr 5", weight: 68 },
      { date: "May 32", weight: 72 },
      { date: "Jun 18", weight: 76 },
      { date: "Jul 22", weight: 80 },
      { date: "Aug 15", weight: 82 },
      { date: "Sep 20", weight: 85 },
    ],
  },
  {
    id: "3",
    name: "Deadlift (Barbell)",
    icon: "https://api.exercisedb.io/image/4bv3r4/0032",
    currentWeight: 120,
    date: "September 19",
    oneRepMax: 145,
    totalVolume: 24800,
    history: [
      { date: "Jan 27", weight: 70 },
      { date: "Feb 15", weight: 78 },
      { date: "Mar 10", weight: 85 },
      { date: "Apr 5", weight: 92 },
      { date: "May 32", weight: 100 },
      { date: "Jun 18", weight: 105 },
      { date: "Jul 22", weight: 112 },
      { date: "Aug 15", weight: 116 },
      { date: "Sep 19", weight: 120 },
    ],
  },
];

type MetricType = "heaviest" | "oneRepMax" | "volume";

function ProgressChart({ data, color }: { data: { date: string; weight: number }[]; color: string }) {
  if (!data || data.length === 0) return null;

  const minWeight = Math.min(...data.map(d => d.weight)) - 5;
  const maxWeight = Math.max(...data.map(d => d.weight)) + 5;
  const range = maxWeight - minWeight;

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * CHART_WIDTH,
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
    <View style={styles.chartContainer}>
      <View style={styles.yAxisLabels}>
        <ThemedText style={styles.axisLabel}>{maxWeight} kg</ThemedText>
        <ThemedText style={styles.axisLabel}>{Math.round((maxWeight + minWeight) / 2)} kg</ThemedText>
        <ThemedText style={styles.axisLabel}>{minWeight} kg</ThemedText>
      </View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
        <Defs>
          <SvgLinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <Stop offset="100%" stopColor={color} stopOpacity="0" />
          </SvgLinearGradient>
        </Defs>

        {[0, 0.5, 1].map((ratio, i) => (
          <Line
            key={i}
            x1={0}
            y1={ratio * CHART_HEIGHT}
            x2={CHART_WIDTH}
            y2={ratio * CHART_HEIGHT}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
        ))}

        <Path d={areaD} fill="url(#areaGradient)" />
        <Path d={pathD} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />

        {points.map((point, i) => (
          <Circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={i === points.length - 1 ? 8 : 4}
            fill={i === points.length - 1 ? color : "rgba(255,255,255,0.8)"}
            stroke={color}
            strokeWidth={2}
          />
        ))}

        {data.filter((_, i) => i === 0 || i === Math.floor(data.length / 2) || i === data.length - 1).map((d, idx) => {
          const actualIndex = idx === 0 ? 0 : idx === 1 ? Math.floor(data.length / 2) : data.length - 1;
          return (
            <SvgText
              key={idx}
              x={points[actualIndex].x}
              y={CHART_HEIGHT + 20}
              fontSize={11}
              fill="rgba(255,255,255,0.5)"
              textAnchor="middle"
            >
              {d.date}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

export default function ProgressAnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("heaviest");
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentExercise = SAMPLE_EXERCISES[currentIndex];

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (SCREEN_WIDTH - Spacing.lg * 2));
    if (index !== currentIndex && index >= 0 && index < SAMPLE_EXERCISES.length) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(index);
    }
  };

  const getMetricValue = (exercise: ExerciseProgress) => {
    switch (selectedMetric) {
      case "heaviest":
        return `${exercise.currentWeight} kg`;
      case "oneRepMax":
        return `${exercise.oneRepMax} kg`;
      case "volume":
        return `${(exercise.totalVolume / 1000).toFixed(1)}k kg`;
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "heaviest":
        return "Heaviest Weight";
      case "oneRepMax":
        return "One Rep Max";
      case "volume":
        return "Total Volume";
    }
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={["#0D0221", "#1A0B2E", "#2C124B"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Progress Analytics</ThemedText>
        <View style={styles.proBadge}>
          <ThemedText style={styles.proBadgeText}>PRO</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <ThemedText style={styles.mainTitle}>Measure progress</ThemedText>
          <ThemedText style={styles.subtitle}>
            Analyze your workout history with in-depth analytics.
          </ThemedText>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.exerciseIconPlaceholder}>
                <Feather name="activity" size={24} color="#FF6B6B" />
              </View>
              <ThemedText style={styles.exerciseName}>{currentExercise.name}</ThemedText>
            </View>

            <View style={styles.currentStats}>
              <ThemedText style={styles.currentWeight}>
                {getMetricValue(currentExercise)}
              </ThemedText>
              <ThemedText style={styles.currentDate}>{currentExercise.date}</ThemedText>
            </View>

            <ProgressChart data={currentExercise.history} color="#FF6B6B" />

            <View style={styles.metricTabs}>
              {(["heaviest", "oneRepMax", "volume"] as MetricType[]).map((metric) => (
                <Pressable
                  key={metric}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMetric(metric);
                  }}
                  style={[
                    styles.metricTab,
                    selectedMetric === metric && styles.metricTabActive,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.metricTabText,
                      selectedMetric === metric && styles.metricTabTextActive,
                    ]}
                  >
                    {metric === "heaviest" ? "Heaviest Weight" : metric === "oneRepMax" ? "One Rep Max" : "Volume"}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.paginationDots}>
          {SAMPLE_EXERCISES.map((_, idx) => (
            <Pressable
              key={idx}
              onPress={() => {
                setCurrentIndex(idx);
                scrollRef.current?.scrollTo({ x: idx * (SCREEN_WIDTH - Spacing.lg * 2), animated: true });
              }}
            >
              <View
                style={[
                  styles.dot,
                  currentIndex === idx && styles.dotActive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        <View style={styles.insightsSection}>
          <ThemedText style={styles.sectionTitle}>AI Insights</ThemedText>
          
          <View style={styles.insightCard}>
            <LinearGradient
              colors={["rgba(255, 107, 107, 0.15)", "rgba(255, 107, 107, 0.05)"]}
              style={styles.insightGradient}
            >
              <View style={styles.insightIcon}>
                <Feather name="trending-up" size={20} color="#FF6B6B" />
              </View>
              <View style={styles.insightContent}>
                <ThemedText style={styles.insightTitle}>Strong Progress</ThemedText>
                <ThemedText style={styles.insightText}>
                  Your {currentExercise.name.split(" ")[0]} has increased by {Math.round(((currentExercise.currentWeight - currentExercise.history[0].weight) / currentExercise.history[0].weight) * 100)}% over the last 9 months. Keep up the consistency!
                </ThemedText>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.insightCard}>
            <LinearGradient
              colors={["rgba(78, 205, 196, 0.15)", "rgba(78, 205, 196, 0.05)"]}
              style={styles.insightGradient}
            >
              <View style={[styles.insightIcon, { backgroundColor: "rgba(78, 205, 196, 0.2)" }]}>
                <Feather name="target" size={20} color="#4ECDC4" />
              </View>
              <View style={styles.insightContent}>
                <ThemedText style={styles.insightTitle}>Next Milestone</ThemedText>
                <ThemedText style={styles.insightText}>
                  You're {currentExercise.oneRepMax - currentExercise.currentWeight} kg away from your projected one rep max. Focus on progressive overload to get there.
                </ThemedText>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Feather name="award" size={24} color="#FF6B6B" />
            <ThemedText style={styles.statValue}>{SAMPLE_EXERCISES.length}</ThemedText>
            <ThemedText style={styles.statLabel}>Exercises Tracked</ThemedText>
          </View>
          <View style={styles.statCard}>
            <Feather name="calendar" size={24} color="#4ECDC4" />
            <ThemedText style={styles.statValue}>9</ThemedText>
            <ThemedText style={styles.statLabel}>Months Active</ThemedText>
          </View>
          <View style={styles.statCard}>
            <Feather name="zap" size={24} color="#FFE66D" />
            <ThemedText style={styles.statValue}>78%</ThemedText>
            <ThemedText style={styles.statLabel}>Avg Progress</ThemedText>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.exerciseScroll}
          contentContainerStyle={styles.exerciseScrollContent}
        >
          {SAMPLE_EXERCISES.map((exercise, idx) => (
            <Pressable
              key={exercise.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentIndex(idx);
              }}
              style={[
                styles.exerciseScrollCard,
                currentIndex === idx && styles.exerciseScrollCardActive,
              ]}
            >
              <View style={styles.exerciseScrollIcon}>
                <Feather name="activity" size={20} color={currentIndex === idx ? "#FF6B6B" : Colors.dark.textSecondary} />
              </View>
              <ThemedText 
                style={[
                  styles.exerciseScrollName,
                  currentIndex === idx && styles.exerciseScrollNameActive,
                ]}
                numberOfLines={1}
              >
                {exercise.name}
              </ThemedText>
              <ThemedText style={styles.exerciseScrollWeight}>{exercise.currentWeight} kg</ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  proBadge: {
    backgroundColor: "rgba(157, 78, 221, 0.3)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9D4EDD",
    letterSpacing: 1,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  cardContainer: {
    paddingHorizontal: Spacing.lg,
  },
  exerciseCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 24,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  exerciseIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 107, 107, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
    flex: 1,
  },
  currentStats: {
    marginBottom: Spacing.md,
  },
  currentWeight: {
    fontSize: 32,
    fontWeight: "800",
    color: "#1A1A2E",
  },
  currentDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginVertical: Spacing.md,
  },
  yAxisLabels: {
    width: 50,
    height: CHART_HEIGHT,
    justifyContent: "space-between",
    paddingRight: Spacing.xs,
  },
  axisLabel: {
    fontSize: 10,
    color: "#999",
    textAlign: "right",
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  dotActive: {
    width: 24,
    backgroundColor: "#FF6B6B",
  },
  insightsSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  insightCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  insightGradient: {
    flexDirection: "row",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: Colors.dark.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  exerciseScroll: {
    marginTop: Spacing.xl,
  },
  exerciseScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  exerciseScrollCard: {
    width: 140,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    marginRight: Spacing.md,
  },
  exerciseScrollCardActive: {
    backgroundColor: "rgba(255, 107, 107, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.3)",
  },
  exerciseScrollIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  exerciseScrollName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: 4,
  },
  exerciseScrollNameActive: {
    color: Colors.dark.text,
  },
  exerciseScrollWeight: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B6B",
  },
});
