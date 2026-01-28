import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ReadinessData {
  score: number;
  sleepQuality: number;
  recoveryStatus: number;
  stressLevel: number;
  lastWorkoutHoursAgo: number;
  recommendation: string;
  workoutType: "intense" | "moderate" | "light" | "recovery";
}

const IDENTITY_MODES = [
  {
    id: "disciplined",
    name: "Disciplined Athlete",
    icon: "target",
    color: "#FF6B6B",
    description: "Push your limits today",
  },
  {
    id: "calm",
    name: "Calm Builder",
    icon: "sunrise",
    color: "#4ECDC4",
    description: "Steady progress, no rush",
  },
  {
    id: "burn",
    name: "Burn It Out",
    icon: "zap",
    color: "#FFB347",
    description: "Maximum intensity",
  },
  {
    id: "recovery",
    name: "Recovery Guardian",
    icon: "heart",
    color: "#9D4EDD",
    description: "Rest and restore",
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function calculateReadiness(): ReadinessData {
  const now = new Date();
  const hour = now.getHours();
  
  const sleepQuality = 65 + Math.floor(Math.random() * 30);
  const recoveryStatus = 60 + Math.floor(Math.random() * 35);
  const stressLevel = 20 + Math.floor(Math.random() * 40);
  const lastWorkoutHoursAgo = 12 + Math.floor(Math.random() * 36);
  
  const recoveryBonus = lastWorkoutHoursAgo > 24 ? 10 : lastWorkoutHoursAgo > 48 ? 15 : 0;
  const stressPenalty = stressLevel > 50 ? (stressLevel - 50) * 0.3 : 0;
  
  let score = Math.round(
    (sleepQuality * 0.35) + 
    (recoveryStatus * 0.35) + 
    ((100 - stressLevel) * 0.2) +
    recoveryBonus - 
    stressPenalty
  );
  
  score = Math.max(20, Math.min(100, score));
  
  let recommendation: string;
  let workoutType: ReadinessData["workoutType"];
  
  if (score >= 85) {
    recommendation = "Your body is fully recovered. Perfect day for high-intensity training!";
    workoutType = "intense";
  } else if (score >= 70) {
    recommendation = "Good recovery. You can push moderately today.";
    workoutType = "moderate";
  } else if (score >= 50) {
    recommendation = "Partial recovery. Consider lighter training or skill work.";
    workoutType = "light";
  } else {
    recommendation = "Your nervous system needs rest. Focus on mobility and recovery.";
    workoutType = "recovery";
  }
  
  return {
    score,
    sleepQuality,
    recoveryStatus,
    stressLevel,
    lastWorkoutHoursAgo,
    recommendation,
    workoutType,
  };
}

function ReadinessRing({ score, size = 120 }: { score: number; size?: number }) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [score]);
  
  const getScoreColor = () => {
    if (score >= 85) return "#4ECDC4";
    if (score >= 70) return "#6BCB77";
    if (score >= 50) return "#FFB347";
    return "#FF6B6B";
  };
  
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      <View style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: "rgba(255,255,255,0.1)",
      }} />
      <View style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: getScoreColor(),
        borderRightColor: "transparent",
        borderBottomColor: score < 75 ? "transparent" : getScoreColor(),
        borderLeftColor: score < 50 ? "transparent" : getScoreColor(),
        borderTopColor: score < 25 ? "transparent" : getScoreColor(),
        transform: [{ rotate: "-90deg" }],
      }} />
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <ThemedText style={{ fontSize: 32, fontWeight: "800", color: getScoreColor(), lineHeight: 32, textAlign: "center", height: 32 }}>
          {score}
        </ThemedText>
        <ThemedText style={{ fontSize: 10, color: Colors.dark.textSecondary, marginTop: 2, textAlign: "center" }}>
          READINESS
        </ThemedText>
      </View>
    </View>
  );
}

function MetricBar({ label, value, icon, color }: { label: string; value: number; icon: keyof typeof Feather.glyphMap; color: string }) {
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricLabelRow}>
        <Feather name={icon} size={14} color={color} />
        <ThemedText style={styles.metricLabel}>{label}</ThemedText>
      </View>
      <View style={styles.metricBarBg}>
        <View style={[styles.metricBarFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <ThemedText style={[styles.metricValue, { color }]}>{value}%</ThemedText>
    </View>
  );
}

export default function ReadinessWidget() {
  const navigation = useNavigation<NavigationProp>();
  const [readiness, setReadiness] = useState<ReadinessData | null>(null);
  const [selectedMode, setSelectedMode] = useState<string>("disciplined");
  const [showModes, setShowModes] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    loadReadiness();
  }, []);
  
  const loadReadiness = async () => {
    try {
      const cached = await AsyncStorage.getItem("readinessData");
      const cachedTime = await AsyncStorage.getItem("readinessTime");
      
      if (cached && cachedTime) {
        const timeDiff = Date.now() - parseInt(cachedTime);
        if (timeDiff < 4 * 60 * 60 * 1000) {
          setReadiness(JSON.parse(cached));
          return;
        }
      }
      
      const newReadiness = calculateReadiness();
      setReadiness(newReadiness);
      await AsyncStorage.setItem("readinessData", JSON.stringify(newReadiness));
      await AsyncStorage.setItem("readinessTime", Date.now().toString());
    } catch (error) {
      const newReadiness = calculateReadiness();
      setReadiness(newReadiness);
    }
  };
  
  const handleModeSelect = (modeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMode(modeId);
    setShowModes(false);
  };
  
  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    
    const newReadiness = calculateReadiness();
    setReadiness(newReadiness);
    await AsyncStorage.setItem("readinessData", JSON.stringify(newReadiness));
    await AsyncStorage.setItem("readinessTime", Date.now().toString());
  };
  
  const currentMode = IDENTITY_MODES.find(m => m.id === selectedMode) || IDENTITY_MODES[0];
  
  if (!readiness) {
    return null;
  }
  
  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.card}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.headerLabel}>TODAY'S READINESS</ThemedText>
            <ThemedText style={styles.headerTitle}>Body Intelligence</ThemedText>
          </View>
          <Pressable onPress={handleRefresh} style={styles.refreshButton}>
            <Feather name="refresh-cw" size={18} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>
        
        <View style={styles.mainContent}>
          <ReadinessRing score={readiness.score} />
          
          <View style={styles.metricsContainer}>
            <MetricBar 
              label="Sleep" 
              value={readiness.sleepQuality} 
              icon="moon" 
              color="#9D4EDD" 
            />
            <MetricBar 
              label="Recovery" 
              value={readiness.recoveryStatus} 
              icon="heart" 
              color="#4ECDC4" 
            />
            <MetricBar 
              label="Stress" 
              value={100 - readiness.stressLevel} 
              icon="activity" 
              color="#FFB347" 
            />
          </View>
        </View>
        
        <View style={styles.recommendationBox}>
          <LinearGradient
            colors={[`${currentMode.color}20`, `${currentMode.color}10`]}
            style={styles.recommendationGradient}
          >
            <Feather name="cpu" size={16} color={currentMode.color} />
            <ThemedText style={styles.recommendationText}>
              {readiness.recommendation}
            </ThemedText>
          </LinearGradient>
        </View>
        
        <View style={styles.divider} />
        
        <Pressable 
          onPress={() => setShowModes(!showModes)} 
          style={styles.modeSelector}
        >
          <View style={styles.modeSelectorLeft}>
            <View style={[styles.modeIcon, { backgroundColor: `${currentMode.color}30` }]}>
              <Feather name={currentMode.icon as any} size={18} color={currentMode.color} />
            </View>
            <View>
              <ThemedText style={styles.modeSelectorLabel}>TRAINING IDENTITY</ThemedText>
              <ThemedText style={styles.modeSelectorValue}>{currentMode.name}</ThemedText>
            </View>
          </View>
          <Feather name={showModes ? "chevron-up" : "chevron-down"} size={20} color={Colors.dark.textSecondary} />
        </Pressable>
        
        {showModes && (
          <View style={styles.modesGrid}>
            {IDENTITY_MODES.map((mode) => (
              <Pressable
                key={mode.id}
                onPress={() => handleModeSelect(mode.id)}
                style={[
                  styles.modeCard,
                  selectedMode === mode.id && { borderColor: mode.color },
                ]}
              >
                <View style={[styles.modeCardIcon, { backgroundColor: `${mode.color}30` }]}>
                  <Feather name={mode.icon as any} size={20} color={mode.color} />
                </View>
                <ThemedText style={styles.modeCardName}>{mode.name}</ThemedText>
                <ThemedText style={styles.modeCardDesc}>{mode.description}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}
        
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            navigation.navigate("HealthSync");
          }}
          style={styles.syncButton}
        >
          <LinearGradient
            colors={["#FF6B6B", "#FF4B4B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.syncButtonGradient}
          >
            <Feather name="activity" size={18} color="#FFF" />
            <ThemedText style={styles.syncButtonText}>Sync Health Data</ThemedText>
          </LinearGradient>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
    backgroundColor: "rgba(30, 30, 40, 0.7)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: Spacing.lg,
    paddingBottom: 0,
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: Colors.dark.accent,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  mainContent: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  metricsContainer: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.sm,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  metricLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: 70,
  },
  metricLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  metricBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  metricBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 12,
    fontWeight: "600",
    width: 36,
    textAlign: "right",
  },
  recommendationBox: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  recommendationGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  recommendationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.dark.text,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginHorizontal: Spacing.lg,
  },
  modeSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  modeSelectorLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modeSelectorLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    color: Colors.dark.textSecondary,
  },
  modeSelectorValue: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  modesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.lg,
    paddingTop: 0,
    gap: Spacing.sm,
  },
  modeCard: {
    width: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 3) / 2,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  modeCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  modeCardName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  modeCardDesc: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  syncButton: {
    margin: Spacing.lg,
    marginTop: 0,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  syncButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  syncButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFF",
  },
});
