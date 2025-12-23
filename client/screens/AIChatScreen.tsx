import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image as ExpoImage } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";
import { ProGate } from "@/components/ProGate";

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment: string;
  gifUrl: string;
  instructions: string[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  exercises?: Exercise[];
  programData?: any;
  feedbackData?: any;
  recoveryData?: any;
}

type CoachMode = "chat" | "generate" | "feedback" | "recovery";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const MODE_CONFIG = {
  chat: {
    icon: "message-circle" as const,
    label: "Coach",
    color: "#9D4EDD",
    prompts: [
      "How can I build muscle faster?",
      "What should I eat before a workout?",
      "How do I fix my squat form?",
      "Best exercises for abs?",
      "Tips for losing body fat?",
    ],
  },
  generate: {
    icon: "zap" as const,
    label: "Program",
    color: "#FF6B6B",
    prompts: [
      "Create an 8-week muscle building program",
      "Design a fat loss training plan",
      "Build me a strength program for beginners",
      "Create a home workout plan with no equipment",
      "Design a 4-day split routine",
    ],
  },
  feedback: {
    icon: "bar-chart-2" as const,
    label: "Feedback",
    color: "#4ECDC4",
    prompts: [
      "Analyze my chest and triceps workout",
      "Review my leg day performance",
      "Give feedback on my back workout",
      "Evaluate my full body session",
      "What can I improve in my training?",
    ],
  },
  recovery: {
    icon: "heart" as const,
    label: "Recovery",
    color: "#FFE66D",
    prompts: [
      "Should I train today or rest?",
      "Am I overtraining my muscles?",
      "How to optimize my recovery?",
      "What muscle groups need rest?",
      "Analyze my training readiness",
    ],
  },
};

const MUSCLE_GROUPS = [
  "Chest", "Back", "Shoulders", "Biceps", "Triceps",
  "Legs", "Glutes", "Abs",
];

export default function AIChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<CoachMode>("chat");
  const [showModeSelector, setShowModeSelector] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [workoutLog, setWorkoutLog] = useState({
    exercises: "",
    duration: "45",
    muscles: [] as string[],
    difficulty: "Moderate",
  });

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: getWelcomeMessage(currentMode),
        timestamp: new Date(),
      },
    ]);
  }, []);

  const getWelcomeMessage = (mode: CoachMode) => {
    switch (mode) {
      case "chat":
        return "Hey! I'm your AI fitness coach. I can help with workout advice, nutrition tips, exercise form, and more. What would you like to know?";
      case "generate":
        return "Ready to create your personalized training program! Tell me your goals, fitness level, and available equipment, and I'll design an 8-week progressive plan for you.";
      case "feedback":
        return "I can analyze your workout and provide coaching feedback. Tell me what exercises you did, how many sets/reps, and how you felt. I'll give you actionable tips!";
      case "recovery":
        return "Let's check your training readiness! Tell me about your recent workouts, how you're feeling, and what muscles you've trained. I'll advise on whether to train or rest.";
    }
  };

  const handleModeChange = (mode: CoachMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentMode(mode);
    setShowModeSelector(false);
    setMessages([
      {
        id: "welcome-" + mode,
        role: "assistant",
        content: getWelcomeMessage(mode),
        timestamp: new Date(),
      },
    ]);
  };

  const getApiEndpoint = () => {
    switch (currentMode) {
      case "generate":
        return "api/ai/program";
      case "feedback":
        return "api/ai/feedback";
      case "recovery":
        return "api/ai/recovery";
      default:
        return "api/ai/chat";
    }
  };

  const buildRequestBody = (text: string) => {
    const baseHistory = messages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    switch (currentMode) {
      case "generate":
        return {
          message: text,
          history: baseHistory,
          mode: "program",
          fitnessLevel: "intermediate",
          goals: text,
        };
      case "feedback":
        return {
          message: text,
          history: baseHistory,
          mode: "feedback",
          exercisesCompleted: workoutLog.exercises || text,
          totalDuration: parseInt(workoutLog.duration) || 45,
          musclesFocused: workoutLog.muscles.length > 0 ? workoutLog.muscles : ["General"],
          difficulty: workoutLog.difficulty,
        };
      case "recovery":
        return {
          message: text,
          history: baseHistory,
          mode: "recovery",
          recentWorkouts: text,
        };
      default:
        return {
          message: text,
          history: baseHistory,
        };
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    setShowModeSelector(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const baseUrl = getApiUrl();
      const endpoint = getApiEndpoint();
      const body = buildRequestBody(text.trim());

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      let content = "";
      let programData = null;
      let feedbackData = null;
      let recoveryData = null;

      if (currentMode === "generate" && data.weeks) {
        programData = data;
        content = formatProgramResponse(data);
      } else if (currentMode === "feedback" && data.strengths) {
        feedbackData = data;
        content = formatFeedbackResponse(data);
      } else if (currentMode === "recovery" && data.recommendation) {
        recoveryData = data;
        content = formatRecoveryResponse(data);
      } else {
        content = data.response || data.message || JSON.stringify(data);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
        exercises: data.exercises || [],
        programData,
        feedbackData,
        recoveryData,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const formatProgramResponse = (data: any) => {
    if (!data.weeks || data.weeks.length === 0) {
      return "I've created your training program! Here's your personalized plan.";
    }
    
    let response = "Here's your personalized 8-week training program:\n\n";
    
    data.weeks.slice(0, 2).forEach((week: any) => {
      response += `Week ${week.week}: ${week.focus}\n`;
      week.sessions?.forEach((session: any) => {
        response += `  ${session.day}:\n`;
        session.exercises?.slice(0, 3).forEach((ex: any) => {
          response += `    - ${ex.name}: ${ex.sets}x${ex.reps}\n`;
        });
        if (session.exercises?.length > 3) {
          response += `    ...and ${session.exercises.length - 3} more exercises\n`;
        }
      });
      response += "\n";
    });
    
    if (data.weeks.length > 2) {
      response += `...and ${data.weeks.length - 2} more weeks of progressive training!\n\n`;
    }
    
    response += "Each week builds on the previous one with smart progression. Follow consistently for best results!";
    return response;
  };

  const formatFeedbackResponse = (data: any) => {
    let response = "Here's your workout analysis:\n\n";
    
    if (data.strengths?.length > 0) {
      response += "Strengths:\n";
      data.strengths.forEach((s: string) => {
        response += `  + ${s}\n`;
      });
      response += "\n";
    }
    
    if (data.areas_to_improve?.length > 0) {
      response += "Areas to Improve:\n";
      data.areas_to_improve.forEach((a: string) => {
        response += `  - ${a}\n`;
      });
      response += "\n";
    }
    
    if (data.next_session_recommendation) {
      response += `Next Session Tip: ${data.next_session_recommendation}`;
    }
    
    return response;
  };

  const formatRecoveryResponse = (data: any) => {
    let response = `Recommendation: ${data.recommendation?.toUpperCase() || "TRAIN"}\n\n`;
    
    if (data.reasoning) {
      response += `${data.reasoning}\n\n`;
    }
    
    if (data.alternatives?.length > 0) {
      response += "Alternative Options:\n";
      data.alternatives.forEach((alt: string) => {
        response += `  - ${alt}\n`;
      });
    }
    
    return response;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleMuscle = (muscle: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setWorkoutLog(prev => ({
      ...prev,
      muscles: prev.muscles.includes(muscle)
        ? prev.muscles.filter(m => m !== muscle)
        : [...prev.muscles, muscle],
    }));
  };

  const modeConfig = MODE_CONFIG[currentMode];

  return (
    <ProGate feature="AI Coach">
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
          <View style={styles.headerCenter}>
            <LinearGradient
              colors={[modeConfig.color, "#5A189A"]}
              style={styles.aiAvatar}
            >
              <Feather name={modeConfig.icon} size={18} color="#fff" />
            </LinearGradient>
            <View>
              <ThemedText style={styles.headerTitle}>AI Coach</ThemedText>
              <ThemedText style={[styles.headerSubtitle, { color: modeConfig.color }]}>
                {modeConfig.label} Mode
              </ThemedText>
            </View>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowModeSelector(true);
              setMessages([
                {
                  id: "welcome",
                  role: "assistant",
                  content: getWelcomeMessage(currentMode),
                  timestamp: new Date(),
                },
              ]);
            }}
          >
            <Feather name="refresh-cw" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.modeTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modeTabs}
          >
            {(Object.keys(MODE_CONFIG) as CoachMode[]).map((mode) => {
              const config = MODE_CONFIG[mode];
              const isActive = currentMode === mode;
              return (
                <Pressable
                  key={mode}
                  style={[
                    styles.modeTab,
                    isActive && { backgroundColor: config.color + "20", borderColor: config.color },
                  ]}
                  onPress={() => handleModeChange(mode)}
                >
                  <Feather
                    name={config.icon}
                    size={16}
                    color={isActive ? config.color : Colors.dark.textSecondary}
                  />
                  <ThemedText
                    style={[
                      styles.modeTabText,
                      isActive && { color: config.color, fontWeight: "600" },
                    ]}
                  >
                    {config.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.role === "user" && styles.userMessageWrapper,
                ]}
              >
                {message.role === "assistant" && (
                  <LinearGradient
                    colors={[modeConfig.color, "#5A189A"]}
                    style={styles.messageAvatar}
                  >
                    <Feather name={modeConfig.icon} size={14} color="#fff" />
                  </LinearGradient>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble,
                    message.exercises && message.exercises.length > 0 && styles.assistantBubbleWithExercises,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.messageText,
                      message.role === "user" && styles.userMessageText,
                    ]}
                  >
                    {message.content}
                  </ThemedText>
                  
                  {message.exercises && message.exercises.length > 0 ? (
                    <View style={styles.exercisesContainer}>
                      <View style={styles.exercisesDivider} />
                      <ThemedText style={[styles.exercisesTitle, { color: modeConfig.color }]}>
                        Related Exercises
                      </ThemedText>
                      {message.exercises.map((exercise) => (
                        <Pressable
                          key={exercise.id}
                          style={styles.exerciseCard}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            navigation.navigate("ExerciseDetail", { exercise });
                          }}
                        >
                          <ExpoImage
                            source={{ uri: `${getApiUrl()}api/exercises/image/${exercise.id}` }}
                            style={styles.exerciseGif}
                            contentFit="cover"
                          />
                          <View style={styles.exerciseInfo}>
                            <ThemedText style={styles.exerciseName} numberOfLines={2}>
                              {exercise.name}
                            </ThemedText>
                            <View style={styles.exerciseTags}>
                              <View style={[styles.exerciseTag, { backgroundColor: modeConfig.color + "20" }]}>
                                <ThemedText style={[styles.exerciseTagText, { color: modeConfig.color }]}>
                                  {exercise.target}
                                </ThemedText>
                              </View>
                              <View style={[styles.exerciseTag, { backgroundColor: modeConfig.color + "20" }]}>
                                <ThemedText style={[styles.exerciseTagText, { color: modeConfig.color }]}>
                                  {exercise.equipment}
                                </ThemedText>
                              </View>
                            </View>
                          </View>
                          <Feather name="chevron-right" size={18} color={Colors.dark.textSecondary} />
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                  
                  <ThemedText style={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </ThemedText>
                </View>
              </View>
            ))}

            {isLoading && (
              <View style={styles.messageWrapper}>
                <LinearGradient
                  colors={[modeConfig.color, "#5A189A"]}
                  style={styles.messageAvatar}
                >
                  <Feather name={modeConfig.icon} size={14} color="#fff" />
                </LinearGradient>
                <View style={[styles.messageBubble, styles.assistantBubble]}>
                  <View style={styles.typingIndicator}>
                    <ActivityIndicator size="small" color={modeConfig.color} />
                    <ThemedText style={styles.typingText}>
                      {currentMode === "generate" ? "Creating your program..." :
                       currentMode === "feedback" ? "Analyzing your workout..." :
                       currentMode === "recovery" ? "Checking your readiness..." :
                       "Thinking..."}
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}

            {showModeSelector && messages.length <= 1 && !isLoading && (
              <View style={styles.quickPromptsSection}>
                <ThemedText style={styles.quickPromptsTitle}>
                  Quick Actions:
                </ThemedText>
                <View style={styles.quickPromptsGrid}>
                  {modeConfig.prompts.map((prompt, idx) => (
                    <Pressable
                      key={idx}
                      style={[styles.quickPromptChip, { borderColor: modeConfig.color + "30" }]}
                      onPress={() => sendMessage(prompt)}
                    >
                      <ThemedText style={[styles.quickPromptText, { color: modeConfig.color }]}>
                        {prompt}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {currentMode === "feedback" && showModeSelector && messages.length <= 1 && (
              <View style={styles.workoutLogSection}>
                <ThemedText style={styles.workoutLogTitle}>
                  Quick Log Your Workout:
                </ThemedText>
                <View style={styles.muscleChipsRow}>
                  {MUSCLE_GROUPS.map((muscle) => (
                    <Pressable
                      key={muscle}
                      style={[
                        styles.muscleChip,
                        workoutLog.muscles.includes(muscle) && {
                          backgroundColor: modeConfig.color + "20",
                          borderColor: modeConfig.color,
                        },
                      ]}
                      onPress={() => toggleMuscle(muscle)}
                    >
                      <ThemedText
                        style={[
                          styles.muscleChipText,
                          workoutLog.muscles.includes(muscle) && { color: modeConfig.color },
                        ]}
                      >
                        {muscle}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  currentMode === "generate" ? "Describe your fitness goals..." :
                  currentMode === "feedback" ? "Describe your workout..." :
                  currentMode === "recovery" ? "How are you feeling today?" :
                  "Ask me anything about fitness..."
                }
                placeholderTextColor={Colors.dark.textSecondary}
                multiline
                maxLength={500}
                onSubmitEditing={() => sendMessage(inputText)}
              />
              <Pressable
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
              >
                <LinearGradient
                  colors={inputText.trim() ? [modeConfig.color, "#5A189A"] : [Colors.dark.backgroundSecondary, Colors.dark.backgroundSecondary]}
                  style={styles.sendButtonGradient}
                >
                  <Feather
                    name="send"
                    size={18}
                    color={inputText.trim() ? "#fff" : Colors.dark.textSecondary}
                  />
                </LinearGradient>
              </Pressable>
            </View>
            <ThemedText style={styles.disclaimer}>
              AI responses are for informational purposes. Consult a professional for medical advice.
            </ThemedText>
          </View>
        </KeyboardAvoidingView>
      </ThemedView>
    </ProGate>
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
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  headerSubtitle: {
    ...Typography.small,
  },
  modeTabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  modeTabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  modeTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  modeTabText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing.md,
  },
  userMessageWrapper: {
    flexDirection: "row-reverse",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  messageBubble: {
    maxWidth: "75%",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  assistantBubble: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  userBubble: {
    backgroundColor: "#9D4EDD",
    borderBottomRightRadius: BorderRadius.xs,
  },
  messageText: {
    ...Typography.body,
    color: Colors.dark.text,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#fff",
  },
  messageTime: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  typingText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  quickPromptsSection: {
    marginTop: Spacing.lg,
  },
  quickPromptsTitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  quickPromptsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  quickPromptChip: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
  },
  quickPromptText: {
    ...Typography.small,
  },
  workoutLogSection: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
  },
  workoutLogTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.md,
  },
  muscleChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  muscleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundDefault,
  },
  muscleChipText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.dark.text,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginLeft: Spacing.xs,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  disclaimer: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  assistantBubbleWithExercises: {
    maxWidth: "85%",
  },
  exercisesContainer: {
    marginTop: Spacing.md,
  },
  exercisesDivider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginBottom: Spacing.md,
  },
  exercisesTitle: {
    ...Typography.small,
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  exerciseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exerciseGif: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  exerciseInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  exerciseName: {
    ...Typography.small,
    color: Colors.dark.text,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  exerciseTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  exerciseTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseTagText: {
    fontSize: 10,
    textTransform: "capitalize",
  },
});
