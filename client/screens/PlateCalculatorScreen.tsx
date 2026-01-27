import React, { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

interface PlateCount {
  weight: number;
  count: number;
  color: string;
}

const PLATE_COLORS: Record<number, string> = {
  45: "#FF6B6B",
  35: "#FFB347",
  25: "#87CEEB",
  10: "#98D8AA",
  5: "#DDA0DD",
  2.5: "#F0E68C",
};

const KG_PLATE_COLORS: Record<number, string> = {
  25: "#FF6B6B",
  20: "#FFB347",
  15: "#87CEEB",
  10: "#98D8AA",
  5: "#DDA0DD",
  2.5: "#F0E68C",
  1.25: "#C0C0C0",
};

const AVAILABLE_PLATES_LBS = [45, 35, 25, 10, 5, 2.5];
const AVAILABLE_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

const BARBELL_WEIGHT_LBS = 45;
const BARBELL_WEIGHT_KG = 20;

export default function PlateCalculatorScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [targetWeight, setTargetWeight] = useState("");
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");

  const barbellWeight = unit === "lbs" ? BARBELL_WEIGHT_LBS : BARBELL_WEIGHT_KG;
  const availablePlates = unit === "lbs" ? AVAILABLE_PLATES_LBS : AVAILABLE_PLATES_KG;
  const plateColors = unit === "lbs" ? PLATE_COLORS : KG_PLATE_COLORS;

  const plateBreakdown = useMemo((): PlateCount[] => {
    const target = parseFloat(targetWeight);
    if (isNaN(target) || target <= barbellWeight) return [];

    let remainingWeight = (target - barbellWeight) / 2;
    const plates: PlateCount[] = [];

    for (const plateWeight of availablePlates) {
      if (remainingWeight >= plateWeight) {
        const count = Math.floor(remainingWeight / plateWeight);
        plates.push({
          weight: plateWeight,
          count,
          color: plateColors[plateWeight] || "#888",
        });
        remainingWeight -= count * plateWeight;
      }
    }

    return plates;
  }, [targetWeight, unit, barbellWeight, availablePlates, plateColors]);

  const totalWeightOnBar = useMemo(() => {
    const platesWeight = plateBreakdown.reduce(
      (sum, plate) => sum + plate.weight * plate.count * 2,
      0
    );
    return barbellWeight + platesWeight;
  }, [plateBreakdown, barbellWeight]);

  const targetNum = parseFloat(targetWeight);
  const isExactMatch = !isNaN(targetNum) && totalWeightOnBar === targetNum;
  const difference = !isNaN(targetNum) ? targetNum - totalWeightOnBar : 0;

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Plate Calculator</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.unitToggle}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setUnit("lbs");
            }}
            style={[styles.unitButton, unit === "lbs" && styles.unitButtonActive]}
          >
            <ThemedText style={[styles.unitButtonText, unit === "lbs" && styles.unitButtonTextActive]}>
              lbs
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setUnit("kg");
            }}
            style={[styles.unitButton, unit === "kg" && styles.unitButtonActive]}
          >
            <ThemedText style={[styles.unitButtonText, unit === "kg" && styles.unitButtonTextActive]}>
              kg
            </ThemedText>
          </Pressable>
        </View>

        <Card elevation={2} style={styles.inputCard}>
          <ThemedText style={styles.inputLabel}>Target Weight</ThemedText>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.weightInput}
              value={targetWeight}
              onChangeText={setTargetWeight}
              placeholder="0"
              placeholderTextColor={Colors.dark.textSecondary}
              keyboardType="decimal-pad"
            />
            <ThemedText style={styles.unitLabel}>{unit}</ThemedText>
          </View>
          <ThemedText style={styles.barbellNote}>
            Standard barbell: {barbellWeight} {unit}
          </ThemedText>
        </Card>

        {plateBreakdown.length > 0 && (
          <>
            <Card elevation={2} style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <ThemedText style={styles.resultTitle}>Plates Per Side</ThemedText>
                {isExactMatch ? (
                  <View style={styles.exactBadge}>
                    <Feather name="check" size={14} color="#4CAF50" />
                    <ThemedText style={styles.exactBadgeText}>Exact</ThemedText>
                  </View>
                ) : (
                  <View style={styles.diffBadge}>
                    <ThemedText style={styles.diffBadgeText}>
                      {difference > 0 ? `-${difference.toFixed(1)}` : `+${Math.abs(difference).toFixed(1)}`} {unit}
                    </ThemedText>
                  </View>
                )}
              </View>

              <View style={styles.platesList}>
                {plateBreakdown.map((plate, index) => (
                  <View key={index} style={styles.plateRow}>
                    <View style={[styles.plateIndicator, { backgroundColor: plate.color }]} />
                    <ThemedText style={styles.plateWeight}>
                      {plate.weight} {unit}
                    </ThemedText>
                    <ThemedText style={styles.plateCount}>x {plate.count}</ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Total on Bar:</ThemedText>
                <ThemedText style={styles.totalValue}>
                  {totalWeightOnBar} {unit}
                </ThemedText>
              </View>
            </Card>

            <Card elevation={1} style={styles.visualCard}>
              <ThemedText style={styles.visualTitle}>Bar Visualization</ThemedText>
              <View style={styles.barContainer}>
                <View style={styles.barbell}>
                  <View style={styles.barbellEnd} />
                  <View style={styles.platesLeftSide}>
                    {[...plateBreakdown].reverse().map((plate, pIndex) =>
                      Array.from({ length: plate.count }).map((_, i) => (
                        <View
                          key={`left-${pIndex}-${i}`}
                          style={[
                            styles.plateVisual,
                            {
                              backgroundColor: plate.color,
                              height: 30 + plate.weight * 0.8,
                            },
                          ]}
                        />
                      ))
                    )}
                  </View>
                  <View style={styles.barbellBar} />
                  <View style={styles.platesRightSide}>
                    {plateBreakdown.map((plate, pIndex) =>
                      Array.from({ length: plate.count }).map((_, i) => (
                        <View
                          key={`right-${pIndex}-${i}`}
                          style={[
                            styles.plateVisual,
                            {
                              backgroundColor: plate.color,
                              height: 30 + plate.weight * 0.8,
                            },
                          ]}
                        />
                      ))
                    )}
                  </View>
                  <View style={styles.barbellEnd} />
                </View>
              </View>
            </Card>
          </>
        )}

        {targetWeight && parseFloat(targetWeight) > 0 && parseFloat(targetWeight) <= barbellWeight && (
          <Card elevation={1} style={styles.infoCard}>
            <Feather name="info" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.infoText}>
              Target weight must be greater than the barbell weight ({barbellWeight} {unit})
            </ThemedText>
          </Card>
        )}

        <Card elevation={1} style={styles.quickWeightsCard}>
          <ThemedText style={styles.quickWeightsTitle}>Quick Select</ThemedText>
          <View style={styles.quickWeightsGrid}>
            {(unit === "lbs" ? [95, 135, 185, 225, 275, 315, 365, 405] : [40, 60, 80, 100, 120, 140, 160, 180]).map((weight) => (
              <Pressable
                key={weight}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTargetWeight(weight.toString());
                }}
                style={styles.quickWeightButton}
              >
                <ThemedText style={styles.quickWeightText}>{weight}</ThemedText>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>
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
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  unitButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  unitButtonActive: {
    backgroundColor: Colors.dark.accent,
  },
  unitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  unitButtonTextActive: {
    color: "#FFF",
  },
  inputCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  weightInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: "700",
    color: Colors.dark.text,
    padding: 0,
  },
  unitLabel: {
    fontSize: 24,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.sm,
  },
  barbellNote: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  resultCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  exactBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  exactBadgeText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "600",
  },
  diffBadge: {
    backgroundColor: "rgba(255, 107, 107, 0.2)",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  diffBadgeText: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  platesList: {
    marginBottom: Spacing.md,
  },
  plateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  plateIndicator: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: Spacing.md,
  },
  plateWeight: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark.text,
  },
  plateCount: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: Spacing.md,
  },
  totalLabel: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.accent,
  },
  visualCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  visualTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  barContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  barbell: {
    flexDirection: "row",
    alignItems: "center",
  },
  barbellEnd: {
    width: 8,
    height: 20,
    backgroundColor: "#666",
    borderRadius: 2,
  },
  barbellBar: {
    width: 60,
    height: 8,
    backgroundColor: "#888",
  },
  platesLeftSide: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: -2,
  },
  platesRightSide: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: -2,
  },
  plateVisual: {
    width: 8,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  quickWeightsCard: {
    padding: Spacing.lg,
  },
  quickWeightsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  quickWeightsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickWeightButton: {
    backgroundColor: Colors.dark.backgroundDefault,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  quickWeightText: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: "600",
  },
});
