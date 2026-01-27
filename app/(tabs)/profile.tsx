import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  Share,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Bell,
  Share2,
  Star,
  Package,
  UtensilsCrossed,
  Soup,
  Lock,
  Settings,
  ChevronRight,
  Sun,
  Flame,
  Heart,
  X,
  Trophy,
  Map,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";

const BADGE_ICONS: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  "1": Package,
  "2": UtensilsCrossed,
  "3": Soup,
  "4": Sun,
  "5": Share2,
};

const BADGE_COLORS: Record<string, { color: string; bgColor: string }> = {
  "1": { color: "#f97316", bgColor: "rgba(249, 115, 22, 0.2)" },
  "2": { color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.2)" },
  "3": { color: "#a855f7", bgColor: "rgba(168, 85, 247, 0.2)" },
  "4": { color: "#eab308", bgColor: "rgba(234, 179, 8, 0.2)" },
  "5": { color: "#14b8a6", bgColor: "rgba(20, 184, 166, 0.2)" },
};

const BADGE_NAMES: Record<string, { name: string; description: string }> = {
  "1": { name: "Pantry Master", description: "50 items stocked" },
  "2": { name: "Knife Pro", description: "Perfect cuts streak" },
  "3": { name: "Sauce Boss", description: "5 master sauces" },
  "4": { name: "Early Bird", description: "10 morning cooks" },
  "5": { name: "Socialite", description: "Shared 10 recipes" },
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, getXPProgress, computedStats } = useUserProfile();
  const { savedRecipes } = useSavedRecipes();
  const [selectedRecipe, setSelectedRecipe] = useState<{
    id: string;
    title: string;
    image: string;
    likes: number;
  } | null>(null);

  const xpProgress = getXPProgress();
  const displayBadges = profile.unlockedBadgeIds.slice(0, 3);
  const hasLockedBadge = profile.unlockedBadgeIds.length < 4;

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleShare = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      await Share.share({
        message: `Check out my chef profile! I'm a Level ${profile.level} ${profile.title} with ${profile.stats.recipesCompleted} recipes completed and ${profile.stats.accuracy}% accuracy! 🍳👨‍🍳`,
        title: `${profile.name}'s Chef Profile`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const handleBadgePress = (badgeId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push("/achievements");
  };

  const handleRecipePress = (recipe: typeof selectedRecipe) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (recipe) {
      router.push({
        pathname: "/shared-recipe",
        params: { id: recipe.id },
      });
    }
  };

  const handleViewAllBadges = () => {
    router.push("/achievements");
  };

  const handleSettings = () => {
    router.push("/settings");
  };

  const handleProgressionMap = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push("/progression-map");
  };

  const handleRecentCooks = () => {
    router.push("/recent-cooks");
  };

  const renderBadge = (badgeId: string, index: number) => {
    const IconComponent = BADGE_ICONS[badgeId] || Package;
    const colors = BADGE_COLORS[badgeId] || { color: "#64748b", bgColor: "rgba(100, 116, 139, 0.3)" };
    const badgeInfo = BADGE_NAMES[badgeId] || { name: "Badge", description: "Unlocked" };

    return (
      <TouchableOpacity
        key={badgeId}
        style={styles.badgeCard}
        onPress={() => handleBadgePress(badgeId)}
        activeOpacity={0.7}
      >
        <View style={[styles.badgeIcon, { backgroundColor: colors.bgColor }]}>
          <IconComponent size={20} color={colors.color} />
        </View>
        <View style={styles.badgeInfo}>
          <Text style={styles.badgeName} numberOfLines={1}>
            {badgeInfo.name}
          </Text>
          <Text style={styles.badgeDesc} numberOfLines={1}>
            {badgeInfo.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.logoContainer}>
            <UtensilsCrossed size={20} color={Colors.backgroundDark} />
          </View>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton} onPress={handleNotifications}>
            <Bell size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
            <Share2 size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleProgressionMap}
            activeOpacity={0.8}
          >
            <View style={styles.avatarBorder}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.levelBadge}>
              <Star size={12} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
              <Text style={styles.levelText}>LEVEL {profile.level}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileTitle}>{profile.title.toUpperCase()}</Text>
          
          <TouchableOpacity 
            style={styles.xpContainer}
            onPress={handleProgressionMap}
            activeOpacity={0.8}
          >
            <View style={styles.xpHeader}>
              <Text style={styles.xpLabel}>XP Progress</Text>
              <View style={styles.xpRight}>
                <Text style={styles.xpValue}>{xpProgress.current}/{xpProgress.needed}</Text>
                <ChevronRight size={14} color={Colors.primary} />
              </View>
            </View>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${xpProgress.percent}%` }]} />
            </View>
            <Text style={styles.xpHint}>Tap to view progression map</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <TouchableOpacity style={styles.statCard} onPress={handleRecentCooks} activeOpacity={0.8}>
            <Text style={styles.statValue}>{profile.stats.cookTime}</Text>
            <Text style={styles.statLabel}>COOK TIME</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statValue, styles.statValueHighlight]}>
              {profile.stats.accuracy}%
            </Text>
            <Text style={styles.statLabel}>ACCURACY</Text>
          </View>
          <TouchableOpacity style={styles.statCard} onPress={handleRecentCooks} activeOpacity={0.8}>
            <Text style={styles.statValue}>{profile.stats.recipesCompleted}</Text>
            <Text style={styles.statLabel}>RECIPES</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earned Badges</Text>
            <TouchableOpacity onPress={handleViewAllBadges}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesGrid}>
            {displayBadges.map((badgeId, index) => renderBadge(badgeId, index))}
            {hasLockedBadge && (
              <TouchableOpacity
                style={[styles.badgeCard, styles.badgeCardLocked]}
                onPress={handleViewAllBadges}
                activeOpacity={0.7}
              >
                <View style={[styles.badgeIcon, { backgroundColor: "rgba(100, 116, 139, 0.3)" }]}>
                  <Lock size={20} color="#64748b" />
                </View>
                <View style={styles.badgeInfo}>
                  <Text style={[styles.badgeName, styles.badgeNameLocked]} numberOfLines={1}>
                    More Badges
                  </Text>
                  <Text style={[styles.badgeDesc, styles.badgeDescLocked]} numberOfLines={1}>
                    View all achievements
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Shared Recipes</Text>
            <Text style={styles.recipeCount}>{profile.sharedRecipes.length} recipes</Text>
          </View>
          {profile.sharedRecipes.length > 0 ? (
            <View style={styles.recipesGrid}>
              {profile.sharedRecipes.slice(0, 3).map((recipe) => (
                <Pressable
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => handleRecipePress(recipe)}
                >
                  <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
                  <View style={styles.recipeOverlay}>
                    <View style={styles.recipeLikes}>
                      <Heart size={12} color={Colors.white} fill={Colors.white} />
                      <Text style={styles.recipeLikesText}>{recipe.likes}</Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyRecipes}>
              <Trophy size={32} color={Colors.textMuted} />
              <Text style={styles.emptyRecipesText}>
                Share your first recipe to see it here!
              </Text>
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={handleProgressionMap}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: "rgba(59, 130, 246, 0.2)" }]}>
              <Map size={20} color="#3b82f6" />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Chef Journey</Text>
              <Text style={styles.quickActionSubtitle}>
                Level {profile.level} • {profile.title}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionCard, { marginTop: 12 }]}
            onPress={handleRecentCooks}
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + "20" }]}>
              <Flame size={20} color={Colors.primary} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Recent Cooks</Text>
              <Text style={styles.quickActionSubtitle}>
                {computedStats.inProgressCooks} in progress
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.settingsCard}
          activeOpacity={0.8}
          onPress={handleSettings}
        >
          <View style={styles.settingsLeft}>
            <View style={styles.settingsIcon}>
              <Settings size={20} color={Colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.settingsTitle}>Account Settings</Text>
              <Text style={styles.settingsSubtitle}>Privacy, Notifications, Data</Text>
            </View>
          </View>
          <ChevronRight size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: "rgba(16, 34, 21, 0.8)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    letterSpacing: -0.3,
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  profileSection: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatarBorder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    padding: 4,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  levelBadge: {
    position: "absolute",
    bottom: -12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: Colors.backgroundDark,
  },
  levelText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.backgroundDark,
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.white,
    marginTop: 16,
  },
  profileTitle: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
    letterSpacing: 2,
    marginTop: 4,
  },
  xpContainer: {
    width: "100%",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textMuted,
  },
  xpValue: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  xpRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  xpHint: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: "center" as const,
    marginTop: 8,
  },
  xpBar: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  statsSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  statCardHighlight: {
    borderColor: "rgba(43, 238, 91, 0.3)",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  statValueHighlight: {
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  viewAllText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500" as const,
  },
  recipeCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500" as const,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  badgeCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  badgeCardLocked: {
    opacity: 0.6,
    borderStyle: "dashed" as const,
    borderColor: "rgba(100, 116, 139, 0.5)",
  },
  badgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  badgeNameLocked: {
    color: Colors.textMuted,
  },
  badgeDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
  badgeDescLocked: {
    color: "rgba(100, 116, 139, 0.8)",
  },
  recipesGrid: {
    flexDirection: "row",
    gap: 12,
  },
  recipeCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
    padding: 8,
  },
  recipeLikes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeLikesText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  emptyRecipes: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  emptyRecipesText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
  quickActions: {
    marginBottom: 16,
  },
  quickActionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionContent: {
    flex: 1,
    marginLeft: 12,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  settingsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    marginBottom: 16,
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(100, 116, 139, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  settingsSubtitle: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
  },
});
