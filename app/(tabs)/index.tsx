import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChefHat,
  Clock,
  Flame,
  BookOpen,
  ArrowRight,
  Sparkles,
  Package,
  AlertTriangle,
  Play,
  RefreshCw,
  Search,
  ScanLine,
  Link,
  ChevronRight,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import Header from "@/components/Header";
import LinkInput from "@/components/LinkInput";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";
import { useInventory } from "@/contexts/InventoryContext";
import { RecentCook } from "@/types";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { savedRecipes, isLoading: recipesLoading } = useSavedRecipes();
  const { cookingSessions, inProgressSessions, completedSessions } = useCookingHistory();
  const { inventory, getTotalCount } = useInventory();

  const expiringItems = useMemo(() => {
    return inventory.filter((item) => item.status === "expiring");
  }, [inventory]);

  const handleConvert = (url: string) => {
    console.log("Converting URL:", url);
  };

  const handleViewAllRecentCooks = () => {
    router.push("/recent-cooks");
  };

  const handleCookPress = (cook: RecentCook) => {
    router.push({
      pathname: "/cook-session",
      params: { id: cook.id },
    });
  };

  const handleRecipePress = () => {
    router.push("/recipe");
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getGoalMessage = () => {
    if (!profile.primaryGoal) return "What would you like to make?";
    switch (profile.primaryGoal) {
      case "eat-healthy":
        return "Focusing on nutritious meals today.";
      case "save-money":
        return "Budget-friendly recipes selected for you.";
      case "learn-new":
        return "Explore new techniques and flavors.";
      default:
        return "What would you like to make?";
    }
  };

  const statsData = useMemo(() => {
    return {
      totalCooks: cookingSessions.length,
      inProgress: inProgressSessions.length,
      completed: completedSessions.length,
      pantryItems: getTotalCount,
      savedCount: savedRecipes.length,
    };
  }, [cookingSessions, inProgressSessions, completedSessions, getTotalCount, savedRecipes]);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        <View style={styles.headlineSection}>
          <Text style={styles.greeting}>
            {getGreeting()},{" "}
            <Text style={styles.nameAccent}>
              {profile.name.split(" ")[0]}
            </Text>
          </Text>
          <Text style={styles.userTitle}>{profile.title}</Text>
          <Text style={styles.headline}>
            Ready to cook something{" "}
            <Text style={styles.headlineAccent}>delicious?</Text>
          </Text>
          <Text style={styles.goalMessage}>{getGoalMessage()}</Text>
        </View>

        <LinkInput onConvert={handleConvert} />

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statChip}>
            <Flame size={14} color={Colors.orange} />
            <Text style={styles.statChipText}>
              {statsData.totalCooks} cook{statsData.totalCooks !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.statChip}>
            <BookOpen size={14} color={Colors.primary} />
            <Text style={styles.statChipText}>
              {statsData.savedCount} saved
            </Text>
          </View>
          <View style={styles.statChip}>
            <Package size={14} color="#8b5cf6" />
            <Text style={styles.statChipText}>
              {statsData.pantryItems} in pantry
            </Text>
          </View>
        </View>

        {/* Expiring Items Alert */}
        {expiringItems.length > 0 && (
          <TouchableOpacity
            style={styles.alertCard}
            onPress={() => router.push("/inventory")}
            activeOpacity={0.8}
          >
            <View style={styles.alertIconContainer}>
              <AlertTriangle size={20} color={Colors.orange} />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {expiringItems.length} item{expiringItems.length !== 1 ? "s" : ""} expiring soon
              </Text>
              <Text style={styles.alertSubtitle} numberOfLines={1}>
                {expiringItems.map((i) => i.name).join(", ")}
              </Text>
            </View>
            <ArrowRight size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}

        {/* In-Progress Sessions */}
        {inProgressSessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continue Cooking</Text>
              {inProgressSessions.length > 1 && (
                <TouchableOpacity onPress={handleViewAllRecentCooks}>
                  <Text style={styles.viewAllText}>View all</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.continueList}>
              {inProgressSessions.slice(0, 2).map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={styles.continueCard}
                  onPress={() => handleCookPress(session)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: session.image }}
                    style={styles.continueImage}
                  />
                  <View style={styles.continueContent}>
                    <Text style={styles.continueTitle} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${session.progress}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {session.progress}%
                      </Text>
                    </View>
                    <Text style={styles.continueStep}>
                      Step {session.currentStep} of {session.totalSteps}
                    </Text>
                  </View>
                  <View style={styles.playButton}>
                    <Play
                      size={18}
                      color={Colors.primary}
                      fill={Colors.primary}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Saved Recipes */}
        {savedRecipes.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Recipes</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/kitchen")}>
                <Text style={styles.viewAllText}>
                  {savedRecipes.length} saved
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recipesScroll}
            >
              {savedRecipes.slice(0, 8).map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={handleRecipePress}
                  activeOpacity={0.85}
                >
                  <View style={styles.recipeImageContainer}>
                    {recipe.videoThumbnail ? (
                      <Image
                        source={{ uri: recipe.videoThumbnail }}
                        style={styles.recipeImage}
                      />
                    ) : (
                      <View style={styles.recipeImagePlaceholder}>
                        <ChefHat size={28} color={Colors.textMuted} />
                      </View>
                    )}
                    {recipe.videoDuration ? (
                      <View style={styles.durationBadge}>
                        <Clock size={10} color={Colors.white} />
                        <Text style={styles.durationText}>
                          {recipe.videoDuration}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.recipeTitle} numberOfLines={2}>
                    {recipe.title}
                  </Text>
                  <Text style={styles.recipeIngredients}>
                    {recipe.ingredients.length} ingredient
                    {recipe.ingredients.length !== 1 ? "s" : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Recent Completed Cooks */}
        {completedSessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Cooks</Text>
              <TouchableOpacity onPress={handleViewAllRecentCooks}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentList}>
              {completedSessions.slice(0, 3).map((cook) => (
                <TouchableOpacity
                  key={cook.id}
                  style={styles.recentCard}
                  onPress={() => handleCookPress(cook)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: cook.image }}
                    style={styles.recentImage}
                  />
                  <View style={styles.recentContent}>
                    <Text style={styles.recentTitle} numberOfLines={1}>
                      {cook.title}
                    </Text>
                    <Text style={styles.recentMeta}>
                      {cook.completedDate || formatTimeAgo(cook.startedAt)}
                    </Text>
                  </View>
                  <View style={styles.restartButton}>
                    <RefreshCw size={16} color={Colors.textMuted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Empty State */}
        {savedRecipes.length === 0 &&
          cookingSessions.length === 0 &&
          !recipesLoading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIllustration}>
                <View style={styles.emptyMainCircle}>
                  <View style={styles.emptyInnerCircle}>
                    <Sparkles size={36} color={Colors.primary} />
                  </View>
                </View>
                <View style={[styles.emptyOrb, styles.emptyOrbRight]}>
                  <ChefHat size={15} color={Colors.orange} />
                </View>
                <View style={[styles.emptyOrb, styles.emptyOrbLeft]}>
                  <BookOpen size={13} color="#8b5cf6" />
                </View>
              </View>
              <Text style={styles.emptyTitle}>Your kitchen awaits</Text>
              <Text style={styles.emptySubtitle}>
                Start your cooking journey by adding recipes or scanning pantry items.
              </Text>

              <View style={styles.emptyActionsContainer}>
                <TouchableOpacity
                  style={styles.emptyActionRow}
                  onPress={() => router.push("/(tabs)/discover")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.emptyActionIcon, { backgroundColor: Colors.primary + '1A' }]}>
                    <Search size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.emptyActionTextContainer}>
                    <Text style={styles.emptyActionTitle}>Discover Recipes</Text>
                    <Text style={styles.emptyActionDesc}>Personalized to your taste</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emptyActionRow}
                  onPress={() => router.push("/scanner")}
                  activeOpacity={0.8}
                >
                  <View style={[styles.emptyActionIcon, { backgroundColor: Colors.orange + '1A' }]}>
                    <ScanLine size={20} color={Colors.orange} />
                  </View>
                  <View style={styles.emptyActionTextContainer}>
                    <Text style={styles.emptyActionTitle}>Scan Your Pantry</Text>
                    <Text style={styles.emptyActionDesc}>Track ingredients automatically</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.emptyActionRow}
                  activeOpacity={0.8}
                >
                  <View style={[styles.emptyActionIcon, { backgroundColor: '#8b5cf6' + '1A' }]}>
                    <Link size={20} color="#8b5cf6" />
                  </View>
                  <View style={styles.emptyActionTextContainer}>
                    <Text style={styles.emptyActionTitle}>Paste a Link</Text>
                    <Text style={styles.emptyActionDesc}>Convert any recipe URL above</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}

        {recipesLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headlineSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
    fontWeight: "500" as const,
  },
  nameAccent: {
    color: Colors.white,
    fontWeight: "700" as const,
  },
  userTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700" as const,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  headline: {
    fontSize: 30,
    fontWeight: "700" as const,
    color: Colors.white,
    lineHeight: 38,
    letterSpacing: -0.5,
    maxWidth: "90%",
  },
  headlineAccent: {
    color: Colors.primary,
  },
  goalMessage: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    marginTop: 8,
  },
  quickStats: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  statChipText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.orangeBg,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.3)",
  },
  alertIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(249, 115, 22, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.orange,
  },
  alertSubtitle: {
    fontSize: 12,
    color: "rgba(249, 115, 22, 0.7)",
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  continueList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  continueCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.primary + "30",
    gap: 12,
  },
  continueImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  continueContent: {
    flex: 1,
  },
  continueTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  continueStep: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "25",
    alignItems: "center",
    justifyContent: "center",
  },
  recipesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  recipeCard: {
    width: 160,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  recipeImageContainer: {
    width: "100%",
    height: 110,
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: Colors.surfaceDark,
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  recipeTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.white,
    paddingHorizontal: 10,
    paddingTop: 10,
    lineHeight: 17,
  },
  recipeIngredients: {
    fontSize: 11,
    color: Colors.textMuted,
    paddingHorizontal: 10,
    paddingBottom: 10,
    paddingTop: 4,
  },
  recentList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    gap: 12,
  },
  recentImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  recentContent: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  recentMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600" as const,
  },
  restartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  emptyIllustration: {
    width: 150,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative" as const,
  },
  emptyMainCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary + "25",
  },
  emptyInnerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyOrb: {
    position: "absolute" as const,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.cardGlass,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyOrbRight: {
    top: 16,
    right: 4,
  },
  emptyOrbLeft: {
    bottom: 20,
    left: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 280,
  },
  emptyActionsContainer: {
    width: "100%",
    gap: 10,
  },
  emptyActionRow: {
    flexDirection: "row" as const,
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    gap: 14,
  },
  emptyActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActionTextContainer: {
    flex: 1,
  },
  emptyActionTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  emptyActionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
});
