import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform, Alert } from "react-native";
// import Purchases, {
//     CustomerInfo,
//     LOG_LEVEL,
//     PurchasesPackage,
// } from "react-native-purchases";
// import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import createContextHook from "@nkzw/create-context-hook";

// MOCK TYPES FOR EXPO GO
type CustomerInfo = any;
type PurchasesPackage = any;
const LOG_LEVEL = { VERBOSE: 'VERBOSE' };
const PAYWALL_RESULT = {
    NOT_PRESENTED: 'NOT_PRESENTED',
    ERROR: 'ERROR',
    CANCELLED: 'CANCELLED',
    PURCHASED: 'PURCHASED',
    RESTORED: 'RESTORED'
};

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
        const [isPro, setIsPro] = useState(false); // Default to false, can toggle in mock
        const [isLoading, setIsLoading] = useState(false);
        const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
        const [offerings, setOfferings] = useState<PurchasesPackage[]>([]);
        const [paywallContent, setPaywallContent] = useState<PaywallContent>(DEFAULT_PAYWALL_CONTENT);

        useEffect(() => {
            initRevenueCat();
        }, []);

        const initRevenueCat = async () => {
            console.log("[SubscriptionContext] Running in MOCK Mode for Expo Go compatibility.");
            // Mock loading delay
            setTimeout(() => {
                setOfferings([
                    { packageType: "MONTHLY", product: { priceString: "$9.99" } },
                    { packageType: "ANNUAL", product: { priceString: "$79.99" } }
                ]);
                setIsLoading(false);
            }, 1000);
        };


        const checkEntitlements = (info: CustomerInfo) => {
            // Mock check
            if (info?.entitlements?.active?.[ENTITLEMENT_ID]) {
                setIsPro(true);
            }
        };

        useEffect(() => {
            // Mock Listener
            return () => { };
        }, []);

        const presentPaywall = async (): Promise<boolean> => {
            console.log("[Mock] Presenting Paywall");
            // Simulate a purchase after a small delay or just return true for testing
            // For now, we'll just log
            return new Promise((resolve) => {
                Alert.alert(
                    "Expo Go Mock Paywall",
                    "This is a mock paywall because native RevenueCat cannot run in Expo Go.\n\nSimulate purchase?",
                    [
                        { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
                        {
                            text: "Simulate Purchase", onPress: () => {
                                setIsPro(true);
                                resolve(true);
                            }
                        }
                    ]
                );
            });
        };

        const presentCustomerCenter = async () => {
            Alert.alert("Mock Customer Center", "Not available in mock mode.");
        };

        const buyPackage = async (packageType: "MONTHLY" | "ANNUAL"): Promise<boolean> => {
            console.log("[Mock] Buy Package:", packageType);
            setIsPro(true);
            return true;
        };

        const buyPro = async (): Promise<boolean> => {
            return presentPaywall();
        };

        const restorePurchases = async () => {
            console.log("[Mock] Restore Purchases");
            Alert.alert("Mock Restore", "Purchases 'restored' (nothing happened).");
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
