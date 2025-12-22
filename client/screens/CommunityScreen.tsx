import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Animated,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  image?: string;
  likes: number;
  dislikes: number;
  comments: number;
  timestamp: string;
  liked: boolean;
  bookmarked: boolean;
}

const SAMPLE_POSTS: Post[] = [
  {
    id: "1",
    author: {
      name: "Sarah Mitchell",
      avatar: "https://i.pravatar.cc/100?img=5",
      verified: true,
    },
    content: "Just completed my 100th workout this year! Consistency is truly the key to success. Never give up on your fitness journey!",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800",
    likes: 247,
    dislikes: 3,
    comments: 42,
    timestamp: "2h ago",
    liked: false,
    bookmarked: false,
  },
  {
    id: "2",
    author: {
      name: "Mike Johnson",
      avatar: "https://i.pravatar.cc/100?img=8",
      verified: false,
    },
    content: "New personal record on deadlifts today - 180kg! The grind never stops. Thanks to everyone for the support and motivation.",
    likes: 156,
    dislikes: 2,
    comments: 28,
    timestamp: "4h ago",
    liked: true,
    bookmarked: false,
  },
  {
    id: "3",
    author: {
      name: "Emma Davis",
      avatar: "https://i.pravatar.cc/100?img=9",
      verified: true,
    },
    content: "Morning yoga session in the park. There's something magical about starting the day with movement and fresh air. Who else is a morning workout person?",
    image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800",
    likes: 189,
    dislikes: 1,
    comments: 35,
    timestamp: "6h ago",
    liked: false,
    bookmarked: true,
  },
  {
    id: "4",
    author: {
      name: "Chris Thompson",
      avatar: "https://i.pravatar.cc/100?img=12",
      verified: false,
    },
    content: "Week 8 of my transformation complete. Down 12kg and feeling stronger than ever. The AI program recommendations have been incredibly helpful!",
    likes: 312,
    dislikes: 4,
    comments: 67,
    timestamp: "8h ago",
    liked: false,
    bookmarked: false,
  },
  {
    id: "5",
    author: {
      name: "Lisa Anderson",
      avatar: "https://i.pravatar.cc/100?img=16",
      verified: true,
    },
    content: "Remember: Recovery is just as important as the workout itself. Make sure you're getting enough sleep and nutrition!",
    likes: 423,
    dislikes: 2,
    comments: 54,
    timestamp: "12h ago",
    liked: true,
    bookmarked: true,
  },
];

function PostCard({ post, onLike, onBookmark }: { post: Post; onLike: () => void; onBookmark: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleLikePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLike();
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.authorInfo}>
          <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          <View>
            <View style={styles.authorNameRow}>
              <ThemedText style={styles.authorName}>{post.author.name}</ThemedText>
              {post.author.verified && (
                <Feather name="check-circle" size={14} color="#4ECDC4" />
              )}
            </View>
            <ThemedText style={styles.timestamp}>{post.timestamp}</ThemedText>
          </View>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <Feather name="more-horizontal" size={20} color={Colors.dark.textSecondary} />
        </Pressable>
      </View>

      <ThemedText style={styles.postContent}>{post.content}</ThemedText>

      {post.image && (
        <Image source={{ uri: post.image }} style={styles.postImage} resizeMode="cover" />
      )}

      <View style={styles.postActions}>
        <View style={styles.leftActions}>
          <Pressable style={styles.actionButton} onPress={handleLikePress}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Feather
                name={post.liked ? "thumbs-up" : "thumbs-up"}
                size={20}
                color={post.liked ? Colors.dark.accent : Colors.dark.textSecondary}
              />
            </Animated.View>
            <ThemedText style={[styles.actionCount, post.liked && styles.actionCountActive]}>
              {post.likes + (post.liked ? 1 : 0)}
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Feather name="thumbs-down" size={20} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.actionCount}>{post.dislikes}</ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Feather name="message-circle" size={20} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.actionCount}>{post.comments}</ThemedText>
          </Pressable>
        </View>

        <Pressable onPress={onBookmark}>
          <Feather
            name={post.bookmarked ? "bookmark" : "bookmark"}
            size={20}
            color={post.bookmarked ? Colors.dark.accentSecondary : Colors.dark.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function CommunityScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [showCompose, setShowCompose] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");

  const toggleLike = (postId: string) => {
    setPosts(posts.map((p) => (p.id === postId ? { ...p, liked: !p.liked } : p)));
  };

  const toggleBookmark = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(posts.map((p) => (p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p)));
  };

  const createPost = () => {
    if (!newPostContent.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newPost: Post = {
      id: Date.now().toString(),
      author: {
        name: "You",
        avatar: "https://i.pravatar.cc/100?img=33",
        verified: false,
      },
      content: newPostContent,
      likes: 0,
      dislikes: 0,
      comments: 0,
      timestamp: "Just now",
      liked: false,
      bookmarked: false,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setShowCompose(false);
  };

  if (showCompose) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCompose(false);
            }}
          >
            <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
          </Pressable>
          <ThemedText style={styles.headerTitle}>New Post</ThemedText>
          <Pressable onPress={createPost}>
            <ThemedText
              style={[styles.postButton, !newPostContent.trim() && styles.postButtonDisabled]}
            >
              Post
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.composeContent}>
          <View style={styles.composeHeader}>
            <Image
              source={{ uri: "https://i.pravatar.cc/100?img=33" }}
              style={styles.composeAvatar}
            />
            <ThemedText style={styles.composeName}>You</ThemedText>
          </View>
          <TextInput
            style={styles.composeInput}
            value={newPostContent}
            onChangeText={setNewPostContent}
            placeholder="Share your fitness journey..."
            placeholderTextColor={Colors.dark.textSecondary}
            multiline
            autoFocus
          />
        </View>

        <View style={styles.composeActions}>
          <Pressable style={styles.composeAction}>
            <Feather name="image" size={24} color={Colors.dark.accent} />
          </Pressable>
          <Pressable style={styles.composeAction}>
            <Feather name="camera" size={24} color={Colors.dark.accent} />
          </Pressable>
        </View>
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
        <ThemedText style={styles.headerTitle}>Community</ThemedText>
        <Pressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        >
          <Feather name="search" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.createPostCard}>
          <Image
            source={{ uri: "https://i.pravatar.cc/100?img=33" }}
            style={styles.createPostAvatar}
          />
          <Pressable
            style={styles.createPostInput}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCompose(true);
            }}
          >
            <ThemedText style={styles.createPostPlaceholder}>
              Share your progress...
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.filterTabs}>
          {["For You", "Following", "Trending"].map((tab, idx) => (
            <Pressable
              key={tab}
              style={[styles.filterTab, idx === 0 && styles.filterTabActive]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <ThemedText
                style={[styles.filterTabText, idx === 0 && styles.filterTabTextActive]}
              >
                {tab}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => toggleLike(post.id)}
            onBookmark={() => toggleBookmark(post.id)}
          />
        ))}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + Spacing.lg }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setShowCompose(true);
        }}
      >
        <LinearGradient
          colors={[Colors.dark.accent, "#E55A5A"]}
          style={styles.fabGradient}
        >
          <Feather name="edit-2" size={24} color="#fff" />
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
  postButton: {
    ...Typography.body,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  postButtonDisabled: {
    color: Colors.dark.textSecondary,
  },
  content: {
    flex: 1,
  },
  createPostCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.md,
  },
  createPostInput: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  createPostPlaceholder: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  filterTabActive: {
    backgroundColor: Colors.dark.accent,
  },
  filterTabText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  filterTabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  postCard: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.sm,
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  authorName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  timestamp: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  postContent: {
    ...Typography.body,
    color: Colors.dark.text,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  leftActions: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  actionCount: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  actionCountActive: {
    color: Colors.dark.accent,
  },
  composeContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  composeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  composeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: Spacing.sm,
  },
  composeName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  composeInput: {
    ...Typography.body,
    color: Colors.dark.text,
    minHeight: 100,
    textAlignVertical: "top",
  },
  composeActions: {
    flexDirection: "row",
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  composeAction: {
    padding: Spacing.sm,
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
