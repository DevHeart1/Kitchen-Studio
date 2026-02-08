import React, { useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Settings,
  Package,
  Clock,
  Sparkles,
  ChevronRight,
  Plus,
  ScanLine,
  Bookmark,
  Play,
  Trash2,
  ShoppingBasket,
  Search,
  ChefHat,
  AlertTriangle,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSavedRecipes, SavedRecipe } from "@/contexts/SavedRecipesContext";
import { useInventory } from "@/contexts/InventoryContext";

export default function KitchenScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savedRecipes, removeRecipe } = useSavedRecipes();
  const { inventory, checkIngredientInPantry, getTotalCount, getExpiringCount } = useInventory();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    if (getTotalCount === 0 && savedRecipes.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
    }
  }, [getTotalCount, savedRecipes.length]);

  const inventoryCategories = useMemo(() => {
    const catMap: Record<string, { count: number; items: typeof inventory }> = {};
    inventory.forEach((item) => {
      if (!catMap[item.category]) {
        catMap[item.category] = { count: 0, items: [] };
      }
      catMap[item.category].count++;
      catMap[item.category].items.push(item);
    });

    return Object.entries(catMap).map(([name, data]) => {
      const expiring = data.items.filter((i) => i.status === "expiring");
      const low = data.items.filter((i) => i.status === "low");
      let note = "All good";
      if (expiring.length > 0) note = `${expiring[0].name} expiring`;
      else if (low.length > 0) note = `${low[0].name} low stock`;

      return {
        id: name,
        name,
        count: data.count,
        note,
        hasWarning: expiring.length > 0 || low.length > 0,
      };
    });
  }, [inventory]);

  const calculateRecipeReadiness = useCallback((recipe: SavedRecipe) => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      return { readyCount: 0, totalCount: 0, readinessPercent: 0 };
    }

    let readyCount = 0;
    recipe.ingredients.forEach((ingredient) => {
      const pantryCheck = checkIngredientInPantry(ingredient.name);
      if (pantryCheck.found) {
        readyCount++;
      }
    });

    const totalCount = recipe.ingredients.length;
    const readinessPercent = Math.round((readyCount / totalCount) * 100);
    return { readyCount, totalCount, readinessPercent };
  }, [checkIngredientInPantry]);

  const recipesWithReadiness = useMemo(() => {
    return savedRecipes.map((recipe) => ({
      ...recipe,
      ...calculateRecipeReadiness(recipe),
    }));
  }, [savedRecipes, calculateRecipeReadiness]);

  const handleScanItems = () => {
    router.push("/scanner");
  };

  const handleRecipePress = (recipe: SavedRecipe) => {
    router.push("/recipe");
  };

  const handleRemoveRecipe = (recipeId: string) => {
    removeRecipe(recipeId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const isFullyEmpty = getTotalCount === 0 && savedRecipes.length === 0;

  const renderFullEmptyState = () => (
    <Animated.View
      style={[
        styles.fullEmptyContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.emptyHeroSection}>
        <View style={styles.emptyIllustration}>
          <Animated.View
            style={[
              styles.emptyMainCircle,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.emptyInnerCircle}>
              <ChefHat size={48} color={Colors.primary} />
            </View>
          </Animated.View>

          <View style={[styles.floatingOrb, styles.orbTopRight]}>
            <Package size={18} color={Colors.orange} />
          </View>
          <View style={[styles.floatingOrb, styles.orbBottomLeft]}>
            <Bookmark size={16} color="#8b5cf6" />
          </View>
          <View style={[styles.floatingOrb, styles.orbTopLeft]}>
            <Sparkles size={14} color={Colors.primary} />
          </View>
        </View>

        <Text style={styles.emptyHeroTitle}>Your kitchen is ready</Text>
        <Text style={styles.emptyHeroSubtitle}>
          Start by scanning items in your pantry or saving recipes you love. We{"'"}ll help you cook smarter.
        </Text>
      </View>

      <View style={styles.emptyActionsGrid}>
        <TouchableOpacity
          style={styles.emptyActionCard}
          onPress={handleScanItems}
          activeOpacity={0.8}
        >
          <View style={[styles.emptyActionIcon, { backgroundColor: Colors.primary + "1A" }]}>
            <ScanLine size={24} color={Colors.primary} />
          </View>
          <Text style={styles.emptyActionTitle}>Scan Pantry</Text>
          <Text style={styles.emptyActionDesc}>Add items by scanning barcodes or receipts</Text>
          <View style={styles.emptyActionArrow}>
            <ChevronRight size={16} color={Colors.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emptyActionCard}
          onPress={() => router.push("/(tabs)/discover")}
          activeOpacity={0.8}
        >
          <View style={[styles.emptyActionIcon, { backgroundColor: Colors.orange + "1A" }]}>
            <Search size={24} color={Colors.orange} />
          </View>
          <Text style={styles.emptyActionTitle}>Find Recipes</Text>
          <Text style={styles.emptyActionDesc}>Discover and save recipes tailored to you</Text>
          <View style={styles.emptyActionArrow}>
            <ChevronRight size={16} color={Colors.orange} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emptyActionCard}
          onPress={() => router.push("/manual-add" as never)}
          activeOpacity={0.8}
        >
          <View style={[styles.emptyActionIcon, { backgroundColor: "#8b5cf6" + "1A" }]}>
            <Plus size={24} color="#8b5cf6" />
          </View>
          <Text style={styles.emptyActionTitle}>Add Manually</Text>
          <Text style={styles.emptyActionDesc}>Type in ingredients you already have</Text>
          <View style={styles.emptyActionArrow}>
            <ChevronRight size={16} color="#8b5cf6" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.emptyTipCard}>
        <View style={styles.tipIconContainer}>
          <Sparkles size={16} color={Colors.primary} />
        </View>
        <Text style={styles.tipText}>
          Scan your grocery receipt right after shopping to keep your pantry always up to date.
        </Text>
      </View>
    </Animated.View>
  );

  const renderEmptyRecipes = () => (
    <View style={styles.emptySection}>
      <View style={styles.emptySectionIcon}>
        <Bookmark size={28} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptySectionTitle}>No saved recipes yet</Text>
      <Text style={styles.emptySectionDesc}>
        Discover recipes or paste a link to start building your collection.
      </Text>
      <TouchableOpacity
        style={styles.emptySectionButton}
        onPress={() => router.push("/(tabs)/discover")}
        activeOpacity={0.8}
      >
        <Search size={16} color={Colors.backgroundDark} />
        <Text style={styles.emptySectionButtonText}>Explore Recipes</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyInventory = () => (
    <View style={styles.emptySection}>
      <View style={styles.emptySectionIcon}>
        <ShoppingBasket size={28} color={Colors.textMuted} />
      </View>
      <Text style={styles.emptySectionTitle}>Pantry is empty</Text>
      <Text style={styles.emptySectionDesc}>
        Scan or add items to track what{"'"}s in your kitchen.
      </Text>
      <TouchableOpacity
        style={[styles.emptySectionButton, { backgroundColor: Colors.primary }]}
        onPress={handleScanItems}
        activeOpacity={0.8}
      >
        <ScanLine size={16} color={Colors.backgroundDark} />
        <Text style={styles.emptySectionButtonText}>Scan Items</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Kitchen</Text>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push("/settings")}>
            <Settings size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {isFullyEmpty ? (
          renderFullEmptyState()
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={styles.statCardGlow} />
                <View style={styles.statIconContainer}>
                  <Package size={24} color={Colors.primary} />
                </View>
                <Text style={styles.statLabel}>In Stock</Text>
                <Text style={styles.statValue}>{getTotalCount}</Text>
                {getTotalCount > 0 ? (
                  <Text style={styles.statNote}>
                    {inventoryCategories.length} {inventoryCategories.length === 1 ? "category" : "categories"}
                  </Text>
                ) : (
                  <Text style={[styles.statNote, { color: Colors.textMuted }]}>No items yet</Text>
                )}
              </View>
              <View style={styles.statCard}>
                <View style={[styles.statCardGlow, styles.orangeGlow]} />
                <View style={styles.statIconContainer}>
                  <Clock size={24} color={getExpiringCount > 0 ? Colors.orange : Colors.textMuted} />
                </View>
                <Text style={styles.statLabel}>Expiring Soon</Text>
                <Text style={styles.statValue}>{getExpiringCount}</Text>
                {getExpiringCount > 0 ? (
                  <Text style={[styles.statNote, styles.orangeText]}>
                    Check your items
                  </Text>
                ) : (
                  <Text style={[styles.statNote, { color: Colors.textMuted }]}>All fresh</Text>
                )}
              </View>
            </View>

            {recipesWithReadiness.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleRow}>
                    <Bookmark size={20} color={Colors.primary} />
                    <Text style={styles.sectionTitle}>Saved Recipes</Text>
                  </View>
                  <Text style={styles.savedCount}>{recipesWithReadiness.length} saved</Text>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.savedRecipesScroll}
                >
                  {recipesWithReadiness.map((recipe) => (
                    <TouchableOpacity
                      key={recipe.id}
                      style={styles.savedRecipeCard}
                      onPress={() => handleRecipePress(recipe)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.savedRecipeImageContainer}>
                        <Image
                          source={{ uri: recipe.videoThumbnail }}
                          style={styles.savedRecipeImage}
                        />
                        <View style={styles.savedRecipeOverlay} />
                        <View style={styles.playIconContainer}>
                          <Play size={16} color={Colors.white} fill={Colors.white} />
                        </View>
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={() => handleRemoveRecipe(recipe.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Trash2 size={14} color={Colors.white} />
                        </TouchableOpacity>
                        {recipe.videoDuration ? (
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationText}>{recipe.videoDuration}</Text>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.savedRecipeInfo}>
                        <Text style={styles.savedRecipeTitle} numberOfLines={2}>
                          {recipe.title}
                        </Text>
                        <View style={styles.savedRecipeMeta}>
                          <View style={styles.readinessIndicator}>
                            <View
                              style={[
                                styles.readinessDot,
                                { backgroundColor: recipe.readinessPercent >= 80 ? Colors.primary : Colors.orange },
                              ]}
                            />
                            <Text style={styles.readinessText}>
                              {recipe.readinessPercent}% ready
                            </Text>
                          </View>
                          <Text style={styles.savedDateText}>
                            {formatDate(recipe.savedAt)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View style={styles.section}>
                {renderEmptyRecipes()}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Inventory</Text>
                {inventory.length > 0 && (
                  <TouchableOpacity onPress={() => router.push("/inventory")}>
                    <Text style={styles.manageText}>Manage</Text>
                  </TouchableOpacity>
                )}
              </View>
              {inventoryCategories.length > 0 ? (
                <>
                  <View style={styles.inventoryList}>
                    {inventoryCategories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={styles.inventoryCard}
                        onPress={() => router.push("/inventory")}
                      >
                        <View
                          style={[
                            styles.inventoryIcon,
                            {
                              backgroundColor: category.hasWarning
                                ? Colors.orangeBg
                                : Colors.greenBg,
                            },
                          ]}
                        >
                          {category.hasWarning ? (
                            <AlertTriangle size={24} color={Colors.orange} />
                          ) : (
                            <Package size={24} color={Colors.green} />
                          )}
                        </View>
                        <View style={styles.inventoryInfo}>
                          <Text style={styles.inventoryName}>{category.name}</Text>
                          <Text style={styles.inventoryNote}>
                            {category.count} item{category.count !== 1 ? "s" : ""} · {category.note}
                          </Text>
                        </View>
                        <ChevronRight size={20} color={Colors.textMuted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity style={styles.scanButton} onPress={handleScanItems}>
                    <ScanLine size={20} color={Colors.white} />
                    <Text style={styles.scanButtonText}>Scan More Items</Text>
                  </TouchableOpacity>
                </>
              ) : (
                renderEmptyInventory()
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
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
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.cardGlassLight,
    borderRadius: 24,
    padding: 20,
    height: 144,
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statCardGlow: {
    position: "absolute",
    right: -16,
    top: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + "33",
  },
  orangeGlow: {
    backgroundColor: Colors.orange + "33",
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: "500" as const,
  },
  statValue: {
    fontSize: 40,
    fontWeight: "700" as const,
    color: Colors.white,
    marginTop: -4,
  },
  statNote: {
    fontSize: 10,
    fontWeight: "700" as const,
    color: Colors.primary,
    marginTop: 4,
  },
  orangeText: {
    color: Colors.orange,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  manageText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  savedCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  savedRecipesScroll: {
    paddingRight: 16,
    gap: 12,
  },
  savedRecipeCard: {
    width: 200,
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  savedRecipeImageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  savedRecipeImage: {
    width: "100%",
    height: "100%",
  },
  savedRecipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  playIconContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -16 }, { translateY: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  savedRecipeInfo: {
    padding: 12,
  },
  savedRecipeTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
    lineHeight: 18,
  },
  savedRecipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  readinessIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  readinessDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  readinessText: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: Colors.textMuted,
  },
  savedDateText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  inventoryList: {
    gap: 12,
  },
  inventoryCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  inventoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  inventoryNote: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  scanButton: {
    marginTop: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  fullEmptyContainer: {
    paddingTop: 8,
  },
  emptyHeroSection: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  emptyIllustration: {
    width: 180,
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    position: "relative",
  },
  emptyMainCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: Colors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.primary + "25",
  },
  emptyInnerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primary + "1A",
    alignItems: "center",
    justifyContent: "center",
  },
  floatingOrb: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardGlass,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  orbTopRight: {
    top: 12,
    right: 4,
  },
  orbBottomLeft: {
    bottom: 16,
    left: 8,
  },
  orbTopLeft: {
    top: 36,
    left: 0,
  },
  emptyHeroTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptyHeroSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  emptyActionsGrid: {
    gap: 12,
    marginBottom: 24,
  },
  emptyActionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardGlass,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    gap: 14,
  },
  emptyActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyActionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  emptyActionDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
    marginTop: 2,
  },
  emptyActionArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Colors.primary + "10",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.primary + "20",
  },
  tipIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + "1A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    flex: 1,
  },
  emptySection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: Colors.cardGlassLight,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  emptySectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptySectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 6,
  },
  emptySectionDesc: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
    maxWidth: 260,
  },
  emptySectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptySectionButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
});
