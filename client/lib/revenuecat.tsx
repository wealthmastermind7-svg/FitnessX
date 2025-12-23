import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import Purchases, { 
  LOG_LEVEL, 
  CustomerInfo, 
  PurchasesOffering,
  PurchasesPackage 
} from 'react-native-purchases';

const ENTITLEMENT_ID = 'FitForgeX Pro';
const DEV_MODE_PRO_BYPASS = false;

interface RevenueCatContextType {
  isProUser: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  isLoading: boolean;
  isInitialized: boolean;
  isWebPlatform: boolean;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  refreshCustomerInfo: () => Promise<void>;
  checkEntitlement: () => boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

interface RevenueCatProviderProps {
  children: ReactNode;
}

export function RevenueCatProvider({ children }: RevenueCatProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const listenerRemoverRef = useRef<(() => void) | null>(null);

  const isWebPlatform = Platform.OS === 'web';
  const isProUser = DEV_MODE_PRO_BYPASS || 
                    (isWebPlatform ? false : customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined);

  useEffect(() => {
    const initializeRevenueCat = async () => {
      try {
        if (isWebPlatform) {
          console.log('RevenueCat: Web platform detected - purchases not available');
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

        const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || 
                       process.env.REVENUECAT_API_KEY || 
                       '';

        if (!apiKey) {
          console.warn('RevenueCat API key not found. Please set EXPO_PUBLIC_REVENUECAT_API_KEY environment variable.');
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        console.log(`[RevenueCat] Configuring with API key from environment variable`);

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Purchases.configure({ apiKey });
        } else {
          console.log('RevenueCat: Unsupported platform');
          setIsLoading(false);
          setIsInitialized(true);
          return;
        }

        setIsInitialized(true);

        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);

        const offerings = await Purchases.getOfferings();
        if (offerings.current) {
          setCurrentOffering(offerings.current);
        }

        const removeListener = Purchases.addCustomerInfoUpdateListener((info) => {
          setCustomerInfo(info);
        });
        listenerRemoverRef.current = removeListener;

      } catch (error) {
        console.error('RevenueCat initialization error:', error);
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };

    initializeRevenueCat();

    return () => {
      if (listenerRemoverRef.current) {
        listenerRemoverRef.current();
        listenerRemoverRef.current = null;
      }
    };
  }, [isWebPlatform]);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (isWebPlatform) {
      Alert.alert(
        'Not Available',
        'Purchases are not available on web. Please use the iOS or Android app.'
      );
      return false;
    }

    try {
      setIsLoading(true);
      const { customerInfo: newInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(newInfo);
      
      if (newInfo.entitlements.active[ENTITLEMENT_ID]) {
        return true;
      }
      return false;
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
        Alert.alert(
          'Purchase Failed',
          error.message || 'There was an error processing your purchase. Please try again.'
        );
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isWebPlatform]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (isWebPlatform) {
      Alert.alert(
        'Not Available',
        'Restore purchases is not available on web. Please use the iOS or Android app.'
      );
      return false;
    }

    try {
      setIsLoading(true);
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      
      if (info.entitlements.active[ENTITLEMENT_ID]) {
        Alert.alert('Success', 'Your purchases have been restored!');
        return true;
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
        return false;
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert(
        'Restore Failed',
        error.message || 'There was an error restoring your purchases. Please try again.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isWebPlatform]);

  const refreshCustomerInfo = useCallback(async (): Promise<void> => {
    if (isWebPlatform) return;

    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (error) {
      console.error('Error refreshing customer info:', error);
    }
  }, [isWebPlatform]);

  const checkEntitlement = useCallback((): boolean => {
    if (DEV_MODE_PRO_BYPASS) return true;
    return customerInfo?.entitlements.active[ENTITLEMENT_ID] !== undefined;
  }, [customerInfo]);

  const value: RevenueCatContextType = {
    isProUser,
    customerInfo,
    currentOffering,
    isLoading,
    isInitialized,
    isWebPlatform,
    purchasePackage,
    restorePurchases,
    refreshCustomerInfo,
    checkEntitlement,
  };

  return (
    <RevenueCatContext.Provider value={value}>
      {children}
    </RevenueCatContext.Provider>
  );
}

export function useRevenueCat(): RevenueCatContextType {
  const context = useContext(RevenueCatContext);
  if (context === undefined) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
}

export function useIsProUser(): boolean {
  const { isProUser } = useRevenueCat();
  return isProUser;
}

export function useRequireSubscription(onBlocked?: () => void): {
  isProUser: boolean;
  isLoading: boolean;
  checkAccess: () => boolean;
} {
  const { isProUser, isLoading, checkEntitlement } = useRevenueCat();

  const checkAccess = useCallback(() => {
    const hasAccess = checkEntitlement();
    if (!hasAccess && onBlocked) {
      onBlocked();
    }
    return hasAccess;
  }, [checkEntitlement, onBlocked]);

  return { isProUser, isLoading, checkAccess };
}

export { ENTITLEMENT_ID };
