import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  X,
  Check,
  Sparkles,
  ChefHat,
  Camera,
  Utensils,
  Zap,
  Star,
  Crown,
} from "lucide-react-native";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const PREMIUM_FEATURES = [
  {
    icon: Camera,
    title: "Unlimited Video-to-Recipe",
    description: "Extract recipes from any cooking video without limits",
  },
  {
    icon: Utensils,
    title: "Full Pantry Scan & Substitution",
    description: "Complete ingredient scanning and smart substitutions",
  },
  {
    icon: ChefHat,
    title: "AR Guided Cooking Mode",
    description: "Step-by-step AR guidance for perfect dishes",
  },
  {
    icon: Zap,
    title: "Real-time Technique Feedback",
    description: "Get instant feedback on your cooking techniques",
  },
  {
    icon: Star,
    title: "Priority Access",
    description: "Early access to new features and live cooking sessions",
  },
];

type PlanType = "monthly" | "yearly";

export default function PaywallScreen() {
  const router = useRouter();
  const {
    currentOffering,
    isLoading,
    isPurchasing,
    isRestoring,
    purchasePackage,
    restorePurchases,
    getMonthlyPackage,
    getAnnualPackage,
    isPro,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isPro) {
      router.back();
    }
  }, [isPro]);

  const monthlyPackage = getMonthlyPackage();
  const annualPackage = getAnnualPackage();

  const handlePurchase = async () => {
    const packageToPurchase =
      selectedPlan === "monthly" ? monthlyPackage : annualPackage;

    if (!packageToPurchase) {
      Alert.alert("Error", "Selected plan is not available. Please try again.");
      return;
    }

    try {
      await purchasePackage(packageToPurchase);
      Alert.alert(
        "Welcome to Pro!",
        "You now have access to all premium features.",
        [{ text: "Let's Cook!", onPress: () => router.back() }]
      );
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(
          "Purchase Failed",
          error.message || "Something went wrong. Please try again."
        );
      }
    }
  };

  const handleRestore = async () => {
    try {
      await restorePurchases();
      Alert.alert("Success", "Your purchases have been restored!");
    } catch (error: any) {
      Alert.alert(
        "Restore Failed",
        error.message || "Could not restore purchases. Please try again."
      );
    }
  };

  const getMonthlyPrice = () => {
    if (monthlyPackage?.product?.priceString) {
      return monthlyPackage.product.priceString;
    }
    return "$9.99";
  };

  const getAnnualPrice = () => {
    if (annualPackage?.product?.priceString) {
      return annualPackage.product.priceString;
    }
    return "$79.00";
  };

  const getAnnualMonthlyPrice = () => {
    if (annualPackage?.product?.price) {
      const monthly = annualPackage.product.price / 12;
      return `$${monthly.toFixed(2)}`;
    }
    return "$6.58";
  };

  const getSavingsPercent = () => {
    if (monthlyPackage?.product?.price && annualPackage?.product?.price) {
      const monthlyTotal = monthlyPackage.product.price * 12;
      const savings = ((monthlyTotal - annualPackage.product.price) / monthlyTotal) * 100;
      return Math.round(savings);
    }
    return 34;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f0f23"]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color="#fff" />
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.headerSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.crownContainer}>
              <LinearGradient
                colors={["#FFD700", "#FFA500"]}
                style={styles.crownGradient}
              >
                <Crown size={32} color="#1a1a2e" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Kitchen Studio Pro</Text>
            <Text style={styles.subtitle}>
              Unlock your full culinary potential
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.featuresSection,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {PREMIUM_FEATURES.map((feature, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.featureRow,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-20, 0],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.featureIconContainer}>
                  <feature.icon size={20} color="#FF6B35" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <View style={styles.plansSection}>
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === "yearly" && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan("yearly")}
              activeOpacity={0.8}
            >
              {selectedPlan === "yearly" && (
                <View style={styles.bestValueBadge}>
                  <Sparkles size={12} color="#fff" />
                  <Text style={styles.bestValueText}>BEST VALUE</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === "yearly" && (
                    <View style={styles.planRadioInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Yearly</Text>
                  <Text style={styles.planSavings}>
                    Save {getSavingsPercent()}%
                  </Text>
                </View>
                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>{getAnnualPrice()}</Text>
                  <Text style={styles.planPeriod}>/year</Text>
                </View>
              </View>

              <View style={styles.planSubtext}>
                <Text style={styles.monthlyEquivalent}>
                  {getAnnualMonthlyPrice()}/month billed annually
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === "monthly" && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan("monthly")}
              activeOpacity={0.8}
            >
              <View style={styles.planHeader}>
                <View style={styles.planRadio}>
                  {selectedPlan === "monthly" && (
                    <View style={styles.planRadioInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>Monthly</Text>
                  <Text style={styles.planFlexible}>Flexible</Text>
                </View>
                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>{getMonthlyPrice()}</Text>
                  <Text style={styles.planPeriod}>/month</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={[
                styles.subscribeButton,
                (isPurchasing || isRestoring) && styles.subscribeButtonDisabled,
              ]}
              onPress={handlePurchase}
              disabled={isPurchasing || isRestoring}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FF6B35", "#F7931E"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.subscribeGradient}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.subscribeText}>
                      Start {selectedPlan === "yearly" ? "Annual" : "Monthly"} Plan
                    </Text>
                    <Sparkles size={18} color="#fff" style={styles.subscribeIcon} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreButton}
              onPress={handleRestore}
              disabled={isPurchasing || isRestoring}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#888" />
              ) : (
                <Text style={styles.restoreText}>Restore Purchases</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalText}>
              Payment will be charged to your {Platform.OS === "ios" ? "Apple ID" : "Google Play"} account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.
            </Text>
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={() => router.push("/privacy-policy")}>
                <Text style={styles.legalLink}>Privacy Policy</Text>
              </TouchableOpacity>
              <Text style={styles.legalDivider}>|</Text>
              <TouchableOpacity>
                <Text style={styles.legalLink}>Terms of Use</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  crownContainer: {
    marginBottom: 16,
  },
  crownGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 107, 53, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: "#888",
    lineHeight: 20,
  },
  plansSection: {
    marginBottom: 24,
    gap: 12,
  },
  planCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: "#FF6B35",
    backgroundColor: "rgba(255, 107, 53, 0.1)",
  },
  bestValueBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF6B35",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    gap: 4,
  },
  bestValueText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700" as const,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF6B35",
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#fff",
  },
  planSavings: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "500" as const,
  },
  planFlexible: {
    fontSize: 13,
    color: "#888",
  },
  planPricing: {
    alignItems: "flex-end",
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#fff",
  },
  planPeriod: {
    fontSize: 13,
    color: "#888",
  },
  planSubtext: {
    marginTop: 8,
    paddingLeft: 34,
  },
  monthlyEquivalent: {
    fontSize: 13,
    color: "#aaa",
  },
  ctaSection: {
    marginBottom: 24,
  },
  subscribeButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
  },
  subscribeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  subscribeIcon: {
    marginLeft: 8,
  },
  restoreButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  restoreText: {
    color: "#888",
    fontSize: 14,
  },
  legalSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  legalText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 12,
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  legalLink: {
    color: "#888",
    fontSize: 12,
  },
  legalDivider: {
    color: "#666",
    marginHorizontal: 8,
  },
});
