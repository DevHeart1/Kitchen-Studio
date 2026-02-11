import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, Alert } from "react-native";
import Purchases, {
    CustomerInfo,
    LOG_LEVEL,
    PurchasesPackage,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import createContextHook from "@nkzw/create-context-hook";

const API_KEYS = {
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || "appl_your_ios_key_here",
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || "goog_your_android_key_here",
};


const ENTITLEMENT_ID = "Kitchen Studio Pro"; // Update this if your entitlement ID is different

export interface FeatureRow {
    name: string;
    free: string | boolean;
    pro: string | boolean;
    highlight?: "unlimited" | "gold" | "check" | "realtime";
}

export interface PaywallContent {
    hero_title: string;
    hero_subtitle: string;
    trial_text: string;
    features: FeatureRow[];
}

const DEFAULT_PAYWALL_CONTENT: PaywallContent = {
    hero_title: "Level Up Your Kitchen",
    hero_subtitle: "Compare plans and unlock the full power of AI cooking.",
    trial_text: "7 Days Free Trial, cancel anytime.",
    features: [
        { name: "Video-to-Recipe", free: "2 / day", pro: "Unlimited", highlight: "unlimited" },
        { name: "Pantry Scan", free: "Basic", pro: "Full + Sub", highlight: "gold" },
        { name: "Discovery", free: true, pro: true, highlight: "check" },
        { name: "AR Cooking", free: "Overview", pro: "Guided Full", highlight: "gold" },
        { name: "Technique AI", free: "Preview", pro: "Real-time", highlight: "realtime" },
        { name: "Priority Access", free: false, pro: true, highlight: "check" },
    ]
};

interface SubscriptionContextType {
    isPro: boolean;
    isLoading: boolean;
    customerInfo: CustomerInfo | null;
    offerings: PurchasesPackage[];
    paywallContent: PaywallContent;
    buyPro: () => Promise<boolean>;
    buyPackage: (packageType: "MONTHLY" | "ANNUAL") => Promise<boolean>;
    restorePurchases: () => Promise<void>;
    presentPaywall: () => Promise<boolean>;
    presentCustomerCenter: () => Promise<void>;
}

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(
    () => {
        const [isPro, setIsPro] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
        const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
        const [paywallContent, setPaywallContent] = useState<PaywallContent>(DEFAULT_PAYWALL_CONTENT);

        useEffect(() => {
            initRevenueCat();
        }, []);

        const initRevenueCat = async () => {
            if (Platform.OS === "web") {
                setIsLoading(false);
                return;
            }

            Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

            try {
                if (Platform.OS === "ios") {
                    await Purchases.configure({ apiKey: API_KEYS.ios });
                } else if (Platform.OS === "android") {
                    await Purchases.configure({ apiKey: API_KEYS.android });
                }

                const info = await Purchases.getCustomerInfo();
                setCustomerInfo(info);
                checkEntitlements(info);

                try {
                    const offerings = await Purchases.getOfferings();
                    if (
                        offerings.current !== null &&
                        offerings.current.availablePackages.length !== 0
                    ) {
                        setOfferings(offerings.current.availablePackages);

                        // Extract metadata if available
                        if (offerings.current.metadata && offerings.current.metadata.paywall) {
                            try {
                                const metadata = offerings.current.metadata.paywall as any;
                                // Simple validation to ensure we have the minimum required fields
                                if (metadata.features && Array.isArray(metadata.features)) {
                                    setPaywallContent({
                                        hero_title: metadata.hero_title || DEFAULT_PAYWALL_CONTENT.hero_title,
                                        hero_subtitle: metadata.hero_subtitle || DEFAULT_PAYWALL_CONTENT.hero_subtitle,
                                        trial_text: metadata.trial_text || DEFAULT_PAYWALL_CONTENT.trial_text,
                                        features: metadata.features
                                    });
                                }
                            } catch (err) {
                                console.warn("Failed to parse paywall metadata, using default.", err);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error fetching offerings", e);
                }
            } catch (e) {
                console.error("Error configuring RevenueCat", e);
            } finally {
                setIsLoading(false);
            }
        };


        const checkEntitlements = (info: CustomerInfo) => {
            if (
                info.entitlements.active[ENTITLEMENT_ID] !== undefined
            ) {
                setIsPro(true);
            } else {
                setIsPro(false);
            }
        };

        useEffect(() => {
            const customerInfoUpdated = (info: CustomerInfo) => {
                setCustomerInfo(info);
                checkEntitlements(info);
            };

            Purchases.addCustomerInfoUpdateListener(customerInfoUpdated);

            return () => {
                Purchases.removeCustomerInfoUpdateListener(customerInfoUpdated);
            };
        }, []);

        const presentPaywall = async (): Promise<boolean> => {
            if (Platform.OS === "web") {
                Alert.alert("Not Available", "Subscriptions are only available on mobile devices.");
                return false;
            }

            try {
                const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall({
                    displayCloseButton: true,
                });

                switch (paywallResult) {
                    case PAYWALL_RESULT.NOT_PRESENTED:
                    case PAYWALL_RESULT.ERROR:
                    case PAYWALL_RESULT.CANCELLED:
                        return false;
                    case PAYWALL_RESULT.PURCHASED:
                    case PAYWALL_RESULT.RESTORED:
                        return true;
                    default:
                        return false;
                }
            } catch (e) {
                console.error("Error presenting paywall:", e);
                return false;
            }
        };

        const presentCustomerCenter = async () => {
            if (Platform.OS === "web") {
                Alert.alert("Not Available", "Customer Center is only available on mobile devices.");
                return;
            }

            try {
                await RevenueCatUI.presentCustomerCenter();
            } catch (e) {
                console.error("Error presenting customer center:", e);
            }
        };

        const buyPackage = async (packageType: "MONTHLY" | "ANNUAL"): Promise<boolean> => {
            if (Platform.OS === "web") {
                Alert.alert("Not Available", "Subscriptions are only available on mobile devices.");
                return false;
            }

            const pkg = offerings.find(p => p.packageType === packageType);
            if (!pkg) {
                Alert.alert("Error", "This plan is not available right now. Please try again later.");
                return false;
            }

            try {
                const { customerInfo: info } = await Purchases.purchasePackage(pkg);
                setCustomerInfo(info);
                checkEntitlements(info);
                return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
            } catch (e: any) {
                if (!e.userCancelled) {
                    throw e;
                }
                return false;
            }
        };

        const buyPro = async (): Promise<boolean> => {
            return presentPaywall();
        };

        const restorePurchases = async () => {
            try {
                const info = await Purchases.restorePurchases();
                setCustomerInfo(info);
                checkEntitlements(info);
                if (info.entitlements.active[ENTITLEMENT_ID]) {
                    Alert.alert("Success", "Your purchases have been restored.");
                } else {
                    Alert.alert("Notice", "No active subscriptions found to restore.");
                }
            } catch (e: any) {
                Alert.alert("Error", e.message);
            }
        };

        return {
            isPro,
            isLoading,
            customerInfo,
            offerings,
            paywallContent,
            buyPro,
            buyPackage,
            restorePurchases,
            presentPaywall,
            presentCustomerCenter,
        };
    }
);
