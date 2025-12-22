import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";

const isWebBrowser = Platform.OS === "web" && typeof window !== "undefined" && typeof navigator !== "undefined" && typeof document !== "undefined";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import {
  FormFeedback,
  ExerciseFormRule,
  getFormRuleForExercise,
  SKELETON_CONNECTIONS,
} from "@/lib/pose-analysis";

type FormCoachParams = {
  exerciseName?: string;
};

type RouteParams = RouteProp<{ FormCoach: FormCoachParams }, "FormCoach">;

type Pose = {
  keypoints: Array<{
    name?: string;
    x: number;
    y: number;
    score?: number;
  }>;
  score?: number;
};

const EXERCISES_WITH_FORM_RULES = ["squat", "push-up", "plank", "lunge"];

function WebFormCoach({ exerciseName }: { exerciseName: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isTfReady, setIsTfReady] = useState(false);
  const [detector, setDetector] = useState<any>(null);
  const [feedback, setFeedback] = useState<FormFeedback | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const animationRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const formRule = getFormRuleForExercise(exerciseName);

  useEffect(() => {
    if (!isWebBrowser) {
      setCameraError("Form tracking is only available in a web browser");
      setIsLoading(false);
      return;
    }
    
    try {
      const hasMediaDevices = typeof navigator !== "undefined" && 
        "mediaDevices" in navigator && 
        typeof navigator.mediaDevices?.getUserMedia === "function";
      
      if (hasMediaDevices) {
        setIsSupported(true);
      } else {
        setCameraError("Your browser does not support camera access");
        setIsLoading(false);
      }
    } catch {
      setCameraError("Camera access is not available");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;
    
    let mounted = true;

    async function initTensorFlow() {
      try {
        const tf = await import("@tensorflow/tfjs-core");
        await import("@tensorflow/tfjs-backend-webgl");
        await import("@tensorflow/tfjs-converter");
        const poseDetection = await import("@tensorflow-models/pose-detection");

        await tf.ready();
        await tf.setBackend("webgl");

        const detectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };

        const createdDetector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          detectorConfig
        );

        if (mounted) {
          setDetector(createdDetector);
          setIsTfReady(true);
        }
      } catch (error) {
        console.error("TensorFlow init error:", error);
        if (mounted) {
          setCameraError("Failed to initialize AI model. Please try a different browser.");
          setIsLoading(false);
        }
      }
    }

    initTensorFlow();

    return () => {
      mounted = false;
    };
  }, [isSupported]);

  useEffect(() => {
    if (!isTfReady || !isSupported) return;

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: 640, height: 480 },
          audio: false,
        });
        
        streamRef.current = stream;

        if (videoRef.current && isWebBrowser) {
          const videoElement = videoRef.current as HTMLVideoElement;
          videoElement.srcObject = stream;
          await videoElement.play();
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Camera error:", error);
        setCameraError("Camera access denied. Please enable camera permissions in your browser settings.");
        setIsLoading(false);
      }
    }

    setupCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (animationRef.current && isWebBrowser) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isTfReady, isSupported]);

  const detectPose = useCallback(async () => {
    if (!detector || !videoRef.current || !canvasRef.current || !isWebBrowser) return;

    try {
      const poses = await detector.estimatePoses(videoRef.current);

      if (poses.length > 0) {
        const detectedPose = poses[0];
        setPose(detectedPose);

        if (formRule) {
          const result = formRule.checkForm(detectedPose);
          setFeedback(result);
        }

        drawSkeleton(detectedPose);
      }
    } catch (error) {
      console.error("Pose detection error:", error);
    }

    animationRef.current = requestAnimationFrame(detectPose);
  }, [detector, formRule]);

  useEffect(() => {
    if (detector && !isLoading && !cameraError && isSupported) {
      detectPose();
    }

    return () => {
      if (animationRef.current && isWebBrowser) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [detector, isLoading, cameraError, detectPose, isSupported]);

  const drawSkeleton = (detectedPose: Pose) => {
    if (!isWebBrowser) return;
    
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    const video = videoRef.current as HTMLVideoElement | null;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    SKELETON_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = detectedPose.keypoints.find((kp) => kp.name === start);
      const endPoint = detectedPose.keypoints.find((kp) => kp.name === end);

      if (
        startPoint &&
        endPoint &&
        (startPoint.score || 0) > 0.3 &&
        (endPoint.score || 0) > 0.3
      ) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.strokeStyle = feedback?.isCorrect ? "#4ADE80" : "#FF6B6B";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    });

    detectedPose.keypoints.forEach((keypoint) => {
      if ((keypoint.score || 0) > 0.3) {
        ctx.beginPath();
        ctx.arc(keypoint.x, keypoint.y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = feedback?.isCorrect ? "#4ADE80" : "#FF6B6B";
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  };

  if (cameraError) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="camera-off" size={48} color={Colors.dark.textSecondary} />
        <ThemedText style={styles.errorText}>{cameraError}</ThemedText>
      </View>
    );
  }

  if (!isWebBrowser) {
    return (
      <View style={styles.errorContainer}>
        <Feather name="monitor" size={48} color={Colors.dark.textSecondary} />
        <ThemedText style={styles.errorText}>
          Real-time form tracking requires a web browser with camera support
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.webContainer}>
      <View style={styles.cameraContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.dark.accent} />
            <ThemedText style={styles.loadingText}>
              {isTfReady ? "Starting camera..." : "Loading AI model..."}
            </ThemedText>
          </View>
        )}
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scaleX(-1)",
          }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            transform: "scaleX(-1)",
          }}
        />

        {feedback && !isLoading && (
          <View
            style={[
              styles.feedbackOverlay,
              feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
            ]}
          >
            <Feather
              name={feedback.isCorrect ? "check-circle" : "alert-circle"}
              size={24}
              color="#FFF"
            />
            <View style={styles.feedbackTextContainer}>
              <ThemedText style={styles.feedbackMessage}>
                {feedback.message}
              </ThemedText>
              <ThemedText style={styles.feedbackTip}>{feedback.tip}</ThemedText>
            </View>
          </View>
        )}
      </View>

      {formRule && (
        <Card style={styles.exerciseInfoCard}>
          <View style={styles.exerciseInfoHeader}>
            <Feather name="activity" size={20} color="#9D4EDD" />
            <ThemedText style={styles.exerciseInfoTitle}>
              Tracking: {formRule.name}
            </ThemedText>
          </View>
          <ThemedText style={styles.exerciseInfoDesc}>
            {formRule.description}
          </ThemedText>
          {pose && (
            <View style={styles.confidenceRow}>
              <ThemedText style={styles.confidenceLabel}>Detection confidence:</ThemedText>
              <View
                style={[
                  styles.confidenceBadge,
                  {
                    backgroundColor:
                      (feedback?.confidence || 0) > 0.7 ? "#4ADE8020" : "#FF6B6B20",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.confidenceValue,
                    {
                      color:
                        (feedback?.confidence || 0) > 0.7 ? "#4ADE80" : "#FF6B6B",
                    },
                  ]}
                >
                  {Math.round((feedback?.confidence || 0) * 100)}%
                </ThemedText>
              </View>
            </View>
          )}
        </Card>
      )}
    </View>
  );
}

function NativeFormCoach({ exerciseName, hasFormRule }: { exerciseName: string; hasFormRule: boolean }) {
  const formRule = getFormRuleForExercise(exerciseName);
  const [showCamera, setShowCamera] = useState(false);

  const handleActivateCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowCamera(true);
  };

  // Camera is active
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <LinearGradient
          colors={["#0a5f4f", "#164e45"] as any}
          style={styles.camera}
        />
        <View style={styles.cameraOverlay}>
          <Pressable
            onPress={() => {
              setShowCamera(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color="#FFF" />
          </Pressable>
          <View style={styles.cameraInfo}>
            <Feather name="camera" size={32} color="#10B981" />
            <ThemedText style={styles.cameraInfoText}>
              {exerciseName}
            </ThemedText>
            <ThemedText style={styles.cameraStatusText}>
              Camera Active
            </ThemedText>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.nativeScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {!showCamera && (
        <LinearGradient
          colors={["#1a1f35", "#0f1225"] as any}
          style={styles.nativeNotice}
        >
          <Feather name="camera" size={48} color="#10B981" />
          <ThemedText style={styles.nativeNoticeTitle}>
            Camera Form Tracking
          </ThemedText>
          <ThemedText style={styles.nativeNoticeText}>
            {hasFormRule 
              ? "Analyze your exercise form in real-time with AI feedback"
              : "Record your exercise form and review it later"}
          </ThemedText>
          <Pressable
            onPress={handleActivateCamera}
            style={styles.activateCameraButton}
          >
            <LinearGradient
              colors={["#10B981", "#059669"] as any}
              style={styles.activateCameraGradient}
            >
              <Feather name="camera" size={20} color="#FFF" />
              <ThemedText style={styles.activateCameraButtonText}>
                Activate Camera
              </ThemedText>
            </LinearGradient>
          </Pressable>
          <View style={styles.nativeNoticeTip}>
            <Feather name="info" size={16} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.nativeNoticeTipText}>
              We'll use your camera to analyze body positioning
            </ThemedText>
          </View>
        </LinearGradient>
      )}

      {hasFormRule && formRule && (
        <Card style={styles.formTipsCard}>
          <View style={styles.formTipsHeader}>
            <Feather name="target" size={20} color={Colors.dark.accent} />
            <ThemedText style={styles.formTipsTitle}>
              {formRule.name} Form Tips
            </ThemedText>
          </View>
          <ThemedText style={styles.formTipsDesc}>
            {formRule.description}
          </ThemedText>
          <View style={styles.keyPointsList}>
            <ThemedText style={styles.keyPointsLabel}>Key checkpoints:</ThemedText>
            {formRule.keyPoints.map((point, idx) => (
              <View key={idx} style={styles.keyPointItem}>
                <View style={styles.keyPointDot} />
                <ThemedText style={styles.keyPointText}>
                  {point.replace(/_/g, " ")}
                </ThemedText>
              </View>
            ))}
          </View>
        </Card>
      )}

      <Card style={styles.generalTipsCard}>
        <View style={styles.generalTipsHeader}>
          <Feather name="book-open" size={20} color="#9D4EDD" />
          <ThemedText style={styles.generalTipsTitle}>General Form Guidelines</ThemedText>
        </View>
        <View style={styles.tipItem}>
          <Feather name="check" size={16} color="#4ADE80" />
          <ThemedText style={styles.tipText}>
            Keep your core engaged throughout the movement
          </ThemedText>
        </View>
        <View style={styles.tipItem}>
          <Feather name="check" size={16} color="#4ADE80" />
          <ThemedText style={styles.tipText}>
            Control the movement - avoid using momentum
          </ThemedText>
        </View>
        <View style={styles.tipItem}>
          <Feather name="check" size={16} color="#4ADE80" />
          <ThemedText style={styles.tipText}>
            Breathe steadily - exhale on exertion
          </ThemedText>
        </View>
        <View style={styles.tipItem}>
          <Feather name="check" size={16} color="#4ADE80" />
          <ThemedText style={styles.tipText}>
            Maintain proper alignment of your joints
          </ThemedText>
        </View>
      </Card>
    </ScrollView>
  );
}

export default function FormCoachScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const exerciseParam = route.params?.exerciseName || "Exercise";

  const isWeb = Platform.OS === "web";
  const hasFormRule = EXERCISES_WITH_FORM_RULES.includes(exerciseParam.toLowerCase());

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
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Form Coach</ThemedText>
          <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
            {exerciseParam}
          </ThemedText>
        </View>
        <View style={styles.headerRight} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {isWeb ? (
          <WebFormCoach exerciseName={exerciseParam} />
        ) : (
          <NativeFormCoach exerciseName={exerciseParam} hasFormRule={hasFormRule} />
        )}
      </View>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    ...Typography.small,
    color: "#9D4EDD",
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  exerciseSelector: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  exerciseSelectorContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  exerciseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  exerciseChipActive: {
    backgroundColor: "#9D4EDD",
  },
  exerciseChipText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    fontWeight: "500",
  },
  exerciseChipTextActive: {
    color: "#FFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  webContainer: {
    flex: 1,
  },
  cameraContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
  },
  feedbackOverlay: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  feedbackCorrect: {
    backgroundColor: "rgba(74, 222, 128, 0.9)",
  },
  feedbackIncorrect: {
    backgroundColor: "rgba(255, 107, 107, 0.9)",
  },
  feedbackTextContainer: {
    flex: 1,
  },
  feedbackMessage: {
    ...Typography.body,
    color: "#FFF",
    fontWeight: "600",
  },
  feedbackTip: {
    ...Typography.small,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 2,
  },
  exerciseInfoCard: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
  },
  exerciseInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exerciseInfoTitle: {
    ...Typography.body,
    color: "#9D4EDD",
    fontWeight: "600",
  },
  exerciseInfoDesc: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  confidenceLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  confidenceValue: {
    ...Typography.small,
    fontWeight: "600",
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  cameraInfo: {
    alignItems: "center",
    gap: Spacing.md,
  },
  cameraInfoText: {
    ...Typography.h2,
    color: "#FFF",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cameraStatusText: {
    ...Typography.body,
    color: "#10B981",
    fontWeight: "500",
  },
  nativeScrollContent: {
    paddingBottom: Spacing.xl,
  },
  nativeNotice: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  nativeNoticeTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  nativeNoticeText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  nativeNoticeTip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
  },
  nativeNoticeTipText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    flex: 1,
  },
  formTipsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  formTipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  formTipsTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  formTipsDesc: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  keyPointsList: {
    marginTop: Spacing.sm,
  },
  keyPointsLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  keyPointItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  keyPointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.accent,
  },
  keyPointText: {
    ...Typography.body,
    color: Colors.dark.text,
    textTransform: "capitalize",
  },
  generalTipsCard: {
    padding: Spacing.lg,
  },
  generalTipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  generalTipsTitle: {
    ...Typography.h3,
    color: "#9D4EDD",
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  activateCameraButton: {
    marginTop: Spacing.lg,
    width: "100%",
  },
  activateCameraGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  activateCameraButtonText: {
    ...Typography.body,
    color: "#FFF",
    fontWeight: "600",
  },
});
