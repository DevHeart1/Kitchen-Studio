import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Share,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  X,
  Package,
  UtensilsCrossed,
  Soup,
  Sun,
  Share2,
  Lock,
  Flame,
  Cookie,
  Wine,
  Timer,
  CheckCircle,
  Palette,
  Star,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { Badge } from "@/types";

import { useGamification } from "@/contexts/GamificationContext";

const getIconComponent = (iconName: string, size: number, color: string) => {
  const icons: Record<string, React.ReactNode> = {
    package: <Package size={size} color={color} />,
    utensils: <UtensilsCrossed size={size} color={color} />,
    "utensils-crossed": <UtensilsCrossed size={size} color={color} />,
    soup: <Soup size={size} color={color} />,
    sun: <Sun size={size} color={color} />,
    share: <Share2 size={size} color={color} />,
    "share-2": <Share2 size={size} color={color} />,
    flame: <Flame size={size} color={color} />,
    cookie: <Cookie size={size} color={color} />,
    wine: <Wine size={size} color={color} />,
    timer: <Timer size={size} color={color} />,
  };
  return icons[iconName] || <Star size={size} color={color} />;
};

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { achievements } = useGamification();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const unlockedCount = achievements.filter((b) => b.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  const handleBadgePress = (badge: Badge) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedBadge(null), 300);
  };

  const handleShare = async () => {
    if (!selectedBadge) return;
    try {
      await Share.share({
        message: `I just earned the "${selectedBadge.name}" badge in the cooking app! 🎉`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const renderHexagonBadge = (badge: Badge, large = false) => {
    const size = large ? 128 : 96;
    const iconSize = large ? 48 : 28;
    const borderColor = badge.unlocked ? badge.color : "#475569";

    return (
      <View style={[styles.hexagonOuter, { width: size, height: size }]}>
        <View
          style={[
            styles.hexagonBorder,
            {
              width: size,
              height: size,
              backgroundColor: borderColor,
            },
          ]}
        >
          <View
            style={[
              styles.hexagonInner,
              {
                width: size * 0.96,
                height: size * 0.96,
                backgroundColor: Colors.backgroundDark,
              },
            ]}
          >
            <View
              style={[
                styles.hexagonContent,
                {
                  width: size * 0.9,
                  height: size * 0.9,
                  backgroundColor: badge.unlocked
                    ? `${badge.color}20`
                    : "rgba(71, 85, 105, 0.3)",
                },
              ]}
            >
              {getIconComponent(
                badge.icon,
                iconSize,
                badge.unlocked ? badge.color : "#64748b"
              )}
            </View>
          </View>
        </View>
        {!badge.unlocked && (
          <View style={[styles.lockOverlay, { width: size, height: size }]}>
            <Lock size={large ? 24 : 16} color="#94a3b8" />
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressCard}>
          <View style={styles.progressGlow} />
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressLabel}>TOTAL PROGRESS</Text>
              <Text style={styles.progressTitle}>Master Chef</Text>
            </View>
            <View style={styles.progressCount}>
              <Text style={styles.progressCountValue}>{unlockedCount}</Text>
              <Text style={styles.progressCountTotal}>/{totalCount}</Text>
            </View>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
              >
                <View style={styles.progressBarHighlight} />
              </View>
            </View>
          </View>
          <Text style={styles.progressHint}>
            Unlock 3 more badges to reach Level 6
          </Text>
        </View>

        <View style={styles.badgesGrid}>
          {achievements.map((badge) => (
            <TouchableOpacity
              key={badge.id}
              style={[styles.badgeItem, !badge.unlocked && styles.badgeItemLocked]}
              onPress={() => handleBadgePress(badge)}
              activeOpacity={0.7}
            >
              {renderHexagonBadge(badge)}
              <Text
                style={[
                  styles.badgeName,
                  badge.unlocked && { color: Colors.white },
                  !badge.unlocked && { color: "#64748b" },
                ]}
                numberOfLines={2}
              >
                {badge.name.split(" ").join("\n")}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={() => { }}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={handleCloseModal}
            >
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>

            {selectedBadge && (
              <View style={styles.modalBody}>
                <View style={styles.modalBadgeContainer}>
                  <View
                    style={[
                      styles.modalBadgeGlow,
                      { backgroundColor: selectedBadge.unlocked ? selectedBadge.color : "#475569" },
                    ]}
                  />
                  {renderHexagonBadge(selectedBadge, true)}
                  {selectedBadge.unlocked && (
                    <View
                      style={[
                        styles.unlockedTag,
                        { backgroundColor: selectedBadge.color },
                      ]}
                    >
                      <Text style={styles.unlockedTagText}>UNLOCKED</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>
                {selectedBadge.unlocked && selectedBadge.earnedDate && (
                  <Text style={styles.modalEarnedDate}>
                    Earned on {selectedBadge.earnedDate}
                  </Text>
                )}

                <View style={styles.modalRewardsRow}>
                  <View style={styles.rewardCard}>
                    <Text style={styles.rewardLabel}>XP EARNED</Text>
                    <Text style={styles.rewardXpValue}>+{selectedBadge.xpReward}</Text>
                  </View>
                  <View style={styles.rewardCard}>
                    <Text style={styles.rewardLabel}>REWARD</Text>
                    <View style={styles.rewardTypeContainer}>
                      <Palette size={14} color="#3b82f6" />
                      <Text style={styles.rewardTypeText}>
                        {selectedBadge.reward || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.requirementCard}>
                  <View style={styles.requirementHeader}>
                    <CheckCircle
                      size={16}
                      color={selectedBadge.unlocked ? Colors.primary : "#64748b"}
                    />
                    <Text style={styles.requirementLabel}>
                      {selectedBadge.unlocked ? "REQUIREMENT MET" : "REQUIREMENT"}
                    </Text>
                  </View>
                  <Text style={styles.requirementText}>
                    {selectedBadge.requirement}
                  </Text>
                  {!selectedBadge.unlocked &&
                    selectedBadge.progress !== undefined &&
                    selectedBadge.progressMax !== undefined && (
                      <View style={styles.progressSection}>
                        <View style={styles.miniProgressBar}>
                          <View
                            style={[
                              styles.miniProgressFill,
                              {
                                width: `${(selectedBadge.progress / selectedBadge.progressMax) * 100}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {selectedBadge.progress}/{selectedBadge.progressMax} completed
                        </Text>
                      </View>
                    )}
                </View>

                {selectedBadge.unlocked ? (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShare}
                    activeOpacity={0.8}
                  >
                    <Share2 size={20} color={Colors.backgroundDark} />
                    <Text style={styles.shareButtonText}>Share Achievement</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.lockedButton}>
                    <Lock size={20} color="#64748b" />
                    <Text style={styles.lockedButtonText}>Keep Cooking to Unlock</Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(16, 34, 21, 0.5)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardGlass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  progressCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    overflow: "hidden",
    position: "relative",
  },
  progressGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    borderRadius: 60,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  progressCount: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  progressCountValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  progressCountTotal: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.textMuted,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: "rgba(71, 85, 105, 0.4)",
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.5)",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
    position: "relative",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  progressBarHighlight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 2,
  },
  progressHint: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 12,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  badgeItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 16,
  },
  badgeItemLocked: {
    opacity: 0.6,
  },
  badgeName: {
    fontSize: 10,
    fontWeight: "700" as const,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 14,
  },
  hexagonOuter: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  hexagonBorder: {
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "0deg" }],
    borderRadius: 16,
  },
  hexagonInner: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  hexagonContent: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  lockOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.backgroundDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingTop: 32,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    borderBottomWidth: 0,
  },
  modalCloseButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    alignItems: "center",
  },
  modalBadgeContainer: {
    position: "relative",
    marginBottom: 24,
    alignItems: "center",
  },
  modalBadgeGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.3,
    top: -16,
  },
  unlockedTag: {
    position: "absolute",
    bottom: -12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unlockedTagText: {
    fontSize: 9,
    fontWeight: "800" as const,
    color: Colors.backgroundDark,
    letterSpacing: 1,
  },
  modalBadgeName: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  modalEarnedDate: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  modalRewardsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginBottom: 16,
  },
  rewardCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: "700" as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
  },
  rewardXpValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.primary,
    ...Platform.select({
      web: {
        textShadow: `0px 0px 8px ${Colors.primary}`,
      },
      default: {
        textShadowColor: Colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 8,
      },
    }),
  },
  rewardTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewardTypeText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#93c5fd",
  },
  requirementCard: {
    width: "100%",
    backgroundColor: "rgba(71, 85, 105, 0.2)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.3)",
  },
  requirementHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  requirementLabel: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  progressSection: {
    marginTop: 12,
  },
  miniProgressBar: {
    height: 6,
    backgroundColor: "rgba(71, 85, 105, 0.5)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  miniProgressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  shareButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  lockedButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(71, 85, 105, 0.3)",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(71, 85, 105, 0.5)",
  },
  lockedButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#64748b",
  },
});
