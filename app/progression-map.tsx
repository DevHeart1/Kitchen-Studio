import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from "react-native-svg";
import {
  ArrowLeft,
  ChefHat,
  Flame,
  UtensilsCrossed,
  Crown,
  Star,
  Lock,
  LockOpen,
  Check,
  Gift,
  Sparkles,
  Camera,
  Users,
  Palette,
  Zap,
  Award,
  X,
  ChevronRight,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ChefRank {
  id: number;
  name: string;
  title: string;
  xpRequired: number;
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  perks: Perk[];
  position: { x: number; y: number };
}

interface Perk {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

const CHEF_RANKS: ChefRank[] = [
  {
    id: 1,
    name: "novice",
    title: "Kitchen Novice",
    xpRequired: 0,
    icon: UtensilsCrossed,
    color: "#64748b",
    perks: [
      { id: "p1", name: "Basic Recipes", description: "Access to 50+ starter recipes", icon: ChefHat },
    ],
    position: { x: 0.5, y: 0.88 },
  },
  {
    id: 2,
    name: "prep",
    title: "Prep Cook",
    xpRequired: 500,
    icon: UtensilsCrossed,
    color: "#22c55e",
    perks: [
      { id: "p2", name: "Knife Skills", description: "Unlock advanced cutting techniques", icon: UtensilsCrossed },
      { id: "p3", name: "Timer Pro", description: "Multi-timer cooking mode", icon: Zap },
    ],
    position: { x: 0.25, y: 0.72 },
  },
  {
    id: 3,
    name: "line",
    title: "Line Cook",
    xpRequired: 1200,
    icon: Flame,
    color: "#f97316",
    perks: [
      { id: "p4", name: "AR Preview", description: "Basic AR cooking guides", icon: Camera },
      { id: "p5", name: "Recipe Scaling", description: "Scale recipes for any servings", icon: Sparkles },
    ],
    position: { x: 0.2, y: 0.56 },
  },
  {
    id: 4,
    name: "station",
    title: "Station Chef",
    xpRequired: 2000,
    icon: Flame,
    color: "#eab308",
    perks: [
      { id: "p6", name: "Custom Themes", description: "Unlock premium app themes", icon: Palette },
      { id: "p7", name: "Cook Squads", description: "Create cooking groups", icon: Users },
    ],
    position: { x: 0.75, y: 0.44 },
  },
  {
    id: 5,
    name: "sous",
    title: "Sous Chef",
    xpRequired: 3000,
    icon: Star,
    color: "#3b82f6",
    perks: [
      { id: "p8", name: "4K AR Filters", description: "Premium AR cooking overlays", icon: Camera },
      { id: "p9", name: "Priority Support", description: "24/7 chef assistance", icon: Sparkles },
    ],
    position: { x: 0.8, y: 0.32 },
  },
  {
    id: 6,
    name: "head",
    title: "Head Chef",
    xpRequired: 4500,
    icon: Crown,
    color: "#a855f7",
    perks: [
      { id: "p10", name: "Recipe Creator", description: "Publish your own recipes", icon: ChefHat },
      { id: "p11", name: "Mentor Badge", description: "Help new chefs learn", icon: Award },
    ],
    position: { x: 0.5, y: 0.18 },
  },
  {
    id: 7,
    name: "executive",
    title: "Executive Chef",
    xpRequired: 6500,
    icon: Crown,
    color: "#ec4899",
    perks: [
      { id: "p12", name: "VIP Events", description: "Access to exclusive cooking events", icon: Sparkles },
      { id: "p13", name: "Custom Avatar", description: "Unlock premium avatar items", icon: Palette },
    ],
    position: { x: 0.5, y: 0.08 },
  },
];

export default function ProgressionMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, addXP, getXPProgress } = useUserProfile();
  const scrollViewRef = useRef<ScrollView>(null);

  const [selectedRank, setSelectedRank] = useState<ChefRank | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pathAnim = useRef(new Animated.Value(0)).current;
  const nodeAnims = useRef(CHEF_RANKS.map(() => new Animated.Value(0))).current;

  const xpProgress = getXPProgress();
  const currentRankIndex = CHEF_RANKS.findIndex((r) => r.xpRequired > profile.stats.totalXP) - 1;
  const currentRank = CHEF_RANKS[Math.max(0, currentRankIndex)] || CHEF_RANKS[0];
  const nextRank = CHEF_RANKS[currentRankIndex + 1];

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.timing(pathAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    nodeAnims.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  const isRankUnlocked = useCallback((rank: ChefRank) => {
    return profile.stats.totalXP >= rank.xpRequired;
  }, [profile.stats.totalXP]);

  const isCurrentRank = useCallback((rank: ChefRank) => {
    return rank.id === currentRank.id;
  }, [currentRank]);

  const isNextRank = useCallback((rank: ChefRank) => {
    return nextRank && rank.id === nextRank.id;
  }, [nextRank]);

  const handleRankPress = (rank: ChefRank) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedRank(rank);
    console.log("Selected rank:", rank.title);
  };

  const handleClaimReward = async (rank: ChefRank) => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    setClaimedRewards((prev) => [...prev, rank.name]);
    setShowUnlockAnimation(true);
    
    setTimeout(() => {
      setShowUnlockAnimation(false);
      setSelectedRank(null);
    }, 1500);
    
    console.log("Claimed rewards for:", rank.title);
  };

  const handleAddTestXP = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const result = await addXP(250);
    console.log("Added 250 XP for testing");
    
    if (result && result.leveledUp) {
      setTimeout(() => {
        router.push({
          pathname: "/level-up",
          params: {
            level: result.newLevel.toString(),
            fromLevel: result.previousLevel.toString(),
          },
        });
      }, 300);
    }
  };

  const getProgressToNextRank = () => {
    if (!nextRank) return 100;
    const currentXP = profile.stats.totalXP;
    const currentRankXP = currentRank.xpRequired;
    const nextRankXP = nextRank.xpRequired;
    return Math.min(((currentXP - currentRankXP) / (nextRankXP - currentRankXP)) * 100, 100);
  };

  const renderRankNode = (rank: ChefRank, index: number) => {
    const unlocked = isRankUnlocked(rank);
    const isCurrent = isCurrentRank(rank);
    const isNext = isNextRank(rank);
    const hasClaimedReward = claimedRewards.includes(rank.name);
    const IconComponent = rank.icon;

    const nodeSize = isCurrent ? 80 : isNext ? 72 : 64;
    const left = rank.position.x * (SCREEN_WIDTH - 40) - nodeSize / 2;

    return (
      <Animated.View
        key={rank.id}
        style={[
          styles.rankNodeContainer,
          {
            left: left + 20,
            top: rank.position.y * 700,
            opacity: nodeAnims[index],
            transform: [
              {
                scale: nodeAnims[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
              },
            ],
          },
        ]}
      >
        {isCurrent && (
          <Animated.View
            style={[
              styles.currentGlow,
              {
                width: nodeSize + 40,
                height: nodeSize + 40,
                borderRadius: (nodeSize + 40) / 2,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.7],
                }),
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        )}
        
        {isNext && (
          <Animated.View
            style={[
              styles.nextGlow,
              {
                width: nodeSize + 30,
                height: nodeSize + 30,
                borderRadius: (nodeSize + 30) / 2,
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.2, 0.5],
                }),
              },
            ]}
          />
        )}

        <TouchableOpacity
          style={[
            styles.rankNode,
            {
              width: nodeSize,
              height: nodeSize,
              borderRadius: nodeSize / 2,
              borderColor: unlocked ? rank.color : "#475569",
              backgroundColor: unlocked ? `${rank.color}15` : "rgba(71, 85, 105, 0.2)",
            },
            isCurrent && styles.currentRankNode,
          ]}
          onPress={() => handleRankPress(rank)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.rankNodeInner,
              {
                width: nodeSize - 8,
                height: nodeSize - 8,
                borderRadius: (nodeSize - 8) / 2,
                backgroundColor: unlocked ? `${rank.color}25` : "rgba(71, 85, 105, 0.3)",
              },
            ]}
          >
            <IconComponent
              size={isCurrent ? 32 : 24}
              color={unlocked ? rank.color : "#64748b"}
            />
          </View>
          
          {!unlocked && (
            <View style={styles.lockOverlay}>
              <Lock size={16} color="#64748b" />
            </View>
          )}
          
          {unlocked && !hasClaimedReward && index > 0 && (
            <View style={[styles.rewardBadge, { backgroundColor: rank.color }]}>
              <Gift size={10} color={Colors.backgroundDark} />
            </View>
          )}
        </TouchableOpacity>

        <View
          style={[
            styles.rankLabel,
            {
              backgroundColor: isCurrent ? rank.color : unlocked ? `${rank.color}30` : "rgba(30, 41, 59, 0.8)",
            },
          ]}
        >
          <Text
            style={[
              styles.rankLabelText,
              {
                color: isCurrent ? Colors.backgroundDark : unlocked ? rank.color : "#64748b",
                fontWeight: isCurrent ? "800" : "600",
              },
            ]}
          >
            {rank.title.split(" ")[0]}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderPath = () => {
    const pathD = `
      M ${SCREEN_WIDTH * 0.5} 616
      C ${SCREEN_WIDTH * 0.5} 560, ${SCREEN_WIDTH * 0.25} 530, ${SCREEN_WIDTH * 0.25} 504
      C ${SCREEN_WIDTH * 0.25} 470, ${SCREEN_WIDTH * 0.2} 430, ${SCREEN_WIDTH * 0.2} 392
      C ${SCREEN_WIDTH * 0.2} 340, ${SCREEN_WIDTH * 0.75} 360, ${SCREEN_WIDTH * 0.75} 308
      C ${SCREEN_WIDTH * 0.75} 270, ${SCREEN_WIDTH * 0.8} 250, ${SCREEN_WIDTH * 0.8} 224
      C ${SCREEN_WIDTH * 0.8} 180, ${SCREEN_WIDTH * 0.5} 160, ${SCREEN_WIDTH * 0.5} 126
      C ${SCREEN_WIDTH * 0.5} 100, ${SCREEN_WIDTH * 0.5} 80, ${SCREEN_WIDTH * 0.5} 56
    `;

    const progress = getProgressToNextRank() / 100;
    const completedRanks = currentRankIndex + 1;
    const totalSegments = CHEF_RANKS.length - 1;
    const totalProgress = (completedRanks + progress) / totalSegments;

    return (
      <Svg
        width={SCREEN_WIDTH}
        height={700}
        style={styles.pathSvg}
      >
        <Defs>
          <LinearGradient id="pathGradient" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.8" />
            <Stop offset="1" stopColor="#3b82f6" stopOpacity="0.8" />
          </LinearGradient>
          <LinearGradient id="pathGlow" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.3" />
            <Stop offset="1" stopColor="#3b82f6" stopOpacity="0.1" />
          </LinearGradient>
        </Defs>
        
        <Path
          d={pathD}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray="16 16"
          fill="none"
        />
        
        <Path
          d={pathD}
          stroke="url(#pathGlow)"
          strokeWidth={20}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
        
        <Path
          d={pathD}
          stroke="url(#pathGradient)"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${totalProgress * 1000} 1000`}
        />
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundPattern} />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.levelText}>Level {profile.level}</Text>
          <Text style={styles.rankTitle}>{profile.title.toUpperCase()}</Text>
        </View>
        
        <TouchableOpacity style={styles.avatarContainer}>
          <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarBadgeText}>{profile.level}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.xpSection}>
        <View style={styles.xpHeader}>
          <Text style={styles.xpText}>{profile.stats.totalXP.toLocaleString()} XP</Text>
          <Text style={styles.xpText}>
            {nextRank ? `${nextRank.xpRequired.toLocaleString()} XP` : "MAX"}
          </Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={[styles.xpBarFill, { width: `${getProgressToNextRank()}%` }]}>
            <Animated.View
              style={[
                styles.xpBarGlow,
                {
                  opacity: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ]}
            />
          </View>
        </View>
        <Text style={styles.xpSubtext}>
          {nextRank
            ? `${(nextRank.xpRequired - profile.stats.totalXP).toLocaleString()} XP to reach ${nextRank.title}`
            : "Maximum rank achieved!"}
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.mapContainer}
        contentContainerStyle={styles.mapContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pathContainer}>
          {renderPath()}
          {CHEF_RANKS.map((rank, index) => renderRankNode(rank, index))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.testButton}
        onPress={handleAddTestXP}
        activeOpacity={0.8}
      >
        <Zap size={16} color={Colors.backgroundDark} />
        <Text style={styles.testButtonText}>+250 XP</Text>
      </TouchableOpacity>

      <Modal
        visible={selectedRank !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRank(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedRank(null)}
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {selectedRank && (
              <>
                {showUnlockAnimation ? (
                  <View style={styles.unlockAnimation}>
                    <Animated.View
                      style={[
                        styles.unlockCircle,
                        { backgroundColor: `${selectedRank.color}30` },
                      ]}
                    >
                      <Check size={48} color={selectedRank.color} />
                    </Animated.View>
                    <Text style={styles.unlockText}>Rewards Claimed!</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.modalHeader}>
                      <View
                        style={[
                          styles.modalIconContainer,
                          { backgroundColor: `${selectedRank.color}20` },
                        ]}
                      >
                        <View
                          style={[
                            styles.modalIconGlow,
                            { backgroundColor: selectedRank.color },
                          ]}
                        />
                        <View
                          style={[
                            styles.modalIconInner,
                            { borderColor: selectedRank.color },
                          ]}
                        >
                          <selectedRank.icon size={40} color={selectedRank.color} />
                        </View>
                      </View>
                      
                      {isRankUnlocked(selectedRank) && (
                        <View style={[styles.unlockedBadge, { backgroundColor: selectedRank.color }]}>
                          <LockOpen size={12} color={Colors.backgroundDark} />
                          <Text style={styles.unlockedBadgeText}>Unlocked</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.modalTitle}>{selectedRank.title}</Text>
                    <Text style={styles.modalXP}>
                      {selectedRank.xpRequired.toLocaleString()} XP Required
                    </Text>

                    <View style={styles.perksContainer}>
                      <Text style={styles.perksTitle}>
                        <Sparkles size={14} color={Colors.primary} /> Perks & Rewards
                      </Text>
                      {selectedRank.perks.map((perk) => (
                        <View key={perk.id} style={styles.perkItem}>
                          <View style={styles.perkIconContainer}>
                            <perk.icon size={18} color={Colors.primary} />
                          </View>
                          <View style={styles.perkInfo}>
                            <Text style={styles.perkName}>{perk.name}</Text>
                            <Text style={styles.perkDesc}>{perk.description}</Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    {isRankUnlocked(selectedRank) && !claimedRewards.includes(selectedRank.name) && selectedRank.id > 1 ? (
                      <TouchableOpacity
                        style={[styles.claimButton, { backgroundColor: selectedRank.color }]}
                        onPress={() => handleClaimReward(selectedRank)}
                        activeOpacity={0.8}
                      >
                        <Gift size={18} color={Colors.backgroundDark} />
                        <Text style={styles.claimButtonText}>Claim Rewards</Text>
                      </TouchableOpacity>
                    ) : isRankUnlocked(selectedRank) ? (
                      <View style={styles.claimedContainer}>
                        <Check size={18} color={Colors.primary} />
                        <Text style={styles.claimedText}>
                          {selectedRank.id === 1 ? "Starting Rank" : "Rewards Claimed"}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.lockedContainer}>
                        <Lock size={18} color={Colors.textMuted} />
                        <Text style={styles.lockedText}>
                          {(selectedRank.xpRequired - profile.stats.totalXP).toLocaleString()} XP needed
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: Colors.backgroundDark,
    opacity: 0.8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  levelText: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  rankTitle: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
    letterSpacing: 2,
    marginTop: 2,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(43, 238, 91, 0.3)",
  },
  avatarBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: Colors.primary,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.backgroundDark,
  },
  avatarBadgeText: {
    fontSize: 10,
    fontWeight: "800" as const,
    color: Colors.backgroundDark,
  },
  xpSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  xpText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textMuted,
  },
  xpBarContainer: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
    position: "relative",
    overflow: "hidden",
  },
  xpBarGlow: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  xpSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
  mapContainer: {
    flex: 1,
  },
  mapContent: {
    paddingBottom: 120,
  },
  pathContainer: {
    height: 700,
    position: "relative",
  },
  pathSvg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  rankNodeContainer: {
    position: "absolute",
    alignItems: "center",
  },
  currentGlow: {
    position: "absolute",
    backgroundColor: Colors.primary,
  },
  nextGlow: {
    position: "absolute",
    backgroundColor: "#3b82f6",
  },
  rankNode: {
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  currentRankNode: {
    borderWidth: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  rankNodeInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  rewardBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.backgroundDark,
  },
  rankLabel: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  rankLabelText: {
    fontSize: 11,
    textAlign: "center",
  },
  testButton: {
    position: "absolute",
    bottom: 100,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  testButtonText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Colors.backgroundDark,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalClose: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  modalIconGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    opacity: 0.3,
  },
  modalIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unlockedBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
    textAlign: "center",
    marginBottom: 4,
  },
  modalXP: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: 24,
  },
  perksContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  perksTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  perkIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(43, 238, 91, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  perkInfo: {
    flex: 1,
  },
  perkName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  perkDesc: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  claimButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  claimButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  claimedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
  },
  claimedText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  lockedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: "rgba(100, 116, 139, 0.1)",
    borderRadius: 16,
  },
  lockedText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.textMuted,
  },
  unlockAnimation: {
    alignItems: "center",
    paddingVertical: 40,
  },
  unlockCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  unlockText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
