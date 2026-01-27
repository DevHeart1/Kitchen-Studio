import React, { useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Stack } from "expo-router";
import {
  ArrowLeft,
  Clock,
  Users,
  Flame,
  ChefHat,
  Check,
  X,
  ShoppingCart,
  Sparkles,
  Filter,
  ChevronDown,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useInventory } from "@/contexts/InventoryContext";
import { PANTRY_RECIPES, PantryRecipe } from "@/mocks/pantryRecipes";

interface RecipeWithMatch extends PantryRecipe {
  matchPercentage: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

type FilterType = "all" | "ready" | "almost" | "partial";

export default function PantryRecipesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { checkIngredientInPantry } = useInventory();
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithMatch | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  const recipesWithMatch = useMemo(() => {
    return PANTRY_RECIPES.map((recipe) => {
      const matchedIngredients: string[] = [];
      const missingIngredients: string[] = [];

      recipe.ingredients.forEach((ingredient) => {
        const result = checkIngredientInPantry(ingredient.name);
        if (result.found || result.hasSubstitute) {
          matchedIngredients.push(ingredient.name);
        } else {
          missingIngredients.push(ingredient.name);
        }
      });

      const matchPercentage = Math.round(
        (matchedIngredients.length / recipe.ingredients.length) * 100
      );

      return {
        ...recipe,
        matchPercentage,
        matchedIngredients,
        missingIngredients,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [checkIngredientInPantry]);

  const filteredRecipes = useMemo(() => {
    switch (filter) {
      case "ready":
        return recipesWithMatch.filter((r) => r.matchPercentage === 100);
      case "almost":
        return recipesWithMatch.filter((r) => r.matchPercentage >= 75 && r.matchPercentage < 100);
      case "partial":
        return recipesWithMatch.filter((r) => r.matchPercentage >= 50 && r.matchPercentage < 75);
      default:
        return recipesWithMatch;
    }
  }, [recipesWithMatch, filter]);

  const stats = useMemo(() => ({
    ready: recipesWithMatch.filter((r) => r.matchPercentage === 100).length,
    almost: recipesWithMatch.filter((r) => r.matchPercentage >= 75 && r.matchPercentage < 100).length,
    partial: recipesWithMatch.filter((r) => r.matchPercentage >= 50 && r.matchPercentage < 75).length,
  }), [recipesWithMatch]);

  const getMatchColor = useCallback((percentage: number) => {
    if (percentage === 100) return Colors.primary;
    if (percentage >= 75) return Colors.yellow;
    if (percentage >= 50) return Colors.orange;
    return Colors.red;
  }, []);

  const getMatchLabel = useCallback((percentage: number) => {
    if (percentage === 100) return "Ready to Cook";
    if (percentage >= 75) return "Almost Ready";
    if (percentage >= 50) return "Partial Match";
    return "Need Items";
  }, []);

  const handleRecipePress = useCallback((recipe: RecipeWithMatch) => {
    setSelectedRecipe(recipe);
  }, []);

  const handleStartCooking = useCallback(() => {
    setSelectedRecipe(null);
    router.push("/cook-session");
  }, [router]);

  const renderRecipeCard = useCallback((recipe: RecipeWithMatch) => {
    const matchColor = getMatchColor(recipe.matchPercentage);
    
    return (
      <TouchableOpacity
        key={recipe.id}
        style={styles.recipeCard}
        onPress={() => handleRecipePress(recipe)}
        activeOpacity={0.8}
      >
        <View style={styles.recipeImageContainer}>
          <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
          <View style={styles.recipeOverlay} />
          <View style={[styles.matchBadge, { backgroundColor: matchColor }]}>
            <Text style={styles.matchBadgeText}>{recipe.matchPercentage}%</Text>
          </View>
          <View style={styles.timeBadge}>
            <Clock size={12} color={Colors.white} />
            <Text style={styles.timeBadgeText}>{recipe.cookTime}</Text>
          </View>
        </View>
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeTitle} numberOfLines={2}>
            {recipe.title}
          </Text>
          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <Users size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{recipe.servings}</Text>
            </View>
            <View style={styles.metaItem}>
              <Flame size={12} color={Colors.textMuted} />
              <Text style={styles.metaText}>{recipe.calories} cal</Text>
            </View>
          </View>
          <View style={styles.matchProgress}>
            <View style={styles.matchProgressBg}>
              <View
                style={[
                  styles.matchProgressFill,
                  { width: `${recipe.matchPercentage}%`, backgroundColor: matchColor },
                ]}
              />
            </View>
            <Text style={[styles.matchLabel, { color: matchColor }]}>
              {getMatchLabel(recipe.matchPercentage)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getMatchColor, getMatchLabel, handleRecipePress]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Sparkles size={20} color={Colors.primary} />
          <Text style={styles.headerTitle}>Cook from Pantry</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsContainer}>
          <View style={styles.statsCard}>
            <View style={styles.statsGlow} />
            <Text style={styles.statsTitle}>Recipes You Can Make</Text>
            <Text style={styles.statsSubtitle}>Based on your pantry inventory</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.statValue}>{stats.ready}</Text>
                <Text style={styles.statLabel}>Ready</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: Colors.yellow }]} />
                <Text style={styles.statValue}>{stats.almost}</Text>
                <Text style={styles.statLabel}>Almost</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: Colors.orange }]} />
                <Text style={styles.statValue}>{stats.partial}</Text>
                <Text style={styles.statLabel}>Partial</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            <TouchableOpacity
              style={[styles.filterChip, filter === "all" && styles.filterChipActive]}
              onPress={() => setFilter("all")}
            >
              <Text style={[styles.filterChipText, filter === "all" && styles.filterChipTextActive]}>
                All ({recipesWithMatch.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === "ready" && styles.filterChipActive]}
              onPress={() => setFilter("ready")}
            >
              <View style={[styles.filterDot, { backgroundColor: Colors.primary }]} />
              <Text style={[styles.filterChipText, filter === "ready" && styles.filterChipTextActive]}>
                Ready ({stats.ready})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === "almost" && styles.filterChipActive]}
              onPress={() => setFilter("almost")}
            >
              <View style={[styles.filterDot, { backgroundColor: Colors.yellow }]} />
              <Text style={[styles.filterChipText, filter === "almost" && styles.filterChipTextActive]}>
                Almost ({stats.almost})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, filter === "partial" && styles.filterChipActive]}
              onPress={() => setFilter("partial")}
            >
              <View style={[styles.filterDot, { backgroundColor: Colors.orange }]} />
              <Text style={[styles.filterChipText, filter === "partial" && styles.filterChipTextActive]}>
                Partial ({stats.partial})
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.recipesGrid}>
          {filteredRecipes.map(renderRecipeCard)}
        </View>

        {filteredRecipes.length === 0 && (
          <View style={styles.emptyState}>
            <ChefHat size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No recipes found</Text>
            <Text style={styles.emptySubtitle}>
              Try a different filter or add more items to your pantry
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedRecipe !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedRecipe(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedRecipe(null)}
            >
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>

            {selectedRecipe && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={{ uri: selectedRecipe.image }}
                      style={styles.modalImage}
                    />
                    <View style={styles.modalImageOverlay} />
                    <View
                      style={[
                        styles.modalMatchBadge,
                        { backgroundColor: getMatchColor(selectedRecipe.matchPercentage) },
                      ]}
                    >
                      <Text style={styles.modalMatchText}>
                        {selectedRecipe.matchPercentage}% Match
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.modalTitle}>{selectedRecipe.title}</Text>
                  <View style={styles.modalMeta}>
                    <View style={styles.modalMetaItem}>
                      <Clock size={14} color={Colors.textMuted} />
                      <Text style={styles.modalMetaText}>{selectedRecipe.cookTime}</Text>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <Users size={14} color={Colors.textMuted} />
                      <Text style={styles.modalMetaText}>{selectedRecipe.servings} servings</Text>
                    </View>
                    <View style={styles.modalMetaItem}>
                      <ChefHat size={14} color={Colors.textMuted} />
                      <Text style={styles.modalMetaText}>{selectedRecipe.difficulty}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.ingredientsSection}>
                  <Text style={styles.ingredientsSectionTitle}>Ingredients</Text>
                  
                  {selectedRecipe.matchedIngredients.length > 0 && (
                    <View style={styles.ingredientGroup}>
                      <View style={styles.ingredientGroupHeader}>
                        <Check size={16} color={Colors.primary} />
                        <Text style={styles.ingredientGroupTitle}>
                          In Your Pantry ({selectedRecipe.matchedIngredients.length})
                        </Text>
                      </View>
                      {selectedRecipe.matchedIngredients.map((ing, idx) => (
                        <View key={idx} style={styles.ingredientItem}>
                          <View style={[styles.ingredientDot, { backgroundColor: Colors.primary }]} />
                          <Text style={styles.ingredientName}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {selectedRecipe.missingIngredients.length > 0 && (
                    <View style={styles.ingredientGroup}>
                      <View style={styles.ingredientGroupHeader}>
                        <ShoppingCart size={16} color={Colors.orange} />
                        <Text style={styles.ingredientGroupTitle}>
                          Need to Buy ({selectedRecipe.missingIngredients.length})
                        </Text>
                      </View>
                      {selectedRecipe.missingIngredients.map((ing, idx) => (
                        <View key={idx} style={styles.ingredientItem}>
                          <View style={[styles.ingredientDot, { backgroundColor: Colors.orange }]} />
                          <Text style={[styles.ingredientName, styles.missingIngredient]}>{ing}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.modalActions}>
                  {selectedRecipe.matchPercentage === 100 ? (
                    <TouchableOpacity
                      style={styles.startCookingButton}
                      onPress={handleStartCooking}
                    >
                      <Sparkles size={20} color={Colors.backgroundDark} />
                      <Text style={styles.startCookingText}>Start Cooking</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.addToListButton}
                      onPress={() => setSelectedRecipe(null)}
                    >
                      <ShoppingCart size={20} color={Colors.white} />
                      <Text style={styles.addToListText}>Add Missing to Shopping List</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: Colors.backgroundDark,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    overflow: "hidden",
  },
  statsGlow: {
    position: "absolute",
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary + "33",
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterChipActive: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary,
  },
  filterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: Colors.primary,
  },
  recipesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  recipeCard: {
    width: "48%",
    backgroundColor: Colors.cardGlass,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  recipeImageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  matchBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  timeBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  timeBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  recipeInfo: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
    lineHeight: 18,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  matchProgress: {
    gap: 6,
  },
  matchProgressBg: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  matchProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  matchLabel: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.backgroundDark,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    maxHeight: "90%",
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
    marginBottom: 24,
  },
  modalImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  modalImage: {
    width: "100%",
    height: "100%",
  },
  modalImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  modalMatchBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  modalMatchText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
    textAlign: "center",
    marginBottom: 12,
  },
  modalMeta: {
    flexDirection: "row",
    gap: 16,
  },
  modalMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modalMetaText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  ingredientsSection: {
    marginBottom: 24,
  },
  ingredientsSectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 16,
  },
  ingredientGroup: {
    marginBottom: 16,
  },
  ingredientGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  ingredientGroupTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 6,
  },
  ingredientDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ingredientName: {
    fontSize: 14,
    color: Colors.white,
  },
  missingIngredient: {
    color: Colors.textMuted,
  },
  modalActions: {
    gap: 12,
  },
  startCookingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startCookingText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  addToListButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.orange,
    paddingVertical: 16,
    borderRadius: 16,
  },
  addToListText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
});
