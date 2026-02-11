import { useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";
import createContextHook from "@nkzw/create-context-hook";
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from "react-native-purchases";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";

const ENTITLEMENT_ID = "Kitchen Studio Pro";

function getRCToken(): string {
  if (__DEV__ || Platform.OS === "web") {
    return process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || "";
  }
  return Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || "",
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || "",
    default: process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY || "",
  }) as string;
}

const apiKey = getRCToken();

if (apiKey) {
  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  console.log("[RevenueCat] Configured with API key");
} else {
  console.warn("[RevenueCat] No API key found - subscriptions will not work");
}

export interface SubscriptionState {
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  currentOffering: PurchasesOffering | null;
  error: string | null;
}

export const [SubscriptionProvider, useSubscription] = createContextHook(() => {
  const { user, isDemoMode } = useAuth();
  const queryClient = useQueryClient();
  const [isConfigured, setIsConfigured] = useState(!!apiKey);

  useEffect(() => {
    const identifyUser = async () => {
      if (!apiKey) return;
      
      try {
        if (user?.id) {
          await Purchases.logIn(user.id);
          console.log("[RevenueCat] Logged in user:", user.id);
        } else if (isDemoMode) {
          await Purchases.logIn("demo-user");
          console.log("[RevenueCat] Logged in demo user");
        }
        queryClient.invalidateQueries({ queryKey: ["customerInfo"] });
      } catch (error) {
        console.error("[RevenueCat] Login error:", error);
      }
    };

    identifyUser();
  }, [user?.id, isDemoMode]);

  const customerInfoQuery = useQuery({
    queryKey: ["customerInfo"],
    queryFn: async () => {
      if (!apiKey) return null;
      try {
        const info = await Purchases.getCustomerInfo();
        console.log("[RevenueCat] Customer info fetched:", info.entitlements.active);
        return info;
      } catch (error) {
        console.error("[RevenueCat] Error fetching customer info:", error);
        throw error;
      }
    },
    enabled: isConfigured,
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const offeringsQuery = useQuery({
    queryKey: ["offerings"],
    queryFn: async () => {
      if (!apiKey) return null;
      try {
        const offerings = await Purchases.getOfferings();
        console.log("[RevenueCat] Offerings fetched:", offerings.current?.identifier);
        return offerings.current;
      } catch (error) {
        console.error("[RevenueCat] Error fetching offerings:", error);
        throw error;
      }
    },
    enabled: isConfigured,
    staleTime: 1000 * 60 * 30,
    retry: 2,
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageToPurchase: PurchasesPackage) => {
      console.log("[RevenueCat] Purchasing package:", packageToPurchase.identifier);
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log("[RevenueCat] Purchase successful");
      queryClient.setQueryData(["customerInfo"], customerInfo);
    },
    onError: (error: any) => {
      if (error.userCancelled) {
        console.log("[RevenueCat] User cancelled purchase");
      } else {
        console.error("[RevenueCat] Purchase error:", error);
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      console.log("[RevenueCat] Restoring purchases...");
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    },
    onSuccess: (customerInfo) => {
      console.log("[RevenueCat] Restore successful");
      queryClient.setQueryData(["customerInfo"], customerInfo);
    },
    onError: (error) => {
      console.error("[RevenueCat] Restore error:", error);
    },
  });

  const isPro = useCallback((): boolean => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return false;
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
  }, [customerInfoQuery.data]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage) => {
      return purchaseMutation.mutateAsync(pkg);
    },
    [purchaseMutation]
  );

  const restorePurchases = useCallback(async () => {
    return restoreMutation.mutateAsync();
  }, [restoreMutation]);

  const getMonthlyPackage = useCallback((): PurchasesPackage | null => {
    if (!offeringsQuery.data?.availablePackages) return null;
    return (
      offeringsQuery.data.availablePackages.find(
        (pkg) => pkg.packageType === "MONTHLY" || pkg.identifier === "$rc_monthly"
      ) || null
    );
  }, [offeringsQuery.data]);

  const getAnnualPackage = useCallback((): PurchasesPackage | null => {
    if (!offeringsQuery.data?.availablePackages) return null;
    return (
      offeringsQuery.data.availablePackages.find(
        (pkg) => pkg.packageType === "ANNUAL" || pkg.identifier === "$rc_annual"
      ) || null
    );
  }, [offeringsQuery.data]);

  const getActiveSubscription = useCallback(() => {
    const customerInfo = customerInfoQuery.data;
    if (!customerInfo) return null;
    
    const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    if (!entitlement) return null;

    return {
      productIdentifier: entitlement.productIdentifier,
      expirationDate: entitlement.expirationDate,
      willRenew: entitlement.willRenew,
      isActive: entitlement.isActive,
    };
  }, [customerInfoQuery.data]);

  const refreshCustomerInfo = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["customerInfo"] });
  }, [queryClient]);

  return {
    isPro: isPro(),
    isLoading: customerInfoQuery.isLoading || offeringsQuery.isLoading,
    isPurchasing: purchaseMutation.isPending,
    isRestoring: restoreMutation.isPending,
    customerInfo: customerInfoQuery.data || null,
    currentOffering: offeringsQuery.data || null,
    error: customerInfoQuery.error?.message || offeringsQuery.error?.message || null,
    purchasePackage,
    restorePurchases,
    getMonthlyPackage,
    getAnnualPackage,
    getActiveSubscription,
    refreshCustomerInfo,
    isConfigured,
  };
});
