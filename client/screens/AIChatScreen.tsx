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

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { getApiUrl, apiRequest } from "@/lib/query-client";

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
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const QUICK_PROMPTS = [
  "How can I build muscle faster?",
  "What should I eat before a workout?",
  "How do I fix my squat form?",
  "Best exercises for abs?",
  "How often should I train?",
  "Tips for losing body fat?",
];

export default function AIChatScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hey! I'm your AI fitness coach. I can help you with workout advice, nutrition tips, exercise form, recovery strategies, and more. What would you like to know?",
        timestamp: new Date(),
      },
    ]);
  }, []);

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

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const baseUrl = getApiUrl();
      const response = await fetch(`${baseUrl}api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text.trim(),
          history: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
        exercises: data.exercises || [],
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        <View style={styles.headerCenter}>
          <LinearGradient
            colors={["#9D4EDD", "#5A189A"]}
            style={styles.aiAvatar}
          >
            <Feather name="cpu" size={18} color="#fff" />
          </LinearGradient>
          <View>
            <ThemedText style={styles.headerTitle}>AI Coach</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Powered by GPT-4</ThemedText>
          </View>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content:
                  "Hey! I'm your AI fitness coach. I can help you with workout advice, nutrition tips, exercise form, recovery strategies, and more. What would you like to know?",
                timestamp: new Date(),
              },
            ]);
          }}
        >
          <Feather name="refresh-cw" size={20} color={Colors.dark.textSecondary} />
        </Pressable>
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
                  colors={["#9D4EDD", "#5A189A"]}
                  style={styles.messageAvatar}
                >
                  <Feather name="cpu" size={14} color="#fff" />
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
                    <ThemedText style={styles.exercisesTitle}>
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
                            <View style={styles.exerciseTag}>
                              <ThemedText style={styles.exerciseTagText}>
                                {exercise.target}
                              </ThemedText>
                            </View>
                            <View style={styles.exerciseTag}>
                              <ThemedText style={styles.exerciseTagText}>
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
                colors={["#9D4EDD", "#5A189A"]}
                style={styles.messageAvatar}
              >
                <Feather name="cpu" size={14} color="#fff" />
              </LinearGradient>
              <View style={[styles.messageBubble, styles.assistantBubble]}>
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color="#9D4EDD" />
                  <ThemedText style={styles.typingText}>Thinking...</ThemedText>
                </View>
              </View>
            </View>
          )}

          {messages.length === 1 && !isLoading && (
            <View style={styles.quickPromptsSection}>
              <ThemedText style={styles.quickPromptsTitle}>
                Try asking about:
              </ThemedText>
              <View style={styles.quickPromptsGrid}>
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <Pressable
                    key={idx}
                    style={styles.quickPromptChip}
                    onPress={() => sendMessage(prompt)}
                  >
                    <ThemedText style={styles.quickPromptText}>{prompt}</ThemedText>
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
              placeholder="Ask me anything about fitness..."
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
                colors={inputText.trim() ? ["#9D4EDD", "#5A189A"] : [Colors.dark.backgroundSecondary, Colors.dark.backgroundSecondary]}
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
    color: "#9D4EDD",
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
    borderColor: "#9D4EDD30",
  },
  quickPromptText: {
    ...Typography.small,
    color: "#9D4EDD",
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
    color: "#9D4EDD",
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
    backgroundColor: "#9D4EDD20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  exerciseTagText: {
    fontSize: 10,
    color: "#9D4EDD",
    textTransform: "capitalize",
  },
});
