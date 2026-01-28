import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import type { RootStackParamList, WorkoutPost } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SUGGESTED_ATHLETES = [
  { id: "1", username: "fitpro_mike", name: "Mike Chen", featured: true },
  { id: "2", username: "sarah_lifts", name: "Sarah Johnson", featured: true },
  { id: "3", username: "gym_beast99", name: "Alex Rivera", featured: false },
  { id: "4", username: "healthnut_jen", name: "Jennifer Lee", featured: true },
  { id: "5", username: "iron_will", name: "Marcus Thompson", featured: false },
];

const EXERCISE_CATEGORIES = [
  { id: "strength", label: "Strength", icon: "trending-up" },
  { id: "cardio", label: "Cardio", icon: "heart" },
  { id: "mobility", label: "Mobility", icon: "wind" },
  { id: "stretching", label: "Stretching", icon: "maximize-2" },
  { id: "plyometrics", label: "Plyometrics", icon: "zap" },
];

const SAMPLE_FEED: WorkoutPost[] = [
  {
    id: "1",
    userId: "u1",
    username: "missouri_luchador",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    workoutTitle: "Max Effort - Upper",
    description: "Great leg day, progressed a lot, hit absolute failure on hack squat | 9/10 workout",
    duration: "1h 34min",
    volume: "15,707.5 kg",
    sets: 13,
    records: 2,
    avgBpm: 137,
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
    exercises: [
      { name: "Goblet Squat", sets: 1 },
      { name: "Romanian Deadlift (Dumbbell)", sets: 1 },
      { name: "Squat (Barbell)", sets: 9 },
    ],
    muscleSplit: [
      { muscle: "Legs", percentage: 96 },
      { muscle: "Back", percentage: 4 },
    ],
    likes: 18,
    comments: 2,
    isLiked: false,
  },
  {
    id: "2",
    userId: "u2",
    username: "michelle_mh",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    workoutTitle: "Wednesday - Legs",
    description: "Was really struggling this morning as I'm trying to do more weight less reps. It's funny how on...",
    duration: "1h 3min",
    volume: "32,448 kg",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    exercises: [
      { name: "Leg Press (Machine)", sets: 4 },
      { name: "Leg Extension", sets: 3 },
    ],
    muscleSplit: [
      { muscle: "Legs", percentage: 100 },
    ],
    likes: 11,
    comments: 4,
    isLiked: true,
  },
  {
    id: "3",
    userId: "u3",
    username: "misfit13007",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    workoutTitle: "Chest day 1",
    description: "Managed to drag myself back in... feeling a rally coming on.",
    duration: "1h 7min",
    volume: "11,259.3 kg",
    records: 2,
    exercises: [
      { name: "Bench Press (Barbell)", sets: 5 },
      { name: "Incline Dumbbell Press", sets: 4 },
    ],
    muscleSplit: [
      { muscle: "Chest", percentage: 80 },
      { muscle: "Shoulders", percentage: 15 },
      { muscle: "Arms", percentage: 5 },
    ],
    likes: 32,
    comments: 1,
    isLiked: false,
  },
  {
    id: "4",
    userId: "u4",
    username: "israelly",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    workoutTitle: "Dorsal e Biceps",
    description: "Biceps",
    duration: "1h 6min",
    volume: "4,042.4 kg",
    records: 7,
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=800",
    exercises: [
      { name: "Lat Pulldown", sets: 4 },
      { name: "Barbell Curl", sets: 3 },
    ],
    muscleSplit: [
      { muscle: "Back", percentage: 65 },
      { muscle: "Arms", percentage: 35 },
    ],
    likes: 15,
    comments: 0,
    isLiked: false,
  },
  {
    id: "5",
    userId: "u5",
    username: "mikeliebestod",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    workoutTitle: "PUSH day",
    description: "Good with strength but big drops in 3rd sets. I need to improve my resistance.",
    duration: "1h 24min",
    volume: "7,855 kg",
    avgBpm: 133,
    exercises: [
      { name: "Overhead Press (Barbell)", sets: 5 },
      { name: "Lateral Raise (Dumbbell)", sets: 5 },
      { name: "Skullcrusher (Dumbbell)", sets: 4 },
    ],
    muscleSplit: [
      { muscle: "Shoulders", percentage: 50 },
      { muscle: "Chest", percentage: 30 },
      { muscle: "Arms", percentage: 20 },
    ],
    likes: 21,
    comments: 0,
    isLiked: false,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

function AthleteCard({ athlete, onFollow }: { athlete: typeof SUGGESTED_ATHLETES[0]; onFollow: () => void }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const initials = athlete.name.split(" ").map(n => n[0]).join("").toUpperCase();

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
    onFollow();
  };

  return (
    <View style={styles.athleteCard}>
      <Pressable style={styles.athleteRemove}>
        <Feather name="x" size={16} color={Colors.dark.textSecondary} />
      </Pressable>
      <View style={styles.athleteAvatar}>
        <ThemedText style={styles.athleteInitials}>{initials}</ThemedText>
      </View>
      <ThemedText style={styles.athleteUsername} numberOfLines={1}>
        {athlete.username}
      </ThemedText>
      {athlete.featured && (
        <ThemedText style={styles.athleteFeatured}>Featured</ThemedText>
      )}
      <Pressable
        onPress={handleFollow}
        style={[styles.followButton, isFollowing && styles.followingButton]}
      >
        <ThemedText style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
          {isFollowing ? "Following" : "Follow"}
        </ThemedText>
      </Pressable>
    </View>
  );
}

function WorkoutPostCard({ post, onLike, onComment, onShare, onPress }: { 
  post: WorkoutPost; 
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onPress: () => void;
}) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isFollowing, setIsFollowing] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const initials = post.username.slice(0, 2).toUpperCase();

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (liked) {
      setLikeCount(likeCount - 1);
    } else {
      setLikeCount(likeCount + 1);
    }
    setLiked(!liked);
    onLike();
  };

  const handleFollow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFollowing(!isFollowing);
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={onPress}>
      <Animated.View style={[styles.postCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.postHeader}>
          <View style={styles.postAvatar}>
            <ThemedText style={styles.postAvatarText}>{initials}</ThemedText>
          </View>
          <View style={styles.postUserInfo}>
            <ThemedText style={styles.postUsername}>{post.username}</ThemedText>
            <ThemedText style={styles.postTime}>{formatTimeAgo(post.timestamp)}</ThemedText>
          </View>
          <Pressable style={[styles.followSmall, isFollowing && { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.dark.accent }]} onPress={handleFollow}>
            <ThemedText style={[styles.followSmallText, isFollowing && { color: Colors.dark.accent }]}>
              {isFollowing ? "Following" : "+ Follow"}
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
        <ThemedText style={styles.postDescription} numberOfLines={2}>
          {post.description}
        </ThemedText>

        <View style={styles.postStats}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Time</ThemedText>
            <ThemedText style={styles.statValue}>{post.duration}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>Volume</ThemedText>
            <ThemedText style={styles.statValue}>{post.volume}</ThemedText>
          </View>
          {post.records !== undefined && post.records > 0 && (
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Records</ThemedText>
              <View style={styles.recordsValue}>
                <ThemedText style={styles.recordIcon}>🏆</ThemedText>
                <ThemedText style={styles.statValue}>{post.records}</ThemedText>
              </View>
            </View>
          )}
          {post.avgBpm !== undefined && (
            <View style={styles.statItem}>
              <ThemedText style={styles.statLabel}>Avg bpm</ThemedText>
              <View style={styles.recordsValue}>
                <ThemedText style={[styles.statValue, { color: "#FF6B6B" }]}>❤️ {post.avgBpm}</ThemedText>
              </View>
            </View>
          )}
        </View>

        {post.exercises.length > 0 && (
          <View style={styles.exercisesList}>
            {post.exercises.slice(0, 3).map((exercise, idx) => (
              <View key={idx} style={styles.exerciseRow}>
                <View style={styles.exerciseIndicator} />
                <View style={styles.exerciseIcon}>
                  <Feather name="activity" size={16} color={Colors.dark.textSecondary} />
                </View>
                <ThemedText style={styles.exerciseName}>
                  {exercise.sets} set{exercise.sets > 1 ? "s" : ""} {exercise.name}
                </ThemedText>
              </View>
            ))}
            {post.exercises.length > 3 && (
              <ThemedText style={styles.moreExercises}>
                See {post.exercises.length - 3} more exercises
              </ThemedText>
            )}
          </View>
        )}

        <View style={styles.postActions}>
          <Pressable onPress={handleLike} style={styles.actionButton}>
            <Feather 
              name={liked ? "thumbs-up" : "thumbs-up"} 
              size={20} 
              color={liked ? Colors.dark.accent : Colors.dark.textSecondary} 
            />
            <ThemedText style={[styles.actionCount, liked && { color: Colors.dark.accent }]}>
              {likeCount}
            </ThemedText>
          </Pressable>
          <Pressable onPress={onComment} style={styles.actionButton}>
            <Feather name="message-circle" size={20} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.actionCount}>{post.comments}</ThemedText>
          </Pressable>
          {post.userId === "current_user" && (
            <Pressable onPress={onShare} style={styles.actionButton}>
              <Feather name="share" size={20} color={Colors.dark.textSecondary} />
            </Pressable>
          )}
        </View>

        {likeCount > 0 && (
          <View style={styles.likedBy}>
            <View style={styles.likedAvatars}>
              {[1, 2, 3].map((_, i) => (
                <View key={i} style={[styles.likedAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                  <ThemedText style={styles.likedAvatarText}>
                    {String.fromCharCode(65 + i)}
                  </ThemedText>
                </View>
              ))}
            </View>
            <ThemedText style={styles.likedText}>
              Liked by <ThemedText style={styles.likedUsername}>user{Math.floor(Math.random() * 100)}</ThemedText> and others
            </ThemedText>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function CommunityFeedScreen({ isNested = false }: { isNested?: boolean }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NavigationProp>();
  const [feed, setFeed] = useState<WorkoutPost[]>(SAMPLE_FEED);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  const loadFeed = useCallback(async () => {
    try {
      const savedPostsJson = await AsyncStorage.getItem("community_posts");
      if (savedPostsJson) {
        const savedPosts = JSON.parse(savedPostsJson).map((post: any) => ({
          ...post,
          timestamp: new Date(post.timestamp)
        }));
        setFeed([...savedPosts, ...SAMPLE_FEED]);
      } else {
        setFeed(SAMPLE_FEED);
      }
    } catch (error) {
      console.error("Error loading feed:", error);
      setFeed(SAMPLE_FEED);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadFeed();
    setRefreshing(false);
  }, [loadFeed]);

  const handlePostPress = (post: WorkoutPost) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("PostDetail", { post });
  };

  const handleCreatePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("CreatePost");
  };

  const renderHeader = () => (
    <>
      {showWelcome && (
        <View style={styles.welcomeCard}>
          <Pressable 
            style={styles.welcomeClose}
            onPress={() => setShowWelcome(false)}
          >
            <Feather name="x" size={18} color={Colors.dark.textSecondary} />
          </Pressable>
          <ThemedText style={styles.welcomeTitle}>Hey there! 👋</ThemedText>
          <ThemedText style={styles.welcomeText}>
            Welcome to FitForge! Track your workouts, connect with athletes, and crush your fitness goals together.
          </ThemedText>
          <ThemedText style={styles.welcomeText}>
            Feel free to follow athletes and get inspired by their workouts!
          </ThemedText>
          <View style={styles.welcomeFooter}>
            <View style={styles.welcomeAvatar}>
              <LinearGradient
                colors={[Colors.dark.accent, "#FF8C8C"] as any}
                style={styles.welcomeAvatarGradient}
              >
                <ThemedText style={styles.welcomeAvatarText}>FF</ThemedText>
              </LinearGradient>
            </View>
            <View style={styles.welcomeCreator}>
              <ThemedText style={styles.welcomeCreatorName}>FitForge Team</ThemedText>
              <Pressable style={styles.welcomeFollowButton}>
                <ThemedText style={styles.welcomeFollowText}>Follow</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <View style={styles.suggestedSection}>
        <View style={styles.suggestedHeader}>
          <ThemedText style={styles.suggestedTitle}>Suggested Athletes</ThemedText>
          <Pressable onPress={() => navigation.navigate("InviteFriends" as any)}>
            <View style={styles.inviteLink}>
              <Feather name="plus" size={16} color={Colors.dark.accent} />
              <ThemedText style={styles.inviteLinkText}>Invite a friend</ThemedText>
            </View>
          </Pressable>
        </View>
        <FlatList
          horizontal
          data={SUGGESTED_ATHLETES}
          renderItem={({ item }) => (
            <AthleteCard athlete={item} onFollow={() => {}} />
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.athletesList}
        />
      </View>

      <View style={styles.exerciseLibrarySection}>
        <View style={styles.suggestedHeader}>
          <ThemedText style={styles.suggestedTitle}>Exercise Library</ThemedText>
          <Pressable onPress={() => navigation.navigate("ExerciseBrowser")}>
            <ThemedText style={styles.seeAllText}>See All</ThemedText>
          </Pressable>
        </View>
        <FlatList
          horizontal
          data={EXERCISE_CATEGORIES}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate("ExerciseBrowser", { filterByCategory: item.id });
              }}
              style={styles.categoryCard}
            >
              <View style={styles.categoryCardInner}>
                <Feather name={item.icon as any} size={24} color={Colors.dark.accent} />
                <ThemedText style={styles.categoryLabel}>{item.label}</ThemedText>
              </View>
            </Pressable>
          )}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
    </>
  );

  const feedContent = (
    <FlatList
      data={feed}
      scrollEnabled={!isNested}
      renderItem={({ item }) => (
        <WorkoutPostCard
          post={item}
          onLike={() => {}}
          onComment={() => handlePostPress(item)}
          onShare={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            Alert.alert("Share", "Sharing options will appear here on a physical device.");
          }}
          onPress={() => handlePostPress(item)}
        />
      )}
      keyExtractor={item => item.id}
      ListHeaderComponent={isNested ? null : renderHeader}
      contentContainerStyle={[
        styles.feedContent,
        !isNested && { paddingBottom: tabBarHeight + Spacing.xl }
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        isNested ? undefined : (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.accent}
          />
        )
      }
      ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
    />
  );

  if (isNested) {
    return feedContent;
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable style={styles.headerDropdown}>
          <ThemedText style={styles.headerTitle}>Discover</ThemedText>
          <Feather name="chevron-down" size={20} color={Colors.dark.text} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton}>
            <Feather name="search" size={24} color={Colors.dark.text} />
          </Pressable>
          <Pressable style={styles.headerButton}>
            <Feather name="bell" size={24} color={Colors.dark.text} />
          </Pressable>
        </View>
      </View>

      {feedContent}

      <Pressable
        onPress={handleCreatePost}
        style={[styles.fab, { bottom: tabBarHeight + Spacing.lg }]}
      >
        <LinearGradient
          colors={["#FF6B6B", "#FF4B4B"]}
          style={styles.fabGradient}
        >
          <Feather name="plus" size={28} color="#FFF" />
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
  fab: {
    position: "absolute",
    right: Spacing.lg,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "#FF6B6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.dark.text,
  },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  feedContent: {
    paddingHorizontal: Spacing.lg,
  },
  welcomeCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  welcomeClose: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  welcomeFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  welcomeAvatar: {
    marginRight: Spacing.md,
  },
  welcomeAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeAvatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  welcomeCreator: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeCreatorName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  welcomeFollowButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  welcomeFollowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  suggestedSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  suggestedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  inviteLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  inviteLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  athletesList: {
    gap: Spacing.md,
  },
  athleteCard: {
    width: 140,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  athleteRemove: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
  },
  athleteAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.accent + "30",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  athleteInitials: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.accent,
  },
  athleteUsername: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
    marginBottom: 2,
  },
  athleteFeatured: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  followButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    width: "100%",
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  followingButtonText: {
    color: Colors.dark.text,
  },
  exerciseLibrarySection: {
    marginBottom: Spacing.lg,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  categoryCard: {
    width: 120,
    height: 80,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: 'rgba(30, 30, 40, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  categoryCardInner: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.xs,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.dark.text,
    textTransform: "capitalize",
  },
  categoriesList: {
    gap: Spacing.md,
  },
  postCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  postImageContainer: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  postAvatarText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  postUserInfo: {
    flex: 1,
  },
  postUsername: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  postTime: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  followSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  followSmallText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
  },
  postDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  postStats: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  statItem: {},
  statLabel: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  recordsValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recordIcon: {
    fontSize: 14,
  },
  exercisesList: {
    marginBottom: Spacing.md,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  exerciseIndicator: {
    width: 3,
    height: 24,
    backgroundColor: "#9D4EDD",
    borderRadius: 2,
    marginRight: Spacing.md,
  },
  exerciseIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.sm,
  },
  exerciseName: {
    fontSize: 14,
    color: Colors.dark.text,
    flex: 1,
  },
  moreExercises: {
    fontSize: 14,
    color: Colors.dark.accent,
    marginTop: Spacing.sm,
    marginLeft: Spacing.xl + Spacing.md,
  },
  postActions: {
    flexDirection: "row",
    gap: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
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
  likedBy: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  likedAvatars: {
    flexDirection: "row",
  },
  likedAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.dark.backgroundDefault,
  },
  likedAvatarText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  likedText: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  likedUsername: {
    fontWeight: "600",
    color: Colors.dark.text,
  },
  postSeparator: {
    height: Spacing.md,
  },
});
