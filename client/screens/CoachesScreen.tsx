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

interface Coach {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  rating: number;
  reviews: number;
  specialty: string;
  credentials: string;
  monthlyPrice: number;
  experience: string;
  clients: number;
}

const COACHES: Coach[] = [
  {
    id: "1",
    name: "Alex Thompson",
    avatar: "https://i.pravatar.cc/200?img=11",
    verified: true,
    rating: 4.9,
    reviews: 241,
    specialty: "Strength Training",
    credentials: "NASM Certified, 10+ years experience",
    monthlyPrice: 250,
    experience: "Former competitive powerlifter",
    clients: 156,
  },
  {
    id: "2",
    name: "Barbara Moore",
    avatar: "https://i.pravatar.cc/200?img=5",
    verified: true,
    rating: 4.8,
    reviews: 80,
    specialty: "Weight Loss & Nutrition",
    credentials: "ACE Certified, Nutrition Specialist",
    monthlyPrice: 120,
    experience: "Helped 500+ clients transform",
    clients: 89,
  },
  {
    id: "3",
    name: "Thomas Young",
    avatar: "https://i.pravatar.cc/200?img=12",
    verified: true,
    rating: 5.0,
    reviews: 66,
    specialty: "Bodybuilding",
    credentials: "IFBB Pro, Competition Coach",
    monthlyPrice: 200,
    experience: "First place European Championship",
    clients: 42,
  },
  {
    id: "4",
    name: "George Lee",
    avatar: "https://i.pravatar.cc/200?img=8",
    verified: true,
    rating: 4.7,
    reviews: 34,
    specialty: "Functional Fitness",
    credentials: "CrossFit L3, Arnold Classic competitor",
    monthlyPrice: 180,
    experience: "5x CrossFit Games qualifier",
    clients: 67,
  },
  {
    id: "5",
    name: "Ensley Smith",
    avatar: "https://i.pravatar.cc/200?img=9",
    verified: false,
    rating: 4.6,
    reviews: 45,
    specialty: "HIIT & Cardio",
    credentials: "ACE Certified, Group Fitness Instructor",
    monthlyPrice: 90,
    experience: "Marathon runner, Triathlete",
    clients: 124,
  },
  {
    id: "6",
    name: "Robert Brown",
    avatar: "https://i.pravatar.cc/200?img=60",
    verified: true,
    rating: 4.9,
    reviews: 16,
    specialty: "Sports Performance",
    credentials: "CSCS, Former NFL Trainer",
    monthlyPrice: 160,
    experience: "Trained professional athletes",
    clients: 28,
  },
];

function CoachCard({ coach, onPress }: { coach: Coach; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

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

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Feather
          key={i}
          name="star"
          size={14}
          color={i < Math.floor(rating) ? "#FFB347" : Colors.dark.textSecondary}
          style={{ marginRight: 2 }}
        />
      );
    }
    return stars;
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      <Animated.View style={[styles.coachCard, { transform: [{ scale: scaleAnim }] }]}>
        <Image source={{ uri: coach.avatar }} style={styles.coachAvatar} />
        <View style={styles.coachInfo}>
          <View style={styles.coachNameRow}>
            <ThemedText style={styles.coachName}>{coach.name}</ThemedText>
            {coach.verified && (
              <Feather name="check-circle" size={16} color="#4ECDC4" />
            )}
          </View>
          <View style={styles.ratingRow}>
            {renderStars(coach.rating)}
            <ThemedText style={styles.reviewCount}>{coach.reviews}</ThemedText>
          </View>
          <ThemedText style={styles.specialty} numberOfLines={2}>
            {coach.credentials}
          </ThemedText>
          <View style={styles.priceRow}>
            <ThemedText style={styles.priceLabel}>Monthly training:</ThemedText>
            <ThemedText style={styles.price}>${coach.monthlyPrice}</ThemedText>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function CoachesScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const filteredCoaches = COACHES.filter((coach) => {
    const matchesSearch = coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coach.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !filter || coach.specialty.includes(filter);
    return matchesSearch && matchesFilter;
  });

  const SPECIALTIES = [
    "All",
    "Strength Training",
    "Weight Loss",
    "Bodybuilding",
    "Functional Fitness",
    "Sports Performance",
  ];

  if (selectedCoach) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCoach(null);
            }}
          >
            <Feather name="arrow-left" size={24} color={Colors.dark.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Coach Profile</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          <View style={styles.profileHeader}>
            <Image source={{ uri: selectedCoach.avatar }} style={styles.profileAvatar} />
            <View style={styles.profileNameRow}>
              <ThemedText style={styles.profileName}>{selectedCoach.name}</ThemedText>
              {selectedCoach.verified && (
                <Feather name="check-circle" size={20} color="#4ECDC4" />
              )}
            </View>
            <ThemedText style={styles.profileSpecialty}>{selectedCoach.specialty}</ThemedText>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}>
                <ThemedText style={styles.profileStatValue}>{selectedCoach.clients}</ThemedText>
                <ThemedText style={styles.profileStatLabel}>Clients</ThemedText>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <View style={styles.ratingRow}>
                  <Feather name="star" size={16} color="#FFB347" />
                  <ThemedText style={styles.profileStatValue}>{selectedCoach.rating}</ThemedText>
                </View>
                <ThemedText style={styles.profileStatLabel}>{selectedCoach.reviews} reviews</ThemedText>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStat}>
                <ThemedText style={styles.profileStatValue}>${selectedCoach.monthlyPrice}</ThemedText>
                <ThemedText style={styles.profileStatLabel}>per month</ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.profileSection}>
            <ThemedText style={styles.sectionTitle}>About</ThemedText>
            <ThemedText style={styles.profileBio}>
              {selectedCoach.credentials}. {selectedCoach.experience}. 
              Passionate about helping clients achieve their fitness goals through 
              personalized training programs and continuous support.
            </ThemedText>
          </View>

          <View style={styles.profileSection}>
            <ThemedText style={styles.sectionTitle}>Services Included</ThemedText>
            {[
              "Personalized workout programs",
              "Weekly check-ins and adjustments",
              "Nutrition guidance and meal suggestions",
              "24/7 messaging support",
              "Progress tracking and analysis",
              "Video form reviews",
            ].map((service, idx) => (
              <View key={idx} style={styles.serviceItem}>
                <Feather name="check" size={18} color={Colors.dark.success} />
                <ThemedText style={styles.serviceText}>{service}</ThemedText>
              </View>
            ))}
          </View>

          <View style={styles.profileSection}>
            <ThemedText style={styles.sectionTitle}>Reviews</ThemedText>
            {[
              { name: "John D.", rating: 5, text: "Amazing coach! Helped me reach my goals faster than I thought possible." },
              { name: "Sarah M.", rating: 5, text: "Very knowledgeable and always available for questions. Highly recommend!" },
              { name: "Mike R.", rating: 4, text: "Great personalized programs. Worth every penny." },
            ].map((review, idx) => (
              <View key={idx} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <ThemedText style={styles.reviewerName}>{review.name}</ThemedText>
                  <View style={styles.ratingRow}>
                    {[...Array(review.rating)].map((_, i) => (
                      <Feather key={i} name="star" size={12} color="#FFB347" />
                    ))}
                  </View>
                </View>
                <ThemedText style={styles.reviewText}>{review.text}</ThemedText>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={[styles.hireFooter, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.hirePrice}>
            <ThemedText style={styles.hirePriceValue}>${selectedCoach.monthlyPrice}</ThemedText>
            <ThemedText style={styles.hirePriceLabel}>/month</ThemedText>
          </View>
          <Pressable
            style={styles.hireButton}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <LinearGradient
              colors={[Colors.dark.accent, "#E55A5A"]}
              style={styles.hireButtonGradient}
            >
              <ThemedText style={styles.hireButtonText}>Start Training</ThemedText>
            </LinearGradient>
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
        <ThemedText style={styles.headerTitle}>Coaches</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color={Colors.dark.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for coaches"
          placeholderTextColor={Colors.dark.textSecondary}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {SPECIALTIES.map((specialty) => (
          <Pressable
            key={specialty}
            style={[
              styles.filterChip,
              (filter === specialty || (specialty === "All" && !filter)) && styles.filterChipActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilter(specialty === "All" ? null : specialty);
            }}
          >
            <ThemedText
              style={[
                styles.filterChipText,
                (filter === specialty || (specialty === "All" && !filter)) && styles.filterChipTextActive,
              ]}
            >
              {specialty}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      >
        {filteredCoaches.map((coach) => (
          <CoachCard
            key={coach.id}
            coach={coach}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedCoach(coach);
            }}
          />
        ))}
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
  headerTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    color: Colors.dark.text,
    ...Typography.body,
  },
  filterContainer: {
    maxHeight: 50,
    marginTop: Spacing.md,
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
  },
  filterChipActive: {
    backgroundColor: Colors.dark.accent,
  },
  filterChipText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  coachCard: {
    flexDirection: "row",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  coachAvatar: {
    width: 80,
    height: 100,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
  },
  coachInfo: {
    flex: 1,
  },
  coachNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  coachName: {
    ...Typography.h3,
    color: Colors.dark.text,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  reviewCount: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.xs,
  },
  specialty: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  priceLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  price: {
    ...Typography.body,
    color: Colors.dark.accent,
    fontWeight: "600",
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: Spacing.md,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  profileName: {
    ...Typography.h1,
    color: Colors.dark.text,
  },
  profileSpecialty: {
    ...Typography.body,
    color: Colors.dark.accent,
    marginBottom: Spacing.lg,
  },
  profileStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileStat: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  profileStatValue: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  profileStatLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.dark.border,
  },
  profileSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  profileBio: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  serviceText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  reviewCard: {
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  reviewerName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  reviewText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  hireFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  hirePrice: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  hirePriceValue: {
    ...Typography.h1,
    color: Colors.dark.text,
  },
  hirePriceLabel: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  hireButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  hireButtonGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  hireButtonText: {
    ...Typography.body,
    color: "#fff",
    fontWeight: "600",
  },
});
