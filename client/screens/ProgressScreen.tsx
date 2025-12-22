import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;
const CHART_HEIGHT = 180;

interface ProgressEntry {
  id: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
  };
  heartRate?: number;
}

const STORAGE_KEY = "@fitforge_progress";

export default function ProgressScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<ProgressEntry>>({});
  const [activeTab, setActiveTab] = useState<"weight" | "measurements" | "heart">("weight");

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      } else {
        const sampleEntries: ProgressEntry[] = [
          { id: "1", date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), weight: 82, heartRate: 96 },
          { id: "2", date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), weight: 81.5, heartRate: 98 },
          { id: "3", date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), weight: 81, heartRate: 96 },
          { id: "4", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), weight: 80.5, heartRate: 100 },
          { id: "5", date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), weight: 80, heartRate: 100 },
        ];
        setEntries(sampleEntries);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sampleEntries));
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const saveEntry = async () => {
    if (!newEntry.weight && !newEntry.heartRate) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const entry: ProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...newEntry,
    };
    
    const newEntries = [entry, ...entries];
    setEntries(newEntries);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    setNewEntry({});
    setShowAddModal(false);
  };

  const getChartData = (key: "weight" | "heartRate") => {
    const data = entries
      .filter((e) => e[key] !== undefined)
      .slice(0, 7)
      .reverse();
    
    if (data.length === 0) return { points: [], min: 0, max: 100, labels: [] };
    
    const values = data.map((e) => e[key] as number);
    const min = Math.min(...values) - 2;
    const max = Math.max(...values) + 2;
    
    const points = data.map((entry, idx) => ({
      x: (idx / (data.length - 1 || 1)) * CHART_WIDTH,
      y: CHART_HEIGHT - ((entry[key] as number - min) / (max - min)) * CHART_HEIGHT,
      value: entry[key] as number,
      date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));
    
    return { points, min, max, labels: data.map((e) => new Date(e.date).getDate()) };
  };

  const renderChart = (data: ReturnType<typeof getChartData>, color: string, label: string) => {
    if (data.points.length < 2) {
      return (
        <View style={styles.emptyChart}>
          <ThemedText style={styles.emptyChartText}>
            Need at least 2 entries to show chart
          </ThemedText>
        </View>
      );
    }

    const pathData = data.points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const areaPath = `${pathData} L ${data.points[data.points.length - 1].x} ${CHART_HEIGHT} L 0 ${CHART_HEIGHT} Z`;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <ThemedText style={styles.chartLabel}>{label}</ThemedText>
          <View style={styles.currentValue}>
            <ThemedText style={[styles.currentValueText, { color }]}>
              {data.points[data.points.length - 1]?.value}
            </ThemedText>
            {data.points.length >= 2 && (
              <ThemedText style={styles.changeText}>
                ({data.points[data.points.length - 1].value - data.points[0].value > 0 ? "+" : ""}
                {(data.points[data.points.length - 1].value - data.points[0].value).toFixed(1)})
              </ThemedText>
            )}
          </View>
        </View>
        <View style={styles.chart}>
          <View style={[styles.chartArea, { backgroundColor: color + "20" }]} />
          {data.points.map((point, idx) => (
            <View
              key={idx}
              style={[
                styles.chartPoint,
                {
                  left: point.x - 6,
                  top: point.y - 6,
                  backgroundColor: color,
                },
              ]}
            />
          ))}
          {data.points.map((point, idx) =>
            idx < data.points.length - 1 ? (
              <View
                key={`line-${idx}`}
                style={[
                  styles.chartLine,
                  {
                    left: point.x,
                    top: Math.min(point.y, data.points[idx + 1].y),
                    width: Math.sqrt(
                      Math.pow(data.points[idx + 1].x - point.x, 2) +
                        Math.pow(data.points[idx + 1].y - point.y, 2)
                    ),
                    transform: [
                      {
                        rotate: `${Math.atan2(
                          data.points[idx + 1].y - point.y,
                          data.points[idx + 1].x - point.x
                        )}rad`,
                      },
                    ],
                    transformOrigin: "left center",
                    backgroundColor: color,
                  },
                ]}
              />
            ) : null
          )}
        </View>
        <View style={styles.chartLabels}>
          {data.points.map((point, idx) => (
            <ThemedText key={idx} style={styles.chartLabelText}>
              {point.date.split(" ")[1]}
            </ThemedText>
          ))}
        </View>
      </View>
    );
  };

  const latestWeight = entries.find((e) => e.weight)?.weight;
  const firstWeight = [...entries].reverse().find((e) => e.weight)?.weight;
  const weightChange = latestWeight && firstWeight ? latestWeight - firstWeight : 0;

  const MEASUREMENTS = [
    { key: "chest", label: "Chest", icon: "maximize-2" },
    { key: "waist", label: "Waist", icon: "minimize-2" },
    { key: "hips", label: "Hips", icon: "circle" },
    { key: "biceps", label: "Biceps", icon: "activity" },
    { key: "thighs", label: "Thighs", icon: "move" },
  ];

  if (showAddModal) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowAddModal(false);
            }}
          >
            <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>Add Entry</ThemedText>
          <Pressable onPress={saveEntry}>
            <ThemedText style={styles.saveButton}>Save</ThemedText>
          </Pressable>
        </View>

        <ScrollView
          style={styles.modalContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        >
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Weight (kg)</ThemedText>
            <TextInput
              style={styles.input}
              value={newEntry.weight?.toString() || ""}
              onChangeText={(text) =>
                setNewEntry({ ...newEntry, weight: parseFloat(text) || undefined })
              }
              keyboardType="decimal-pad"
              placeholder="Enter weight"
              placeholderTextColor={Colors.dark.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Resting Heart Rate (bpm)</ThemedText>
            <TextInput
              style={styles.input}
              value={newEntry.heartRate?.toString() || ""}
              onChangeText={(text) =>
                setNewEntry({ ...newEntry, heartRate: parseInt(text) || undefined })
              }
              keyboardType="number-pad"
              placeholder="Enter heart rate"
              placeholderTextColor={Colors.dark.textSecondary}
            />
          </View>

          <ThemedText style={styles.sectionLabel}>Body Measurements (cm)</ThemedText>
          {MEASUREMENTS.map((m) => (
            <View key={m.key} style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>{m.label}</ThemedText>
              <TextInput
                style={styles.input}
                value={
                  newEntry.measurements?.[m.key as keyof typeof newEntry.measurements]?.toString() || ""
                }
                onChangeText={(text) =>
                  setNewEntry({
                    ...newEntry,
                    measurements: {
                      ...newEntry.measurements,
                      [m.key]: parseFloat(text) || undefined,
                    },
                  })
                }
                keyboardType="decimal-pad"
                placeholder={`Enter ${m.label.toLowerCase()}`}
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
          ))}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Progress</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Current Weight</ThemedText>
            <ThemedText style={styles.statValue}>
              {latestWeight?.toFixed(1) || "--"} kg
            </ThemedText>
            {weightChange !== 0 && (
              <ThemedText
                style={[
                  styles.statChange,
                  { color: weightChange < 0 ? Colors.dark.success : Colors.dark.accent },
                ]}
              >
                {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg
              </ThemedText>
            )}
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statLabel}>Heart Rate</ThemedText>
            <ThemedText style={styles.statValue}>
              {entries.find((e) => e.heartRate)?.heartRate || "--"} bpm
            </ThemedText>
            <ThemedText style={styles.statSubtext}>Last recorded</ThemedText>
          </View>
        </View>

        <View style={styles.tabsContainer}>
          {[
            { key: "weight", label: "Weight" },
            { key: "measurements", label: "Body" },
            { key: "heart", label: "Heart Rate" },
          ].map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key as typeof activeTab);
              }}
            >
              <ThemedText
                style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {activeTab === "weight" && (
          <View style={styles.chartCard}>
            {renderChart(getChartData("weight"), "#4ECDC4", "Weight (kg)")}
          </View>
        )}

        {activeTab === "heart" && (
          <View style={styles.chartCard}>
            {renderChart(getChartData("heartRate"), "#FF6B6B", "Heart Rate (bpm)")}
          </View>
        )}

        {activeTab === "measurements" && (
          <View style={styles.measurementsGrid}>
            {MEASUREMENTS.map((m) => {
              const latestMeasurement = entries.find(
                (e) => e.measurements?.[m.key as keyof ProgressEntry["measurements"]]
              )?.measurements?.[m.key as keyof ProgressEntry["measurements"]];
              return (
                <View key={m.key} style={styles.measurementCard}>
                  <Feather
                    name={m.icon as any}
                    size={20}
                    color={Colors.dark.accent}
                  />
                  <ThemedText style={styles.measurementLabel}>{m.label}</ThemedText>
                  <ThemedText style={styles.measurementValue}>
                    {latestMeasurement || "--"} cm
                  </ThemedText>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.historySection}>
          <ThemedText style={styles.sectionTitle}>History</ThemedText>
          {entries.slice(0, 10).map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <ThemedText style={styles.historyDate}>
                {new Date(entry.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </ThemedText>
              <View style={styles.historyValues}>
                {entry.weight && (
                  <View style={styles.historyValue}>
                    <ThemedText style={styles.historyValueLabel}>Weight</ThemedText>
                    <ThemedText style={styles.historyValueText}>
                      {entry.weight} kg
                    </ThemedText>
                  </View>
                )}
                {entry.heartRate && (
                  <View style={styles.historyValue}>
                    <ThemedText style={styles.historyValueLabel}>HR</ThemedText>
                    <ThemedText style={styles.historyValueText}>
                      {entry.heartRate} bpm
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowAddModal(true);
        }}
      >
        <LinearGradient
          colors={[Colors.dark.accent, "#E55A5A"]}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={28} color="#fff" />
        </LinearGradient>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  cancelButton: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  saveButton: {
    ...Typography.body,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  statLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  statChange: {
    ...Typography.small,
    marginTop: Spacing.xs,
  },
  statSubtext: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    marginTop: Spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  tabText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  tabTextActive: {
    color: Colors.dark.text,
    fontWeight: "600",
  },
  chartCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  chartContainer: {
    height: CHART_HEIGHT + 80,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  chartLabel: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  currentValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  currentValueText: {
    ...Typography.h2,
  },
  changeText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  chart: {
    height: CHART_HEIGHT,
    position: "relative",
  },
  chartArea: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CHART_HEIGHT,
    borderRadius: BorderRadius.sm,
  },
  chartPoint: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.dark.backgroundDefault,
  },
  chartLine: {
    position: "absolute",
    height: 2,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  chartLabelText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChartText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  measurementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  measurementCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  measurementLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  measurementValue: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.xs,
  },
  historySection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  historyCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  historyValues: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  historyValue: {
    alignItems: "flex-end",
  },
  historyValueLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  historyValueText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.body,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.dark.text,
    ...Typography.body,
  },
  fab: {
    position: "absolute",
    right: Spacing.lg,
    borderRadius: 28,
    overflow: "hidden",
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
