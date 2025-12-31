import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
  Image,
  Switch,
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
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useRevenueCat } from '@/lib/revenuecat';

const PRO_FEATURES = [
  {
    icon: 'cpu',
    title: 'AI Coach',
    description: 'Receive AI-generated fitness suggestions and workout insights',
  },
  {
    icon: 'zap',
    title: 'AI Workout Generation',
    description: 'Create custom workouts tailored to your goals and equipment',
  },
  {
    icon: 'save',
    title: 'Unlimited Workouts',
    description: 'Save up to 100 workouts instead of just 5 for free users',
  },
  {
    icon: 'activity',
    title: 'Full Exercise Library',
    description: 'Access all 1,300+ exercises instead of the first 10 only',
  },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { currentOffering, purchasePackage, restorePurchases, isLoading, isProUser } = useRevenueCat();
  const [selectedPackageId, setSelectedPackageId] = useState<string>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [enableFreeTrial, setEnableFreeTrial] = useState(false);

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

    const success = await purchasePackage(selectedPkg, enableFreeTrial);
    
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    }
    
    setIsPurchasing(false);
  }, [currentOffering, selectedPackageId, purchasePackage, navigation, handlePresentPaywall, enableFreeTrial]);

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
      <View style={styles.heroContainer}>
        <Image
          source={{
            uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPGZGFoknXDGa2EAVi3bEs8fD2g0efg_o8f_P6JdeQ_-bBYSBiZnuLpmMEdYFiqm-Nv7-C8xmf2Kegq6Q-bNusNejXqTgShQzUP6QxJ6gcOowbtlg3te_5cQqBKxs2XZHAvm_Hm9PyD8KX-ArzVDj29oPPxnEIJuEL7G9J2hAOa8YAteHY6LXUYInlszlY1VY-JCsO84_UHxuXNQIR3YybFNIGr9eSHVX1sK57DLyuIgOpTiDW2t4TbDQHVpKHdq-T-GaVsNAN31u2'
          }}
          style={styles.heroImage}
        />
        <LinearGradient
          colors={['transparent', Colors.dark.backgroundRoot]}
          style={styles.heroGradient}
        />
        <Pressable 
          onPress={handleClose} 
          style={[styles.closeButton, { top: insets.top + Spacing.lg }]}
        >
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <ThemedText style={styles.title}>
            Unlock Premium{'\n'}
            <ThemedText style={styles.titleHighlight}>Fitness Access</ThemedText>
          </ThemedText>
          <ThemedText style={styles.subtitle}>
            Get unlimited access to AI-powered features
          </ThemedText>
        </View>

        <View style={styles.featuresSection}>
          {PRO_FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Feather name={feature.icon as any} size={24} color={Colors.dark.text} />
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

        <View style={styles.trialToggleContainer}>
          <View style={styles.trialToggleLabelContainer}>
            <ThemedText style={styles.trialToggleLabel}>Enable free trial (7 days)</ThemedText>
            <ThemedText style={styles.trialToggleSubtitle}>You will not be charged until the trial ends</ThemedText>
          </View>
          <Switch
            value={enableFreeTrial}
            onValueChange={setEnableFreeTrial}
            trackColor={{ false: '#E2E8F0', true: Colors.dark.accent }}
            thumbColor="#FFF"
          />
        </View>

        <ThemedText style={styles.planTitle}>Choose Your Plan</ThemedText>

        <View style={styles.packagesSection}>
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
                  
                  <View style={styles.radioButtonContainer}>
                    <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                      {isSelected && <Feather name="check" size={14} color="#FFF" />}
                    </View>
                  </View>

                  <View style={styles.packageInfo}>
                    <ThemedText style={styles.packageTitle}>
                      {isYearly ? 'Yearly Access' : 'Monthly'}
                    </ThemedText>
                    <ThemedText style={styles.packageSubtitle}>
                      {isYearly ? '12 mo • $79.99' : 'Pay as you go'}
                    </ThemedText>
                  </View>

                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.packagePrice}>
                      {isYearly ? '$6.57' : '$9.99'}
                    </ThemedText>
                    <ThemedText style={styles.packagePeriod}>
                      /mo
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })
          ) : (
            <>
              <View style={[styles.packageCard, styles.packageCardSelected]}>
                <View style={styles.radioButtonContainer}>
                  <View style={[styles.radioButton, styles.radioButtonSelected]}>
                    <Feather name="check" size={14} color="#FFF" />
                  </View>
                </View>
                <View style={styles.packageInfo}>
                  <ThemedText style={styles.packageTitle}>Yearly Access</ThemedText>
                  <ThemedText style={styles.packageSubtitle}>12 mo • $79.99</ThemedText>
                </View>
                <View style={styles.priceContainer}>
                  <ThemedText style={styles.packagePrice}>$6.57</ThemedText>
                  <ThemedText style={styles.packagePeriod}>/mo</ThemedText>
                </View>
                <View style={styles.saveBadge}>
                  <ThemedText style={styles.saveBadgeText}>BEST VALUE</ThemedText>
                </View>
              </View>

              <View style={styles.packageCard}>
                <View style={styles.radioButtonContainer}>
                  <View style={styles.radioButton} />
                </View>
                <View style={styles.packageInfo}>
                  <ThemedText style={styles.packageTitle}>Monthly</ThemedText>
                  <ThemedText style={styles.packageSubtitle}>Pay as you go</ThemedText>
                </View>
                <View style={styles.priceContainer}>
                  <ThemedText style={styles.packagePrice}>$9.99</ThemedText>
                  <ThemedText style={styles.packagePeriod}>/mo</ThemedText>
                </View>
              </View>
            </>
          )}
        </View>

        <Pressable
          style={[styles.continueButton, (isLoading || isPurchasing) && styles.buttonDisabled]}
          onPress={handlePurchase}
          disabled={isLoading || isPurchasing}
        >
          {isPurchasing ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <ThemedText style={styles.continueButtonText}>Continue</ThemedText>
              <Feather name="arrow-right" size={20} color="#FFF" />
            </>
          )}
        </Pressable>

        <View style={styles.disclosureSection}>
          <ThemedText style={styles.disclosureText}>
            Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period. You can manage or cancel your subscription anytime in your Apple ID settings.
          </ThemedText>
        </View>

        <View style={styles.footerLinks}>
          <Pressable onPress={handleRestore} disabled={isLoading}>
            <ThemedText style={styles.footerLink}>Restore Purchases</ThemedText>
          </Pressable>
          <ThemedText style={styles.footerSeparator}>•</ThemedText>
          <Pressable onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/terms')}>
            <ThemedText style={styles.footerLink}>Terms</ThemedText>
          </Pressable>
          <ThemedText style={styles.footerSeparator}>•</ThemedText>
          <Pressable onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/privacy-policy')}>
            <ThemedText style={styles.footerLink}>Privacy</ThemedText>
          </Pressable>
          <ThemedText style={styles.footerSeparator}>•</ThemedText>
          <Pressable onPress={() => WebBrowser.openBrowserAsync('https://luxeweb.cerolauto.store/FitForgeX/sources')}>
            <ThemedText style={styles.footerLink}>Sources</ThemedText>
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
  heroContainer: {
    height: 200,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    lineHeight: 40,
  },
  titleHighlight: {
    color: Colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.dark.textSecondary,
  },
  featuresSection: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  trialToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#334155',
  },
  trialToggleLabelContainer: {
    flex: 1,
  },
  trialToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  trialToggleSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: Colors.dark.textSecondary,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  packagesSection: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: Colors.dark.accent,
    backgroundColor: '#0F172A',
  },
  radioButtonContainer: {
    marginRight: Spacing.md,
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
    backgroundColor: Colors.dark.accent,
  },
  packageInfo: {
    flex: 1,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  packageSubtitle: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.dark.text,
  },
  packagePeriod: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
  },
  saveBadge: {
    position: 'absolute',
    top: -12,
    right: Spacing.md,
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.accent,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  disclosureSection: {
    marginBottom: Spacing.lg,
  },
  disclosureText: {
    fontSize: 11,
    fontWeight: '400',
    color: Colors.dark.textSecondary,
    lineHeight: 16,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },
  footerSeparator: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
