import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
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
} from "lucide-react-native";
import Colors from "@/constants/colors";

const PROFILE_DATA = {
  name: "Alex Ramsey",
  title: "SOUS CHEF",
  level: 5,
  avatar: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=300&h=300&fit=crop&crop=face",
  stats: {
    cookTime: "48h",
    accuracy: "92%",
    recipes: "12",
  },
};

const BADGES = [
  {
    id: "1",
    name: "Pantry Master",
    description: "50 items stocked",
    icon: Package,
    color: "#f97316",
    bgColor: "rgba(249, 115, 22, 0.2)",
    unlocked: true,
  },
  {
    id: "2",
    name: "Knife Pro",
    description: "Perfect cuts streak",
    icon: UtensilsCrossed,
    color: "#3b82f6",
    bgColor: "rgba(59, 130, 246, 0.2)",
    unlocked: true,
  },
  {
    id: "3",
    name: "Sauce Boss",
    description: "5 master sauces",
    icon: Soup,
    color: "#a855f7",
    bgColor: "rgba(168, 85, 247, 0.2)",
    unlocked: true,
  },
  {
    id: "4",
    name: "Grill King",
    description: "Locked",
    icon: Lock,
    color: "#64748b",
    bgColor: "rgba(100, 116, 139, 0.3)",
    unlocked: false,
  },
];

const SHARED_RECIPES = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&fit=crop",
    likes: 128,
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop",
    likes: 84,
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=300&fit=crop",
    likes: 312,
  },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleNotifications = () => {
    router.push("/notifications");
  };

  const handleShare = () => {
    console.log("Share profile");
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
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBorder}>
              <Image source={{ uri: PROFILE_DATA.avatar }} style={styles.avatar} />
            </View>
            <View style={styles.levelBadge}>
              <Star size={12} color={Colors.backgroundDark} fill={Colors.backgroundDark} />
              <Text style={styles.levelText}>LEVEL {PROFILE_DATA.level}</Text>
            </View>
          </View>
          <Text style={styles.profileName}>{PROFILE_DATA.name}</Text>
          <Text style={styles.profileTitle}>{PROFILE_DATA.title}</Text>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{PROFILE_DATA.stats.cookTime}</Text>
            <Text style={styles.statLabel}>COOK TIME</Text>
          </View>
          <View style={[styles.statCard, styles.statCardHighlight]}>
            <Text style={[styles.statValue, styles.statValueHighlight]}>
              {PROFILE_DATA.stats.accuracy}
            </Text>
            <Text style={styles.statLabel}>ACCURACY</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{PROFILE_DATA.stats.recipes}</Text>
            <Text style={styles.statLabel}>RECIPES</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earned Badges</Text>
            <TouchableOpacity onPress={() => router.push("/achievements")}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => (
              <View
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.unlocked && styles.badgeCardLocked,
                ]}
              >
                <View style={[styles.badgeIcon, { backgroundColor: badge.bgColor }]}>
                  <badge.icon size={20} color={badge.color} />
                </View>
                <View style={styles.badgeInfo}>
                  <Text
                    style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]}
                    numberOfLines={1}
                  >
                    {badge.name}
                  </Text>
                  <Text
                    style={[styles.badgeDesc, !badge.unlocked && styles.badgeDescLocked]}
                    numberOfLines={1}
                  >
                    {badge.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>My Shared Recipes</Text>
          <View style={styles.recipesGrid}>
            {SHARED_RECIPES.map((recipe) => (
              <Pressable key={recipe.id} style={styles.recipeCard}>
                <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
              </Pressable>
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.settingsCard} activeOpacity={0.8}>
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
    paddingBottom: 32,
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
    marginTop: 16,
  },
  recipeCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
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
