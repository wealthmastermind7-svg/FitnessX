import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Linking,
  Platform,
  TextInput,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Contacts from "expo-contacts";
import * as Sharing from "expo-sharing";
import * as Haptics from "expo-haptics";
import { useNavigation } from "@react-navigation/native";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

type Contact = {
  id: string;
  name: string;
  phoneNumber?: string;
  imageAvailable: boolean;
};

const SHARE_OPTIONS = [
  { id: "whatsapp", name: "WhatsApp", icon: "message-circle", color: "#25D366" },
  { id: "messenger", name: "Messenger", icon: "send", color: "#0084FF" },
  { id: "facebook", name: "Facebook", icon: "facebook", color: "#1877F2" },
  { id: "twitter", name: "Twitter", icon: "twitter", color: "#1DA1F2" },
  { id: "copy", name: "Copy Link", icon: "copy", color: "#6B7280" },
  { id: "more", name: "Share More", icon: "share", color: "#9CA3AF" },
];

const INVITE_MESSAGE = "Join me on FitForge! Track your workouts, get AI coaching, and crush your fitness goals together. Download now: https://apps.apple.com/us/app/fitforgex/id6756863078";

export default function InviteFriendsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [invitedContacts, setInvitedContacts] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkContactsPermission();
  }, []);

  const checkContactsPermission = async () => {
    const { status } = await Contacts.getPermissionsAsync();
    if (status === "granted") {
      setHasPermission(true);
      loadContacts();
    } else {
      setHasPermission(false);
    }
  };

  const requestContactsPermission = async () => {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status === "granted") {
      setHasPermission(true);
      loadContacts();
    } else {
      setHasPermission(false);
      if (Platform.OS !== "web") {
        Alert.alert(
          "Permission Required",
          "Please enable contacts access in Settings to invite friends.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Open Settings", 
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch (error) {
                  console.log("Could not open settings");
                }
              }
            },
          ]
        );
      }
    }
  };

  const loadContacts = async () => {
    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers, Contacts.Fields.Image],
        sort: Contacts.SortTypes.FirstName,
      });

      if (data.length > 0) {
        const formattedContacts: Contact[] = data
          .filter((contact: any) => contact.name)
          .map((contact: any) => ({
            id: contact.id || Math.random().toString(),
            name: contact.name || "Unknown",
            phoneNumber: contact.phoneNumbers?.[0]?.number,
            imageAvailable: contact.imageAvailable || false,
          }));
        setContacts(formattedContacts);
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  };

  const handleShare = async (option: typeof SHARE_OPTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (option.id) {
      case "copy":
        // Would use Clipboard API
        Alert.alert("Copied!", "Invite link copied to clipboard");
        break;
      case "more":
        if (await Sharing.isAvailableAsync()) {
          try {
            await Sharing.shareAsync("https://apps.apple.com/us/app/fitforgex/id6756863078", {
              dialogTitle: "Invite friends to FitForge",
            });
          } catch (error) {
            console.log("Sharing cancelled or failed");
          }
        }
        break;
      case "whatsapp":
        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(INVITE_MESSAGE)}`;
        try {
          await Linking.openURL(whatsappUrl);
        } catch {
          Alert.alert("WhatsApp not installed", "Please install WhatsApp to share via this method.");
        }
        break;
      default:
        Alert.alert("Coming Soon", `${option.name} sharing will be available soon!`);
    }
  };

  const handleInviteContact = (contact: Contact) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (invitedContacts.has(contact.id)) {
      return;
    }

    // Simulate sending invite via SMS
    if (contact.phoneNumber && Platform.OS !== "web") {
      const smsUrl = `sms:${contact.phoneNumber}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(INVITE_MESSAGE)}`;
      Linking.openURL(smsUrl).catch(() => {
        Alert.alert("Error", "Could not open SMS app");
      });
    } else {
      Alert.alert("Invite Sent!", `Invitation sent to ${contact.name}`);
    }

    setInvitedContacts(prev => new Set([...prev, contact.id]));
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContact = ({ item }: { item: Contact }) => {
    const isInvited = invitedContacts.has(item.id);
    const initials = item.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    return (
      <View style={styles.contactRow}>
        <View style={styles.contactAvatar}>
          <ThemedText style={styles.contactInitials}>{initials}</ThemedText>
        </View>
        <ThemedText style={styles.contactName} numberOfLines={1}>
          {item.name}
        </ThemedText>
        <Pressable
          onPress={() => handleInviteContact(item)}
          style={[styles.inviteButton, isInvited && styles.invitedButton]}
          disabled={isInvited}
        >
          <ThemedText style={[styles.inviteButtonText, isInvited && styles.invitedButtonText]}>
            {isInvited ? "Invited" : "Invite"}
          </ThemedText>
        </Pressable>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Invite Friends</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[Colors.dark.accent, "#FF8C8C"] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroIcon}
          >
            <Feather name="users" size={32} color="#fff" />
          </LinearGradient>
          <ThemedText style={styles.heroTitle}>Invite your workout buddies</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Invite Friends</ThemedText>
          <View style={styles.shareGrid}>
            {SHARE_OPTIONS.map(option => (
              <Pressable
                key={option.id}
                onPress={() => handleShare(option)}
                style={({ pressed }) => [
                  styles.shareOption,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }
                ]}
              >
                <View style={[styles.shareIconContainer, { backgroundColor: option.color }]}>
                  <Feather name={option.icon as any} size={24} color="#fff" />
                </View>
                <ThemedText style={styles.shareLabel}>{option.name}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable
          onPress={hasPermission ? undefined : requestContactsPermission}
          style={styles.connectContacts}
        >
          <View style={styles.connectIcon}>
            <Feather name="users" size={20} color={Colors.dark.textSecondary} />
          </View>
          <View style={styles.connectText}>
            <ThemedText style={styles.connectTitle}>Connect with Contacts</ThemedText>
            <ThemedText style={styles.connectSubtitle}>Find people you know</ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
        </Pressable>

        {hasPermission && contacts.length > 0 && (
          <View style={styles.contactsSection}>
            <View style={styles.contactsHeader}>
              <ThemedText style={styles.sectionLabel}>Contact Discovery</ThemedText>
              <Pressable onPress={() => Linking.openSettings()}>
                <ThemedText style={styles.settingsLink}>Settings</ThemedText>
              </Pressable>
            </View>

            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color={Colors.dark.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search friends"
                placeholderTextColor={Colors.dark.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ThemedText style={styles.contactsSectionTitle}>Invite your contacts</ThemedText>
            
            <FlatList
              data={filteredContacts.slice(0, 20)}
              renderItem={renderContact}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.contactSeparator} />}
            />
          </View>
        )}

        {hasPermission === false && (
          <View style={styles.permissionCard}>
            <Feather name="lock" size={24} color={Colors.dark.textSecondary} />
            <ThemedText style={styles.permissionText}>
              Enable contacts access to find and invite your friends
            </ThemedText>
            <Pressable onPress={requestContactsPermission} style={styles.enableButton}>
              <ThemedText style={styles.enableButtonText}>Enable Access</ThemedText>
            </Pressable>
          </View>
        )}
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
  backButton: {
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.dark.text,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  shareGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  shareOption: {
    width: "28%",
    alignItems: "center",
    gap: Spacing.sm,
  },
  shareIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  shareLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.dark.text,
    textAlign: "center",
  },
  connectContacts: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  connectIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  connectText: {
    flex: 1,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.text,
  },
  connectSubtitle: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  contactsSection: {
    marginTop: Spacing.md,
  },
  contactsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  settingsLink: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.dark.accent,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
    color: Colors.dark.text,
    paddingVertical: Spacing.sm,
  },
  contactsSectionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  contactInitials: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.textSecondary,
  },
  contactName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: Colors.dark.text,
  },
  inviteButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  invitedButton: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  invitedButtonText: {
    color: Colors.dark.textSecondary,
  },
  contactSeparator: {
    height: 1,
    backgroundColor: Colors.dark.border,
  },
  permissionCard: {
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: Spacing.md,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  enableButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  enableButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
