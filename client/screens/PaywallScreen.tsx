import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { useNavigation } from '@react-navigation/native';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Card } from '@/components/Card';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useRevenueCat } from '@/lib/revenuecat';

const PRO_FEATURES = [
  {
    icon: 'cpu',
    title: 'AI Coach',
    description: 'Get personalized workout advice and fitness guidance from your AI coach',
  },
  {
    icon: 'zap',
    title: 'AI Workout Generation',
    description: 'Generate custom workouts tailored to your goals and equipment',
  },
  {
    icon: 'activity',
    title: 'Recovery Advisor',
    description: 'AI-powered recovery recommendations based on your training',
  },
  {
    icon: 'message-circle',
    title: 'Workout Feedback',
    description: 'Get detailed AI analysis of your workout performance',
  },
  {
    icon: 'save',
    title: 'Unlimited Workouts',
    description: 'Save up to 100 workouts instead of just 5 for free users',
  },
  {
    icon: 'activity',
    title: 'Full Exercise Library',
    description: 'Browse all 1,300+ exercises instead of the first 10 only',
  },
  {
    icon: 'star',
    title: 'Unlimited Access',
    description: 'No limits on all features - use them as much as you want',
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { currentOffering, purchasePackage, restorePurchases, isLoading, isProUser } = useRevenueCat();
  const [selectedPackageId, setSelectedPackageId] = useState<string>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePresentPaywall = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsPurchasing(true);

      const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

      switch (paywallResult) {
        case PAYWALL_RESULT.PURCHASED:
        case PAYWALL_RESULT.RESTORED:
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          navigation.goBack();
          break;
        case PAYWALL_RESULT.NOT_PRESENTED:
        case PAYWALL_RESULT.ERROR:
          console.log('Paywall not presented or error, using fallback UI');
          break;
        case PAYWALL_RESULT.CANCELLED:
          break;
      }
    } catch (error) {
      console.log('RevenueCat UI paywall not available, using fallback');
    } finally {
      setIsPurchasing(false);
    }
  }, [navigation]);

  const handlePurchase = useCallback(async () => {
    if (!currentOffering) {
      handlePresentPaywall();
      return;
    }

    const selectedPkg = currentOffering.availablePackages.find(
      pkg => pkg.identifier === selectedPackageId || 
             pkg.packageType.toLowerCase() === selectedPackageId.toLowerCase()
    );

    if (!selectedPkg) {
      handlePresentPaywall();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPurchasing(true);

    const success = await purchasePackage(selectedPkg);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    }
    
    setIsPurchasing(false);
  }, [currentOffering, selectedPackageId, purchasePackage, navigation, handlePresentPaywall]);

  const handleRestore = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await restorePurchases();
    if (success) {
      navigation.goBack();
    }
  }, [restorePurchases, navigation]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  if (isProUser) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + Spacing.lg }]}>
          <View style={styles.successContainer}>
            <LinearGradient
              colors={['#10B981', '#059669'] as any}
              style={styles.successIcon}
            >
              <Feather name="check" size={48} color="#FFF" />
            </LinearGradient>
            <ThemedText style={styles.successTitle}>You're a Pro!</ThemedText>
            <ThemedText style={styles.successDescription}>
              You have full access to all FitForgeX Pro features.
            </ThemedText>
            <Pressable style={styles.doneButton} onPress={handleClose}>
              <ThemedText style={styles.doneButtonText}>Done</ThemedText>
            </Pressable>
          </View>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Feather name="chevron-left" size={28} color={Colors.dark.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>FitForgeX Pro</ThemedText>
        <Pressable onPress={handleRestore} disabled={isLoading} style={styles.restoreButton}>
          <ThemedText style={styles.restoreText}>Restore</ThemedText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[Colors.dark.accent, '#9D4EDD'] as any}
            style={styles.proIcon}
          >
            <Feather name="zap" size={32} color="#FFF" />
          </LinearGradient>
          <ThemedText style={styles.title}>Unlock FitForgeX Pro</ThemedText>
          <ThemedText style={styles.subtitle}>
            Get unlimited access to AI-powered features
          </ThemedText>
        </View>

        <View style={styles.featuresSection}>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name={feature.icon as any} size={20} color={Colors.dark.accent} />
              </View>
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                <ThemedText style={styles.featureDescription}>
                  {feature.description}
                </ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.packagesSection}>
          <ThemedText style={styles.sectionTitle}>Choose Your Plan</ThemedText>

          {currentOffering ? (
            currentOffering.availablePackages.map((pkg) => {
              const isSelected = 
                pkg.identifier === selectedPackageId ||
                pkg.packageType.toLowerCase() === selectedPackageId.toLowerCase();
              const isYearly = pkg.packageType.toLowerCase().includes('annual') ||
                              pkg.identifier.toLowerCase().includes('yearly') ||
                              pkg.identifier.toLowerCase().includes('annual');

              return (
                <Pressable
                  key={pkg.identifier}
                  style={[styles.packageCard, isSelected && styles.packageCardSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedPackageId(pkg.identifier);
                  }}
                >
                  {isYearly && (
                    <View style={styles.saveBadge}>
                      <ThemedText style={styles.saveBadgeText}>BEST VALUE</ThemedText>
                    </View>
                  )}
                  <View style={styles.packageInfo}>
                    <ThemedText style={styles.packageTitle}>
                      {isYearly ? 'Yearly' : 'Monthly'}
                    </ThemedText>
                    <ThemedText style={styles.packagePrice}>
                      {pkg.product.priceString}
                      <ThemedText style={styles.packagePeriod}>
                        /{isYearly ? 'year' : 'month'}
                      </ThemedText>
                    </ThemedText>
                  </View>
                  <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </Pressable>
              );
            })
          ) : (
            <View style={styles.loadingPackages}>
              <Card style={styles.packageCardPlaceholder}>
                <View style={styles.packageInfo}>
                  <ThemedText style={styles.packageTitle}>Yearly</ThemedText>
                  <ThemedText style={styles.packagePrice}>$49.99/year</ThemedText>
                </View>
              </Card>
              <Card style={styles.packageCardPlaceholder}>
                <View style={styles.packageInfo}>
                  <ThemedText style={styles.packageTitle}>Monthly</ThemedText>
                  <ThemedText style={styles.packagePrice}>$9.99/month</ThemedText>
                </View>
              </Card>
            </View>
          )}
        </View>

        <Pressable
          style={[styles.subscribeButton, (isLoading || isPurchasing) && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={isLoading || isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <ThemedText style={styles.subscribeButtonText}>
                Continue
              </ThemedText>
              <Feather name="arrow-right" size={20} color="#FFF" />
            </>
          )}
        </Pressable>

        {Platform.OS === 'web' ? (
          <ThemedText style={styles.legalText}>
            Purchases are not available on web. Please use the FitForge app on iOS or Android to subscribe.
          </ThemedText>
        ) : (
          <ThemedText style={styles.legalText}>
            {Platform.OS === 'ios'
              ? 'Payment will be charged to your Apple ID account. Subscription automatically renews unless cancelled at least 24 hours before the current period ends.'
              : 'Payment will be charged to your Google Play account. Subscription automatically renews unless cancelled at least 24 hours before the current period ends.'}
          </ThemedText>
        )}

        <View style={styles.legalLinks}>
          <Pressable onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/privacy-policy')}>
            <ThemedText style={styles.legalLink}>Privacy Policy</ThemedText>
          </Pressable>
          <ThemedText style={styles.legalSeparator}>|</ThemedText>
          <Pressable onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/terms')}>
            <ThemedText style={styles.legalLink}>Terms of Service</ThemedText>
          </Pressable>
        </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    padding: Spacing.sm,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as any,
    color: Colors.dark.text,
    flex: 1,
    textAlign: 'center',
  },
  restoreButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  restoreText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '500' as any,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  proIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '600' as any,
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 42,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.dark.accent}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  packagesSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500' as any,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  packageCardSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: `${Colors.dark.accent}10`,
  },
  packageCardPlaceholder: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.lg,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: '700' as any,
    color: '#FFF',
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700' as any,
    color: Colors.dark.text,
  },
  packagePeriod: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
    fontWeight: '400' as any,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.dark.accent,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.accent,
  },
  loadingPackages: {
    opacity: 0.7,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: '#FFF',
  },
  legalText: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  legalLink: {
    fontSize: 12,
    color: Colors.dark.accent,
  },
  legalSeparator: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  successContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: '700' as any,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  successDescription: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  doneButton: {
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.xl * 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: '#FFF',
  },
});
