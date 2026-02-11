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
  Star,
  ArrowRight,
  Brain,
  CheckCircle,
  XCircle,
} from "lucide-react-native";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

const { width } = Dimensions.get("window");

type PlanType = "monthly" | "yearly";

interface FeatureRow {
  name: string;
  free: string | boolean;
  pro: string | boolean;
  proHighlight?: "unlimited" | "gold" | "check" | "realtime";
}

const FEATURES: FeatureRow[] = [
  { name: "Video-to-Recipe", free: "2 / day", pro: "Unlimited", proHighlight: "unlimited" },
  { name: "Pantry Scan", free: "Basic", pro: "Full + Sub", proHighlight: "gold" },
  { name: "Discovery", free: true, pro: true, proHighlight: "check" },
  { name: "AR Cooking", free: "Overview", pro: "Guided Full", proHighlight: "gold" },
  { name: "Technique AI", free: "Preview", pro: "Real-time", proHighlight: "realtime" },
  { name: "Priority Access", free: false, pro: true, proHighlight: "check" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const {
    isLoading,
    isPro,
    offerings,
    buyPackage,
    restorePurchases,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const selectorAnim = useRef(new Animated.Value(1)).current;

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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.spring(selectorAnim, {
      toValue: selectedPlan === "yearly" ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  }, [selectedPlan]);

  useEffect(() => {
    if (isPro) {
      router.back();
    }
  }, [isPro]);

  const getMonthlyPrice = () => {
    const monthly = offerings.find(p => p.packageType === "MONTHLY");
    return monthly?.product?.priceString || "$9.99";
  };

  const getAnnualPrice = () => {
    const annual = offerings.find(p => p.packageType === "ANNUAL");
    return annual?.product?.priceString || "$79";
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const packageType = selectedPlan === "yearly" ? "ANNUAL" : "MONTHLY";
      const success = await buyPackage(packageType as "MONTHLY" | "ANNUAL");
      if (success) {
        Alert.alert(
          "Welcome to Pro!",
          "You now have access to all premium features.",
          [{ text: "Let's Cook!", onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        Alert.alert(
          "Purchase Failed",
          error.message || "Something went wrong. Please try again."
        );
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
    } catch (error: any) {
      Alert.alert(
        "Restore Failed",
        error.message || "Could not restore purchases. Please try again."
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const renderFeatureValue = (value: string | boolean, isPro: boolean, highlight?: string) => {
    if (typeof value === "boolean") {
      if (value) {
        if (isPro) {
          return (
            <View style={styles.checkContainer}>
              <CheckCircle size={16} color={Colors.primary} />
            </View>
          );
        }
        return (
          <View style={styles.checkContainer}>
            <Check size={14} color="rgba(255,255,255,0.5)" />
          </View>
        );
      }
      return (
        <View style={styles.checkContainer}>
          <XCircle size={14} color="rgba(255,255,255,0.15)" />
        </View>
      );
    }

    if (isPro) {
      if (highlight === "unlimited") {
        return (
          <View style={styles.unlimitedBadge}>
            <Text style={styles.unlimitedText}>{value}</Text>
          </View>
        );
      }
      if (highlight === "gold") {
        return (
          <View style={styles.goldBadge}>
            <Star size={10} color="#FFD700" fill="#FFD700" />
            <Text style={styles.goldText}>{value}</Text>
          </View>
        );
      }
      if (highlight === "realtime") {
        return (
          <View style={styles.realtimeContainer}>
            <Brain size={14} color={Colors.primary} />
            <Text style={styles.realtimeText}>{value}</Text>
          </View>
        );
      }
    }

    return (
      <Text style={[styles.featureValueText, isPro && styles.featureValueTextPro]}>
        {value}
      </Text>
    );
  };

  const selectorLeft = selectorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["2%", "50%"],
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading plans...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0A140D", "#102215", "#0A140D"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.ambientGlow} />
      <View style={styles.topGlow} />
      <View style={styles.bottomGradient} />

      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Sparkles size={16} color={Colors.primary} />
            <Text style={styles.headerLabel}>PREMIUM TIER</Text>
          </View>

          <TouchableOpacity
            style={styles.restoreHeaderButton}
            onPress={handleRestore}
            disabled={isRestoring}
          >
            {isRestoring ? (
              <ActivityIndicator size="small" color="rgba(255,255,255,0.4)" />
            ) : (
              <Text style={styles.restoreHeaderText}>Restore</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.heroSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.heroTitle}>Level Up Your Kitchen</Text>
            <Text style={styles.heroSubtitle}>
              Compare plans and unlock the full power of AI cooking.
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.comparisonSection,
              { opacity: fadeAnim },
            ]}
          >
            <View style={styles.comparisonHeader}>
              <Text style={styles.featuresLabel}>FEATURES</Text>
              <Text style={styles.freeLabel}>Free</Text>
              <View style={styles.proLabelContainer}>
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMMENDED</Text>
                </View>
                <Text style={styles.proLabel}>PRO</Text>
              </View>
            </View>

            <View style={styles.featuresTable}>
              {FEATURES.map((feature, index) => (
                <View
                  key={index}
                  style={[
                    styles.featureRow,
                    index < FEATURES.length - 1 && styles.featureRowBorder,
                  ]}
                >
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <View style={styles.featureValueCell}>
                    {renderFeatureValue(feature.free, false)}
                  </View>
                  <View style={styles.featureValueCell}>
                    {renderFeatureValue(feature.pro, true, feature.proHighlight)}
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>

          <View style={styles.planSelector}>
            <Animated.View
              style={[
                styles.selectorIndicator,
                { left: selectorLeft },
              ]}
            />
            <TouchableOpacity
              style={styles.planOption}
              onPress={() => setSelectedPlan("monthly")}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.planLabel,
                selectedPlan === "monthly" && styles.planLabelActive,
              ]}>
                Monthly
              </Text>
              <Text style={[
                styles.planPrice,
                selectedPlan === "monthly" && styles.planPriceActive,
              ]}>
                {getMonthlyPrice()}
                <Text style={styles.planPeriod}>/mo</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.planOption}
              onPress={() => setSelectedPlan("yearly")}
              activeOpacity={0.8}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>SAVE 35%</Text>
              </View>
              <Text style={[
                styles.planLabel,
                selectedPlan === "yearly" && styles.planLabelActive,
              ]}>
                Yearly
              </Text>
              <Text style={[
                styles.planPrice,
                selectedPlan === "yearly" && styles.planPricePro,
              ]}>
                {getAnnualPrice()}
                <Text style={styles.planPeriod}>/yr</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.ctaSection}>
            <Text style={styles.trialText}>
              <Text style={styles.trialHighlight}>7 Days Free Trial</Text>
              , cancel anytime.
            </Text>

            <Animated.View style={{ transform: [{ scale: pulseAnim }], width: "100%" }}>
              <TouchableOpacity
                style={[
                  styles.ctaButton,
                  (isPurchasing || isRestoring) && styles.ctaButtonDisabled,
                ]}
                onPress={handlePurchase}
                disabled={isPurchasing || isRestoring}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[Colors.primary, "#22c55e"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGradient}
                >
                  {isPurchasing ? (
                    <ActivityIndicator color={Colors.backgroundDark} />
                  ) : (
                    <>
                      <Text style={styles.ctaText}>Unlock Pro Access</Text>
                      <ArrowRight size={20} color={Colors.backgroundDark} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.legalText}>
              Subscription auto-renews. Terms apply.{" "}
              <Text
                style={styles.legalLink}
                onPress={() => router.push("/privacy-policy")}
              >
                Privacy
              </Text>
              {" & "}
              <Text style={styles.legalLink}>Terms</Text>
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A140D",
  },
  ambientGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 400,
    backgroundColor: "rgba(43, 238, 91, 0.04)",
    opacity: 0.8,
  },
  topGlow: {
    position: "absolute",
    top: -150,
    left: "50%",
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    opacity: 0.5,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: "transparent",
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0A140D",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 2,
  },
  restoreHeaderButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  restoreHeaderText: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "rgba(255,255,255,0.4)",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: "rgba(16, 34, 21, 0.9)",
    borderRadius: 12,
    marginBottom: 4,
  },
  featuresLabel: {
    flex: 1.2,
    fontSize: 10,
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
  },
  freeLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700" as const,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },
  proLabelContainer: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  recommendedBadge: {
    position: "absolute",
    top: -28,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  recommendedText: {
    fontSize: 8,
    fontWeight: "800" as const,
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  proLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.primary,
    textShadowColor: "rgba(43, 238, 91, 0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  featuresTable: {
    backgroundColor: "rgba(16, 34, 21, 0.6)",
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  featureName: {
    flex: 1.2,
    fontSize: 12,
    fontWeight: "500" as const,
    color: "rgba(255,255,255,0.7)",
  },
  featureValueCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  featureValueText: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: "rgba(255,255,255,0.4)",
  },
  featureValueTextPro: {
    color: "#fff",
  },
  checkContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  unlimitedBadge: {
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.25)",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  unlimitedText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  goldBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.25)",
    gap: 4,
  },
  goldText: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: "#FFD700",
  },
  realtimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  realtimeText: {
    fontSize: 10,
    fontWeight: "500" as const,
    color: "#fff",
  },
  planSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    position: "relative",
  },
  selectorIndicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  planOption: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    position: "relative",
  },
  planLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 4,
  },
  planLabelActive: {
    color: "#fff",
    fontWeight: "700" as const,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
  },
  planPriceActive: {
    color: "#fff",
  },
  planPricePro: {
    color: Colors.primary,
  },
  planPeriod: {
    fontSize: 10,
    fontWeight: "400" as const,
    color: "rgba(255,255,255,0.4)",
  },
  saveBadge: {
    position: "absolute",
    top: -12,
    backgroundColor: "#FFD700",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 10,
  },
  saveBadgeText: {
    fontSize: 8,
    fontWeight: "800" as const,
    color: "#000",
    letterSpacing: 0.3,
  },
  ctaSection: {
    alignItems: "center",
  },
  trialText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 16,
  },
  trialHighlight: {
    color: Colors.primary,
    fontWeight: "700" as const,
  },
  ctaButton: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 8,
  },
  ctaText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  legalText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  legalLink: {
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "underline" as const,
  },
});
