import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList, ExerciseDBExercise } from "@/navigation/RootStackNavigator";

type CreatePostRouteProp = RouteProp<RootStackParamList, "CreatePost">;

export default function CreatePostScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<CreatePostRouteProp>();
  const sharedExercise = route.params?.sharedExercise;

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState(
    sharedExercise ? `Check out this exercise: ${sharedExercise.name}! Great for ${sharedExercise.target}.` : ""
  );
  const [workoutTitle, setWorkoutTitle] = useState(
    sharedExercise ? sharedExercise.name : ""
  );
  const [isPosting, setIsPosting] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera permission is required to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setImageUri(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Photo library permission is required to select photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!workoutTitle.trim()) {
      Alert.alert("Missing title", "Please add a title for your post.");
      return;
    }

    setIsPosting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setTimeout(() => {
      setIsPosting(false);
      Alert.alert("Posted!", "Your workout has been shared with the community.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  const removeImage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setImageUri(null);
  };

  return (
    <ThemedView style={styles.container}>
      <LinearGradient
        colors={["#0D0221", "#1A0B2E"]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="x" size={28} color="#FFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>New Post</ThemedText>
        <Pressable 
          onPress={handlePost} 
          style={[styles.postButton, (!workoutTitle.trim() || isPosting) && styles.postButtonDisabled]}
          disabled={!workoutTitle.trim() || isPosting}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <ThemedText style={styles.postButtonText}>Post</ThemedText>
          )}
        </Pressable>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {sharedExercise && (
          <View style={styles.sharedExerciseCard}>
            <View style={styles.sharedExerciseHeader}>
              <Feather name="share-2" size={16} color={Colors.dark.accent} />
              <ThemedText style={styles.sharedExerciseLabel}>Sharing Exercise</ThemedText>
            </View>
            <View style={styles.sharedExerciseContent}>
              <ExpoImage
                source={{ uri: sharedExercise.gifUrl }}
                style={styles.sharedExerciseGif}
                contentFit="cover"
              />
              <View style={styles.sharedExerciseInfo}>
                <ThemedText style={styles.sharedExerciseName}>{sharedExercise.name}</ThemedText>
                <ThemedText style={styles.sharedExerciseTarget}>Target: {sharedExercise.target}</ThemedText>
                <ThemedText style={styles.sharedExerciseEquipment}>Equipment: {sharedExercise.equipment}</ThemedText>
              </View>
            </View>
          </View>
        )}

        <View style={styles.imageSection}>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <ExpoImage
                source={{ uri: imageUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <Pressable onPress={removeImage} style={styles.removeImageButton}>
                <BlurView intensity={60} tint="dark" style={styles.removeImageBlur}>
                  <Feather name="x" size={20} color="#FFF" />
                </BlurView>
              </Pressable>
            </View>
          ) : (
            <View style={styles.imagePlaceholder}>
              <View style={styles.imageButtons}>
                <Pressable onPress={takePhoto} style={styles.imageButton}>
                  <LinearGradient
                    colors={["#FF6B6B", "#FF4B4B"]}
                    style={styles.imageButtonGradient}
                  >
                    <Feather name="camera" size={28} color="#FFF" />
                    <ThemedText style={styles.imageButtonText}>Take Photo</ThemedText>
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={pickImage} style={styles.imageButton}>
                  <View style={styles.imageButtonOutline}>
                    <Feather name="image" size={28} color={Colors.dark.accent} />
                    <ThemedText style={styles.imageButtonTextOutline}>Choose Photo</ThemedText>
                  </View>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Workout Title</ThemedText>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g., Morning Push Day"
              placeholderTextColor={Colors.dark.textSecondary}
              value={workoutTitle}
              onChangeText={setWorkoutTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText style={styles.inputLabel}>Caption</ThemedText>
            <TextInput
              style={styles.captionInput}
              placeholder="Share your workout experience..."
              placeholderTextColor={Colors.dark.textSecondary}
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Add Workout Stats (Optional)</ThemedText>
          <View style={styles.statsGrid}>
            <View style={styles.statInput}>
              <Feather name="clock" size={18} color={Colors.dark.accent} />
              <TextInput
                style={styles.statInputField}
                placeholder="Duration"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
            <View style={styles.statInput}>
              <Feather name="activity" size={18} color={Colors.dark.accent} />
              <TextInput
                style={styles.statInputField}
                placeholder="Volume (kg)"
                placeholderTextColor={Colors.dark.textSecondary}
              />
            </View>
            <View style={styles.statInput}>
              <Feather name="layers" size={18} color={Colors.dark.accent} />
              <TextInput
                style={styles.statInputField}
                placeholder="Sets"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.statInput}>
              <Feather name="zap" size={18} color={Colors.dark.accent} />
              <TextInput
                style={styles.statInputField}
                placeholder="Calories"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
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
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  postButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    minWidth: 70,
    alignItems: "center",
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  sharedExerciseCard: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  sharedExerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sharedExerciseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  sharedExerciseContent: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  sharedExerciseGif: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  sharedExerciseInfo: {
    flex: 1,
    justifyContent: "center",
  },
  sharedExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  sharedExerciseTarget: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textTransform: "capitalize",
  },
  sharedExerciseEquipment: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    textTransform: "capitalize",
  },
  imageSection: {
    marginBottom: Spacing.lg,
  },
  imagePlaceholder: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
    borderStyle: "dashed",
  },
  imageButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  imageButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  imageButtonGradient: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  imageButtonOutline: {
    paddingVertical: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    borderRadius: BorderRadius.lg,
  },
  imageButtonTextOutline: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  imagePreviewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.lg,
  },
  removeImageButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    borderRadius: 20,
    overflow: "hidden",
  },
  removeImageBlur: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  titleInput: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  captionInput: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: Colors.dark.text,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
    minHeight: 100,
  },
  statsSection: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    width: "48%",
  },
  statInputField: {
    flex: 1,
    fontSize: 14,
    color: Colors.dark.text,
  },
});
