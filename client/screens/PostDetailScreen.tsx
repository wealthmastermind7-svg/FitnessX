import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { BlurView } from "expo-blur";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import type { RootStackParamList, WorkoutPost } from "@/navigation/RootStackNavigator";

type PostDetailRouteProp = RouteProp<RootStackParamList, "PostDetail">;

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function PostDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<PostDetailRouteProp>();
  const { post } = route.params;
  
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isFollowing, setIsFollowing] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([
    { id: "1", username: "fitness_fan", text: "Great workout! Keep it up!", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
    { id: "2", username: "gym_buddy", text: "Those numbers are impressive!", timestamp: new Date(Date.now() - 15 * 60 * 1000) },
  ]);

  const initials = post.username.slice(0, 2).toUpperCase();

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert("Share", "Sharing options will appear here on a physical device.");
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setComments([
      ...comments,
      {
        id: Date.now().toString(),
        username: "you",
        text: commentText.trim(),
        timestamp: new Date(),
      },
    ]);
    setCommentText("");
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
          <Feather name="chevron-left" size={28} color="#FFF" />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Workout Post</ThemedText>
        <View style={styles.headerButton} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.postAvatar}>
                <ThemedText style={styles.postAvatarText}>{initials}</ThemedText>
              </View>
              <View style={styles.postUserInfo}>
                <ThemedText style={styles.postUsername}>{post.username}</ThemedText>
                <ThemedText style={styles.postTime}>{formatTimeAgo(post.timestamp)}</ThemedText>
              </View>
              <Pressable 
                style={[styles.followButton, isFollowing && { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.dark.accent }]} 
                onPress={handleFollow}
              >
                <ThemedText style={[styles.followButtonText, isFollowing && { color: Colors.dark.accent }]}>
                  {isFollowing ? "Following" : "Follow"}
                </ThemedText>
              </Pressable>
            </View>

            {post.imageUrl && (
              <View style={styles.postImageContainer}>
                <ExpoImage
                  source={{ uri: post.imageUrl }}
                  style={styles.postImage}
                  contentFit="cover"
                  transition={200}
                />
              </View>
            )}

            <ThemedText style={styles.postTitle}>{post.workoutTitle}</ThemedText>
            <ThemedText style={styles.postDescription}>{post.description}</ThemedText>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Feather name="clock" size={20} color={Colors.dark.accent} />
                <ThemedText style={styles.statValue}>{post.duration}</ThemedText>
                <ThemedText style={styles.statLabel}>Duration</ThemedText>
              </View>
              <View style={styles.statCard}>
                <Feather name="activity" size={20} color={Colors.dark.accent} />
                <ThemedText style={styles.statValue}>{post.volume}</ThemedText>
                <ThemedText style={styles.statLabel}>Volume</ThemedText>
              </View>
              {post.sets && (
                <View style={styles.statCard}>
                  <Feather name="layers" size={20} color={Colors.dark.accent} />
                  <ThemedText style={styles.statValue}>{post.sets}</ThemedText>
                  <ThemedText style={styles.statLabel}>Sets</ThemedText>
                </View>
              )}
              {post.records && post.records > 0 && (
                <View style={styles.statCard}>
                  <Feather name="award" size={20} color="#FFD700" />
                  <ThemedText style={styles.statValue}>{post.records}</ThemedText>
                  <ThemedText style={styles.statLabel}>Records</ThemedText>
                </View>
              )}
              {post.avgBpm && (
                <View style={styles.statCard}>
                  <Feather name="heart" size={20} color="#FF6B6B" />
                  <ThemedText style={styles.statValue}>{post.avgBpm}</ThemedText>
                  <ThemedText style={styles.statLabel}>Avg BPM</ThemedText>
                </View>
              )}
              {post.calories && (
                <View style={styles.statCard}>
                  <Feather name="zap" size={20} color="#FF9500" />
                  <ThemedText style={styles.statValue}>{post.calories}</ThemedText>
                  <ThemedText style={styles.statLabel}>Calories</ThemedText>
                </View>
              )}
            </View>

            {post.exercises && post.exercises.length > 0 && (
              <View style={styles.exercisesSection}>
                <ThemedText style={styles.sectionTitle}>Exercises</ThemedText>
                {post.exercises.map((exercise, idx) => (
                  <View key={idx} style={styles.exerciseRow}>
                    <View style={styles.exerciseIndicator} />
                    <View style={styles.exerciseIcon}>
                      <Feather name="activity" size={18} color={Colors.dark.accent} />
                    </View>
                    <View style={styles.exerciseInfo}>
                      <ThemedText style={styles.exerciseName}>{exercise.name}</ThemedText>
                      <ThemedText style={styles.exerciseSets}>{exercise.sets} sets</ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {post.muscleSplit && post.muscleSplit.length > 0 && (
              <View style={styles.muscleSection}>
                <ThemedText style={styles.sectionTitle}>Muscle Split</ThemedText>
                {post.muscleSplit.map((muscle, idx) => (
                  <View key={idx} style={styles.muscleRow}>
                    <ThemedText style={styles.muscleName}>{muscle.muscle}</ThemedText>
                    <View style={styles.muscleBarContainer}>
                      <View style={[styles.muscleBar, { width: `${muscle.percentage}%` }]} />
                    </View>
                    <ThemedText style={styles.musclePercentage}>{muscle.percentage}%</ThemedText>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.postActions}>
              <Pressable onPress={handleLike} style={styles.actionButton}>
                <Feather 
                  name="thumbs-up" 
                  size={22} 
                  color={liked ? Colors.dark.accent : Colors.dark.textSecondary} 
                />
                <ThemedText style={[styles.actionCount, liked && { color: Colors.dark.accent }]}>
                  {likeCount}
                </ThemedText>
              </Pressable>
              <View style={styles.actionButton}>
                <Feather name="message-circle" size={22} color={Colors.dark.textSecondary} />
                <ThemedText style={styles.actionCount}>{comments.length}</ThemedText>
              </View>
              <Pressable onPress={handleShare} style={styles.actionButton}>
                <Feather name="share" size={22} color={Colors.dark.textSecondary} />
              </Pressable>
              <Pressable style={styles.actionButton}>
                <Feather name="bookmark" size={22} color={Colors.dark.textSecondary} />
              </Pressable>
            </View>
          </View>

          <View style={styles.commentsSection}>
            <ThemedText style={styles.sectionTitle}>Comments ({comments.length})</ThemedText>
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentCard}>
                <View style={styles.commentAvatar}>
                  <ThemedText style={styles.commentAvatarText}>
                    {comment.username.slice(0, 2).toUpperCase()}
                  </ThemedText>
                </View>
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <ThemedText style={styles.commentUsername}>{comment.username}</ThemedText>
                    <ThemedText style={styles.commentTime}>{formatTimeAgo(comment.timestamp)}</ThemedText>
                  </View>
                  <ThemedText style={styles.commentText}>{comment.text}</ThemedText>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={styles.commentInputWrapper}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={Colors.dark.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <Pressable onPress={handleComment} style={styles.sendButton}>
              <Feather name="send" size={20} color={Colors.dark.accent} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  postCard: {
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  postAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.accent + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  postAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.accent,
  },
  postUserInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  postUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  postTime: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  postImageContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 250,
    borderRadius: BorderRadius.md,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  postDescription: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    minWidth: 90,
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.dark.text,
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  exercisesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  exerciseIndicator: {
    width: 3,
    height: 24,
    backgroundColor: Colors.dark.accent,
    borderRadius: 2,
    marginRight: Spacing.sm,
  },
  exerciseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accent + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  exerciseSets: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  muscleSection: {
    marginBottom: Spacing.lg,
  },
  muscleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  muscleName: {
    fontSize: 14,
    color: Colors.dark.text,
    width: 80,
  },
  muscleBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    marginHorizontal: Spacing.sm,
    overflow: "hidden",
  },
  muscleBar: {
    height: "100%",
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
  musclePercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
    width: 40,
    textAlign: "right",
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: Spacing.md,
    gap: Spacing.xl,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionCount: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  commentsSection: {
    marginTop: Spacing.xl,
  },
  commentCard: {
    flexDirection: "row",
    marginBottom: Spacing.md,
    backgroundColor: "rgba(30, 30, 40, 0.7)",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.15)",
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.accent + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.dark.accent,
  },
  commentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  commentTime: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  commentText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    overflow: "hidden",
  },
  commentInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
  },
  commentInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.dark.text,
    maxHeight: 80,
  },
  sendButton: {
    padding: Spacing.sm,
  },
});
