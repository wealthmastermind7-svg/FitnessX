import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

interface FoodAnalysisResult {
  healthScore: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: string[];
  suggestions: string[];
}

export default function FoodPlateScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const baseUrl = getApiUrl();

  useEffect(() => {
    launchCamera();
  }, []);

  const launchCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera access in your settings to analyze food plates.",
        [
          { text: "Cancel", onPress: () => navigation.goBack() },
          { text: "OK", onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (pickerResult.canceled) {
      navigation.goBack();
      return;
    }

    if (pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      analyzeFood(pickerResult.assets[0].base64!);
    }
  };

  const analyzeFood = async (base64: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${baseUrl}api/ai/analyze-food`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze food");
      }

      const data = await response.json();
      setResult(data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("[FoodPlate] Analysis error:", error);
      Alert.alert("Analysis Failed", "Could not analyze your food plate. Please try again.", [
        { text: "Try Again", onPress: launchCamera },
        { text: "Cancel", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#4CAF50";
    if (score >= 60) return "#FF9800";
    return "#FF6B6B";
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
          style={styles.closeButton}
        >
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Food Analysis</ThemedText>
        <View style={styles.headerRight} />
      </View>

      {isLoading && !result ? (
        <View style={styles.loadingContainer}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          )}
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FF6B6B" />
            <ThemedText style={styles.loadingText}>Analyzing your meal...</ThemedText>
          </View>
        </View>
      ) : result ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {imageUri && (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.resultImage} />
            </View>
          )}

          <View style={styles.scoreSection}>
            <View style={[styles.scoreCircle, { borderColor: getScoreColor(result.healthScore) }]}>
              <ThemedText style={[styles.scoreValue, { color: getScoreColor(result.healthScore) }]}>
                {result.healthScore}
              </ThemedText>
              <ThemedText style={styles.scoreLabel}>Health Score</ThemedText>
            </View>
          </View>

          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <ThemedText style={styles.macroValue}>{result.calories}</ThemedText>
              <ThemedText style={styles.macroLabel}>Calories</ThemedText>
            </View>
            <View style={styles.macroItem}>
              <ThemedText style={styles.macroValue}>{result.protein}g</ThemedText>
              <ThemedText style={styles.macroLabel}>Protein</ThemedText>
            </View>
            <View style={styles.macroItem}>
              <ThemedText style={styles.macroValue}>{result.carbs}g</ThemedText>
              <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
            </View>
            <View style={styles.macroItem}>
              <ThemedText style={styles.macroValue}>{result.fat}g</ThemedText>
              <ThemedText style={styles.macroLabel}>Fat</ThemedText>
            </View>
          </View>

          <Card elevation={2} style={styles.detectedFoodsCard}>
            <ThemedText style={styles.sectionTitle}>Detected Foods</ThemedText>
            <View style={styles.foodsList}>
              {result.foods.map((food, index) => (
                <View key={index} style={styles.foodItem}>
                  <Feather name="check-circle" size={18} color="#FF6B6B" />
                  <ThemedText style={styles.foodText}>{food}</ThemedText>
                </View>
              ))}
            </View>
          </Card>

          <Card elevation={2} style={styles.suggestionsCard}>
            <ThemedText style={styles.sectionTitle}>Suggestions</ThemedText>
            {result.suggestions.map((suggestion, index) => (
              <ThemedText key={index} style={styles.suggestionText}>
                {suggestion}
              </ThemedText>
            ))}
          </Card>

          <Pressable
            onPress={launchCamera}
            style={({ pressed }) => [
              styles.scanAgainButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Feather name="camera" size={20} color="white" />
            <ThemedText style={styles.scanAgainText}>Scan Another Meal</ThemedText>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="camera" size={64} color={Colors.dark.textSecondary} />
          <ThemedText style={styles.emptyText}>
            Take a photo of your meal to get nutritional insights
          </ThemedText>
          <Pressable
            onPress={launchCamera}
            style={({ pressed }) => [
              styles.scanButton,
              pressed && styles.buttonPressed,
            ]}
          >
            <Feather name="camera" size={20} color="white" />
            <ThemedText style={styles.scanButtonText}>Open Camera</ThemedText>
          </Pressable>
        </View>
      )}
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
  closeButton: {
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
  loadingContainer: {
    flex: 1,
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    opacity: 0.5,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  loadingText: {
    marginTop: Spacing.lg,
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  imageContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.lg,
  },
  resultImage: {
    width: "100%",
    aspectRatio: 4 / 3,
    resizeMode: "cover",
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  scoreCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: "800",
    lineHeight: 64,
  },
  scoreLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.xl,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  macroItem: {
    alignItems: "center",
  },
  macroValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  macroLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  detectedFoodsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  foodsList: {
    gap: Spacing.sm,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  foodText: {
    fontSize: 16,
    color: Colors.dark.text,
    textTransform: "capitalize",
  },
  suggestionsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  scanAgainButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  scanAgainText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    maxWidth: 280,
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
  },
});
