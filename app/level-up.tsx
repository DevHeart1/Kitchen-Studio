import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Share,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChefHat,
  Flame,
  UtensilsCrossed,
  Crown,
  Star,
  LockOpen,
  Camera,
  TrendingUp,
  Award,
  Share2,
  Sparkles,
  Zap,
  Users,
  Palette,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Perk {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
}

interface RankInfo {
  id: number;
  name: string;
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  perks: Perk[];
}

const RANK_DATA: Record<number, RankInfo> = {
  1: {
    id: 1,
    name: "novice",
    title: "Kitchen Novice",
    icon: UtensilsCrossed,
    color: "#64748b",
    perks: [
      { id: "p1", name: "Basic Recipes", description: "Access to 50+ starter recipes", icon: ChefHat, color: Colors.primary },
    ],
  },
  2: {
    id: 2,
    name: "prep",
    title: "Prep Cook",
    icon: UtensilsCrossed,
    color: "#22c55e",
    perks: [
      { id: "p2", name: "Knife Skills", description: "Unlock advanced cutting techniques", icon: UtensilsCrossed, color: Colors.primary },
      { id: "p3", name: "Timer Pro", description: "Multi-timer cooking mode", icon: Zap, color: "#eab308" },
    ],
  },
  3: {
    id: 3,
    name: "line",
    title: "Line Cook",
    icon: Flame,
    color: "#f97316",
    perks: [
      { id: "p4", name: "AR Preview", description: "Basic AR cooking guides", icon: Camera, color: Colors.primary },
      { id: "p5", name: "Recipe Scaling", description: "Scale recipes for any servings", icon: Sparkles, color: "#a855f7" },
    ],
  },
  4: {
    id: 4,
    name: "station",
    title: "Station Chef",
    icon: Flame,
    color: "#eab308",
    perks: [
      { id: "p6", name: "Custom Themes", description: "Unlock premium app themes", icon: Palette, color: "#a855f7" },
      { id: "p7", name: "Cook Squads", description: "Create cooking groups", icon: Users, color: "#3b82f6" },
    ],
  },
  5: {
    id: 5,
    name: "sous",
    title: "Sous Chef",
    icon: Star,
    color: "#3b82f6",
    perks: [
      { id: "p8", name: "Precision Heat Map AR", description: "See pan temperature in real-time", icon: Camera, color: Colors.primary },
      { id: "p9", name: "+10% XP Bonus", description: "On all Italian cuisine recipes", icon: TrendingUp, color: "#eab308" },
      { id: "p10", name: "Exclusive Badge", description: "Show off on your profile", icon: Award, color: "#a855f7" },
    ],
  },
  6: {
    id: 6,
    name: "head",
    title: "Head Chef",
    icon: Crown,
    color: "#a855f7",
    perks: [
      { id: "p11", name: "Recipe Creator", description: "Publish your own recipes", icon: ChefHat, color: Colors.primary },
      { id: "p12", name: "Mentor Badge", description: "Help new chefs learn", icon: Award, color: "#eab308" },
    ],
  },
  7: {
    id: 7,
    name: "executive",
    title: "Executive Chef",
    icon: Crown,
    color: "#ec4899",
    perks: [
      { id: "p13", name: "VIP Events", description: "Access to exclusive cooking events", icon: Sparkles, color: "#eab308" },
      { id: "p14", name: "Custom Avatar", description: "Unlock premium avatar items", icon: Palette, color: "#a855f7" },
    ],
  },
  8: {
    id: 8,
    name: "master",
    title: "Master Chef",
    icon: Crown,
    color: "#FFD700",
    perks: [
      { id: "p15", name: "Legendary Status", description: "Unlimited recipe access", icon: Crown, color: "#FFD700" },
      { id: "p16", name: "Priority Support", description: "24/7 chef assistance", icon: Star, color: Colors.primary },
    ],
  },
};

const CONFETTI_COLORS = [Colors.primary, "#FFD700", "#3b82f6", "#a855f7", "#ec4899", "#f97316"];
const NUM_CONFETTI = 30;

interface ConfettiPiece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  scale: Animated.Value;
  color: string;
  type: "star" | "circle" | "square";
}

export default function LevelUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ level?: string; fromLevel?: string }>();
  const { profile, acknowledgeLevelUp } = useUserProfile();

  const newLevel = params.level ? parseInt(params.level, 10) : profile.level;
  const rankInfo = RANK_DATA[Math.min(newLevel, 8)] || RANK_DATA[5];

  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeFloat = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.8)).current;
  const perksOpacity = useRef(new Animated.Value(0)).current;
  const perksTranslateY = useRef(new Animated.Value(30)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const levelBadgeScale = useRef(new Animated.Value(0)).current;
  const orbitRotate = useRef(new Animated.Value(0)).current;
  const orbitRotate2 = useRef(new Animated.Value(0)).current;

  const initializeConfetti = () => {
    const pieces: ConfettiPiece[] = [];
    for (let i = 0; i < NUM_CONFETTI; i++) {
      pieces.push({
        id: i,
        x: new Animated.Value(Math.random() * SCREEN_WIDTH),
        y: new Animated.Value(-50 - Math.random() * 100),
        rotate: new Animated.Value(0),
        scale: new Animated.Value(0.5 + Math.random() * 0.5),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        type: ["star", "circle", "square"][Math.floor(Math.random() * 3)] as "star" | "circle" | "square",
      });
    }
    setConfettiPieces(pieces);
    
    setTimeout(() => {
      pieces.forEach((piece) => {
        const duration = 3000 + Math.random() * 2000;
        const startX = Math.random() * SCREEN_WIDTH;
        
        Animated.loop(
          Animated.parallel([
            Animated.timing(piece.y, {
              toValue: SCREEN_HEIGHT + 50,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(piece.x, {
              toValue: startX + (Math.random() - 0.5) * 100,
              duration: duration,
              useNativeDriver: true,
            }),
            Animated.timing(piece.rotate, {
              toValue: 1,
              duration: duration,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });
    }, 500);
  };

  const startEntryAnimations = useCallback(() => {
    Animated.sequence([
      Animated.spring(badgeScale, {
        toValue: 1,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.spring(levelBadgeScale, {
      toValue: 1,
      friction: 5,
      tension: 100,
      delay: 300,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(perksOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(perksTranslateY, {
          toValue: 0,
          friction: 8,
          tension: 60,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    Animated.sequence([
      Animated.delay(900),
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(badgeFloat, {
          toValue: -15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(badgeFloat, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(orbitRotate, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(orbitRotate2, {
        toValue: 1,
        duration: 15000,
        useNativeDriver: true,
      })
    ).start();
  }, [badgeScale, titleOpacity, titleScale, levelBadgeScale, perksOpacity, perksTranslateY, buttonsOpacity, glowPulse, badgeFloat, orbitRotate, orbitRotate2]);

  useEffect(() => {
    initializeConfetti();
    startEntryAnimations();
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    console.log(`Level Up! New level: ${newLevel}, Rank: ${rankInfo.title}`);
  }, [newLevel, rankInfo.title, startEntryAnimations]);

  const handleLetsCook = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    acknowledgeLevelUp();
    router.replace("/(tabs)");
    console.log("Lets Cook pressed - navigating to home");
  }, [router, acknowledgeLevelUp]);

  const handleShare = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    try {
      await Share.share({
        message: `🎉 I just reached Level ${newLevel} - ${rankInfo.title} in my cooking journey! Time to heat things up! 🍳🔥`,
        title: "Level Up Achievement",
      });
      console.log("Shared level up achievement");
    } catch (error) {
      console.log("Share cancelled or failed:", error);
    }
  }, [newLevel, rankInfo.title]);

  const renderConfetti = () => {
    return confettiPieces.map((piece) => {
      const rotateInterpolate = piece.rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "720deg"],
      });

      return (
        <Animated.View
          key={piece.id}
          style={[
            styles.confettiPiece,
            {
              transform: [
                { translateX: piece.x },
                { translateY: piece.y },
                { rotate: rotateInterpolate },
                { scale: piece.scale },
              ],
            },
          ]}
        >
          {piece.type === "star" && (
            <Star size={12} color={piece.color} fill={piece.color} />
          )}
          {piece.type === "circle" && (
            <View style={[styles.confettiCircle, { backgroundColor: piece.color }]} />
          )}
          {piece.type === "square" && (
            <View style={[styles.confettiSquare, { backgroundColor: piece.color }]} />
          )}
        </Animated.View>
      );
    });
  };

  const IconComponent = rankInfo.icon;

  const orbitRotateInterpolate = orbitRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const orbitRotate2Interpolate = orbitRotate2.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-360deg"],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#102215", "#0a1610", "#102215"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.backgroundPattern}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.bgDot,
              {
                left: `${(i % 5) * 25}%`,
                top: `${Math.floor(i / 5) * 25}%`,
                opacity: 0.03,
              },
            ]}
          />
        ))}
      </View>

      <Animated.View
        style={[
          styles.glowBackground,
          {
            opacity: glowPulse.interpolate({
              inputRange: [0.5, 1],
              outputRange: [0.2, 0.4],
            }),
          },
        ]}
      >
        <LinearGradient
          colors={[`${rankInfo.color}40`, "transparent"]}
          style={styles.glowGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {renderConfetti()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40 }]}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <View style={styles.badgeSection}>
          <Animated.View
            style={[
              styles.orbitRing,
              {
                borderColor: `${rankInfo.color}20`,
                transform: [{ rotate: orbitRotateInterpolate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.orbitRing2,
              {
                borderColor: `${Colors.primary}15`,
                transform: [{ rotate: orbitRotate2Interpolate }],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.glowCircle,
              {
                backgroundColor: rankInfo.color,
                opacity: glowPulse.interpolate({
                  inputRange: [0.5, 1],
                  outputRange: [0.3, 0.5],
                }),
                transform: [
                  {
                    scale: glowPulse.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />

          <Animated.View
            style={[
              styles.badgeContainer,
              {
                transform: [
                  { scale: badgeScale },
                  { translateY: badgeFloat },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={["#1a3022", "#0d1912"]}
              style={styles.badgeGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={styles.badgeShine} />
              <IconComponent size={56} color="#FFD700" />
              <Text style={styles.badgeTitle}>{rankInfo.title.toUpperCase()}</Text>
              <View style={styles.starsRow}>
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Star size={12} color="#FFD700" fill="#FFD700" />
                <Star size={12} color="#FFD700" fill="#FFD700" />
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.levelBadge,
              {
                transform: [
                  { scale: levelBadgeScale },
                  { translateY: badgeFloat },
                ],
              },
            ]}
          >
            <Text style={styles.levelNumber}>{newLevel}</Text>
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.titleSection,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
            },
          ]}
        >
          <Text style={styles.levelUpText}>LEVEL UP!</Text>
          <Text style={styles.subtitleText}>
            You have mastered the basics. Time to heat things up!
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.perksSection,
            {
              opacity: perksOpacity,
              transform: [{ translateY: perksTranslateY }],
            },
          ]}
        >
          <View style={styles.perksHeader}>
            <LockOpen size={16} color={Colors.primary} />
            <Text style={styles.perksHeaderText}>NEW PERKS UNLOCKED</Text>
          </View>

          {rankInfo.perks.map((perk, index) => {
            const PerkIcon = perk.icon;
            return (
              <View key={perk.id} style={styles.perkItem}>
                <View style={[styles.perkIconContainer, { backgroundColor: `${perk.color}20` }]}>
                  <PerkIcon size={20} color={perk.color} />
                </View>
                <View style={styles.perkInfo}>
                  <Text style={styles.perkName}>{perk.name}</Text>
                  <Text style={styles.perkDescription}>{perk.description}</Text>
                </View>
              </View>
            );
          })}
        </Animated.View>

        <Animated.View
          style={[
            styles.buttonsSection,
            {
              opacity: buttonsOpacity,
              paddingBottom: insets.bottom + 24,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLetsCook}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary, "#1fd94a"]}
              style={styles.primaryButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <ChefHat size={22} color={Colors.backgroundDark} />
              <Text style={styles.primaryButtonText}>Lets Cook</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShare}
            activeOpacity={0.8}
          >
            <Share2 size={18} color={Colors.white} />
            <Text style={styles.secondaryButtonText}>Share Achievement</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  bgDot: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
  },
  glowBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.5,
  },
  glowGradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  badgeSection: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    marginBottom: 24,
  },
  orbitRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  orbitRing2: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    borderStyle: "dotted",
  },
  glowCircle: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
  },
  badgeContainer: {
    width: 140,
    height: 160,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFD700",
    shadowColor: "#FFD700",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  badgeGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  badgeShine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderBottomLeftRadius: 100,
    borderBottomRightRadius: 100,
  },
  badgeTitle: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFD700",
    letterSpacing: 2,
    marginTop: 8,
    textAlign: "center",
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  levelBadge: {
    position: "absolute",
    bottom: 10,
    right: SCREEN_WIDTH / 2 - 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.backgroundDark,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  levelNumber: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.primary,
    textShadowColor: "rgba(43, 238, 91, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  levelUpText: {
    fontSize: 48,
    fontWeight: "900" as const,
    fontStyle: "italic",
    color: Colors.white,
    letterSpacing: -2,
    textShadowColor: "rgba(43, 238, 91, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitleText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
  perksSection: {
    width: "100%",
    backgroundColor: "rgba(22, 43, 27, 0.85)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  perksHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  perksHeaderText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "rgba(255, 255, 255, 0.5)",
    letterSpacing: 1.5,
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  perkIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  perkInfo: {
    flex: 1,
  },
  perkName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  perkDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
  },
  buttonsSection: {
    width: "100%",
    marginTop: "auto",
    paddingTop: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: Colors.backgroundDark,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  confettiPiece: {
    position: "absolute",
    zIndex: 100,
  },
  confettiCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  confettiSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
});
