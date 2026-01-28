import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/Card';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { useRevenueCat } from '@/lib/revenuecat';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProGateProps {
  children: React.ReactNode;
  feature?: string;
  showUpgradePrompt?: boolean;
}

export function ProGate({ children, feature = 'this feature', showUpgradePrompt = true }: ProGateProps) {
  const { isProUser, isLoading } = useRevenueCat();
  const navigation = useNavigation<NavigationProp>();

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Paywall');
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.dark.accent} size="large" />
      </View>
    );
  }

  if (isProUser) {
    return <>{children}</>;
  }

  if (!showUpgradePrompt) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      <Card style={styles.upgradeCard}>
        <LinearGradient
          colors={[Colors.dark.accent, '#9D4EDD'] as any}
          style={styles.iconContainer}
        >
          <Feather name="lock" size={32} color="#FFF" />
        </LinearGradient>
        
        <ThemedText style={styles.title}>Pro Feature</ThemedText>
        <ThemedText style={styles.description}>
          Upgrade to FitForgeX Pro to unlock {feature} and all other AI-powered features.
        </ThemedText>

        <Pressable 
          style={styles.upgradeButton} 
          onPress={handleUpgrade}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF4B4B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.upgradeButtonGradient}
          >
            <Feather name="zap" size={18} color="#FFF" />
            <ThemedText style={styles.upgradeButtonText}>Upgrade to Pro</ThemedText>
          </LinearGradient>
        </Pressable>
      </Card>
    </View>
  );
}

interface ProBadgeProps {
  style?: any;
}

export function ProBadge({ style }: ProBadgeProps) {
  return (
    <View style={[styles.badge, style]}>
      <Feather name="zap" size={10} color="#FFF" />
      <ThemedText style={styles.badgeText}>PRO</ThemedText>
    </View>
  );
}

interface UpgradeButtonProps {
  compact?: boolean;
  style?: any;
}

export function UpgradeButton({ compact = false, style }: UpgradeButtonProps) {
  const { isProUser, isLoading } = useRevenueCat();
  const navigation = useNavigation<NavigationProp>();

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isProUser) {
      navigation.navigate('CustomerCenter');
    } else {
      navigation.navigate('Paywall');
    }
  }, [isProUser, navigation]);

  if (isLoading) {
    return null;
  }

  if (compact) {
    return (
      <Pressable style={[styles.compactButton, style]} onPress={handlePress}>
        <Feather name="zap" size={16} color={Colors.dark.accent} />
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.upgradeButtonSmall, style]} onPress={handlePress}>
      <LinearGradient
        colors={[Colors.dark.accent, '#9D4EDD'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buttonGradient}
      >
        <Feather name="zap" size={14} color="#FFF" />
        <ThemedText style={styles.buttonText}>
          {isProUser ? 'Pro' : 'Upgrade'}
        </ThemedText>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    maxWidth: 340,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as any,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  upgradeButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '500' as any,
    color: '#FFF',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700' as any,
    color: '#FFF',
  },
  compactButton: {
    padding: Spacing.sm,
  },
  upgradeButtonSmall: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500' as any,
    color: '#FFF',
  },
});
