import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import RevenueCatUI from 'react-native-purchases-ui';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useRevenueCat } from '@/lib/revenuecat';

export default function CustomerCenterScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { customerInfo, isProUser, restorePurchases, isLoading } = useRevenueCat();
  const [isPresenting, setIsPresenting] = useState(false);

  const handlePresentCustomerCenter = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsPresenting(true);
      await RevenueCatUI.presentCustomerCenter();
    } catch (error) {
      console.log('Customer Center not available:', error);
    } finally {
      setIsPresenting(false);
    }
  }, []);

  const handleManageSubscription = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (Platform.OS === 'ios') {
      await Linking.openURL('https://apps.apple.com/account/subscriptions');
    } else if (Platform.OS === 'android') {
      await Linking.openURL('https://play.google.com/store/account/subscriptions');
    }
  }, []);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await restorePurchases();
  }, [restorePurchases]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const activeEntitlement = customerInfo?.entitlements.active['FitForgeX Pro'];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Subscription</ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.statusCard}>
          <LinearGradient
            colors={isProUser ? ['#10B981', '#059669'] : [Colors.dark.accent, '#9D4EDD'] as any}
            style={styles.statusIcon}
          >
            <Feather 
              name={isProUser ? 'check-circle' : 'lock'} 
              size={32} 
              color="#FFF" 
            />
          </LinearGradient>
          <ThemedText style={styles.statusTitle}>
            {isProUser ? 'FitForgeX Pro' : 'Free Plan'}
          </ThemedText>
          <ThemedText style={styles.statusDescription}>
            {isProUser
              ? 'You have full access to all Pro features'
              : 'Upgrade to unlock AI-powered features'}
          </ThemedText>

          {!isProUser && (
            <Pressable
              style={styles.upgradeButton}
              onPress={() => (navigation as any).navigate('Paywall')}
            >
              <ThemedText style={styles.upgradeButtonText}>Upgrade to Pro</ThemedText>
              <Feather name="arrow-right" size={18} color="#FFF" />
            </Pressable>
          )}
        </Card>

        {isProUser && activeEntitlement && (
          <Card style={styles.detailsCard}>
            <ThemedText style={styles.sectionTitle}>Subscription Details</ThemedText>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Status</ThemedText>
              <View style={styles.activeBadge}>
                <ThemedText style={styles.activeBadgeText}>Active</ThemedText>
              </View>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Product</ThemedText>
              <ThemedText style={styles.detailValue}>
                {activeEntitlement.productIdentifier || 'FitForgeX Pro'}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Renews</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(activeEntitlement.expirationDate)}
              </ThemedText>
            </View>

            {activeEntitlement.willRenew !== undefined && (
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Auto-Renew</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {activeEntitlement.willRenew ? 'On' : 'Off'}
                </ThemedText>
              </View>
            )}
          </Card>
        )}

        <Card style={styles.actionsCard}>
          <ThemedText style={styles.sectionTitle}>Manage</ThemedText>

          {Platform.OS !== 'web' && (
            <Pressable
              style={styles.actionButton}
              onPress={handlePresentCustomerCenter}
              disabled={isPresenting}
            >
              <View style={styles.actionIcon}>
                <Feather name="settings" size={20} color={Colors.dark.accent} />
              </View>
              <View style={styles.actionContent}>
                <ThemedText style={styles.actionTitle}>Customer Center</ThemedText>
                <ThemedText style={styles.actionDescription}>
                  Manage your subscription, request refunds
                </ThemedText>
              </View>
              {isPresenting ? (
                <ActivityIndicator color={Colors.dark.textSecondary} />
              ) : (
                <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
              )}
            </Pressable>
          )}

          <Pressable 
            style={styles.actionButton} 
            onPress={handleManageSubscription}
            disabled={Platform.OS === 'web'}
          >
            <View style={styles.actionIcon}>
              <Feather name="credit-card" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>Manage in {Platform.OS === 'ios' ? 'App Store' : 'Play Store'}</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Cancel or change your subscription
              </ThemedText>
            </View>
            <Feather name="external-link" size={18} color={Colors.dark.textSecondary} />
          </Pressable>

          <Pressable 
            style={styles.actionButton} 
            onPress={handleRestore}
            disabled={isLoading}
          >
            <View style={styles.actionIcon}>
              <Feather name="refresh-cw" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>Restore Purchases</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Restore your previous purchases
              </ThemedText>
            </View>
            {isLoading ? (
              <ActivityIndicator color={Colors.dark.textSecondary} />
            ) : (
              <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
            )}
          </Pressable>
        </Card>

        <Card style={styles.helpCard}>
          <ThemedText style={styles.sectionTitle}>Help</ThemedText>

          <Pressable 
            style={styles.actionButton}
            onPress={() => Linking.openURL('mailto:support@fitforgex.com')}
          >
            <View style={styles.actionIcon}>
              <Feather name="mail" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.actionContent}>
              <ThemedText style={styles.actionTitle}>Contact Support</ThemedText>
              <ThemedText style={styles.actionDescription}>
                Get help with billing or account issues
              </ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
          </Pressable>
        </Card>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500' as any,
    color: Colors.dark.text,
  },
  headerRight: {
    width: 40,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  statusCard: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  statusIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  statusDescription: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: '#FFF',
  },
  detailsCard: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: Colors.dark.text,
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  detailLabel: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  activeBadge: {
    backgroundColor: '#10B98120',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 14,
    fontWeight: '500' as any,
    color: '#10B981',
  },
  actionsCard: {
    padding: Spacing.lg,
  },
  helpCard: {
    padding: Spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.dark.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
});
