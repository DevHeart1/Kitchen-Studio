import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Search,
  Sparkles,
  Clock,
  Flame,
  Leaf,
  ChefHat,
  TrendingUp,
  Heart,
  Bookmark,
  X,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import { useGamification } from "@/contexts/GamificationContext";

export interface DiscoverRecipe {
  id: string;
  title: string;
  description: string;
  cookTime: string;
  difficulty: string;
  calories: string;
  image: string;
  tags: string[];
  ingredients: { name: string; amount?: string; unsplashPhotoId?: string }[];
  instructions: { step: number; text: string; time?: number }[];
}

interface RecipeCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORIES: RecipeCategory[] = [
  { id: "quick", name: "Quick & Easy", icon: <Clock size={20} color={Colors.orange} />, color: Colors.orangeBg },
  { id: "healthy", name: "Healthy", icon: <Leaf size={20} color={Colors.green} />, color: Colors.greenBg },
  { id: "trending", name: "Trending", icon: <TrendingUp size={20} color="#8b5cf6" />, color: "rgba(139, 92, 246, 0.15)" },
  { id: "comfort", name: "Comfort Food", icon: <Heart size={20} color={Colors.red} />, color: Colors.redBg },
];

import { supabase } from "@/lib/supabase";


export async function extractRecipeFromImage(imageUri: string): Promise<DiscoverRecipe | null> {
  console.log("[Discover] Image extraction not implemented.");
  return null;
}

import { extractRecipeFromVideoUrl } from '@/services/RecipeExtractionService';

// Re-export for compatibility if needed, or simply remove if not used elsewhere directly
export { extractRecipeFromVideoUrl };


async function fetchRecipesFromGemini(
  category: string,
  preferences: {
    cookingLevel?: string;
    dietaryPreferences?: string[];
    primaryGoal?: string;
    pantryItems: string[];
  }
): Promise<DiscoverRecipe[]> {
  try {
    const { data, error } = await supabase.functions.invoke("discover-recipes", {
      body: {
        mode: "discover",
        category,
        preferences: {
          level: preferences.cookingLevel,
          dietary: preferences.dietaryPreferences,
          goal: preferences.primaryGoal,
          pantry: preferences.pantryItems,
        },
      },
    });

    if (error) throw error;

    const recipes = (data?.recipes || []) as any[];

    const FOOD_IMAGES = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
    ];

    return recipes.map((r, i) => ({
      ...r,
      id: `${category}-${Date.now()}-${i}`,
      image: FOOD_IMAGES[i % FOOD_IMAGES.length],
    }));
  } catch (error) {
    console.log("[Discover] Error fetching recipes:", error);
    return [];
  }
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { inventory } = useInventory();
  const { saveRecipe, isRecipeSaved } = useSavedRecipes();
  const { awardXP } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState("quick");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DiscoverRecipe[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const pantryItems = inventory.map((i) => i.name);

  const {
    data: recipes = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["discover-recipes", selectedCategory, profile.cookingLevel, profile.dietaryPreferences, profile.primaryGoal, pantryItems],
    queryFn: () =>
      fetchRecipesFromGemini(selectedCategory, {
        cookingLevel: profile.cookingLevel,
        dietaryPreferences: profile.dietaryPreferences,
        primaryGoal: profile.primaryGoal,
        pantryItems,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: pantryRecipes = [],
  } = useQuery({
    queryKey: ["pantry-suggestions", pantryItems.slice(0, 10).join(","), profile.cookingLevel, profile.dietaryPreferences, profile.primaryGoal, pantryItems],
    queryFn: () =>
      fetchRecipesFromGemini("pantry", {
        cookingLevel: profile.cookingLevel,
        dietaryPreferences: profile.dietaryPreferences,
        primaryGoal: profile.primaryGoal,
        pantryItems,
      }),
    staleTime: 10 * 60 * 1000,
    enabled: pantryItems.length > 0,
  });

  const handleCategoryChange = useCallback((catId: string) => {
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setSelectedCategory(catId);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      const { data, error } = await supabase.functions.invoke("discover-recipes", {
        body: {
          mode: "search",
          query: searchQuery,
        },
      });

      if (error) throw error;

      const parsed = (data?.recipes || []) as any[];
      const SEARCH_IMAGES = [
        "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400&h=300&fit=crop",
        "https://images.unsplash.com/photo-1432139509613-5c4255a1d82f?w=400&h=300&fit=crop",
      ];

      setSearchResults(
        parsed.map((r, i) => ({
          ...r,
          id: `search-${Date.now()}-${i}`,
          image: SEARCH_IMAGES[i % SEARCH_IMAGES.length],
        }))
      );
    } catch (error) {
      console.log("[Discover] Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSaveRecipe = useCallback(
    async (recipe: DiscoverRecipe) => {
      if (isRecipeSaved(recipe.title)) return;
      await saveRecipe({
        title: recipe.title,
        videoThumbnail: recipe.image,
        videoDuration: recipe.cookTime,
        ingredients: recipe.ingredients.map((ing, idx) => ({
          id: `ing-${idx}`,
          name: ing.name,
          amount: ing.amount || "",
          image: ing.unsplashPhotoId
            ? `https://images.unsplash.com/${ing.unsplashPhotoId}?auto=format&fit=crop&w=200&q=80`
            : "",
        })),
        instructions: recipe.instructions,
      });
      awardXP("save_recipe");
      console.log("[Discover] Saved recipe:", recipe.title);
    },
    [saveRecipe, isRecipeSaved]
  );

  const displayRecipes = searchQuery.trim() && searchResults.length > 0 ? searchResults : recipes;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return Colors.green;
      case "medium":
        return Colors.orange;
      case "hard":
        return Colors.red;
      default:
        return Colors.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Colors.primary}
          />
        }
      >
        <View style={styles.headerSection}>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>
            Personalized recipes based on your preferences
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes, cuisines, ingredients..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {isSearching && (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.searchingText}>Searching recipes...</Text>
          </View>
        )}

        {/* Categories */}
        {!searchQuery.trim() && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat.id && styles.categoryChipActive,
                ]}
                onPress={() => handleCategoryChange(cat.id)}
                activeOpacity={0.7}
              >
                {cat.icon}
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Pantry-Based Suggestions */}
        {!searchQuery.trim() && pantryRecipes.length > 0 && (
          <View style={styles.pantrySection}>
            <View style={styles.pantrySectionHeader}>
              <View style={styles.pantryTitleRow}>
                <Sparkles size={18} color={Colors.primary} />
                <Text style={styles.pantrySectionTitle}>
                  From Your Pantry
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push("/pantry-recipes")}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pantryRecipesScroll}
            >
              {pantryRecipes.slice(0, 4).map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.pantryRecipeCard}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: recipe.image }}
                    style={styles.pantryRecipeImage}
                  />
                  <View style={styles.pantryRecipeOverlay} />
                  <View style={styles.pantryRecipeContent}>
                    <View style={styles.pantryBadge}>
                      <Text style={styles.pantryBadgeText}>
                        {recipe.cookTime}
                      </Text>
                    </View>
                    <Text style={styles.pantryRecipeTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.saveIconButton}
                    onPress={() => handleSaveRecipe(recipe)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Bookmark
                      size={16}
                      color={
                        isRecipeSaved(recipe.title)
                          ? Colors.primary
                          : Colors.white
                      }
                      fill={
                        isRecipeSaved(recipe.title)
                          ? Colors.primary
                          : "transparent"
                      }
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Recipe Grid */}
        <View style={styles.recipesSection}>
          {!searchQuery.trim() && (
            <View style={styles.recipesSectionHeader}>
              <Text style={styles.recipesSectionTitle}>
                {CATEGORIES.find((c) => c.id === selectedCategory)?.name ??
                  "Recipes"}
              </Text>
              <TouchableOpacity onPress={() => refetch()}>
                <Text style={styles.seeAllText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>
                Finding recipes for you...
              </Text>
            </View>
          ) : displayRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ChefHat size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>
                {"Pull down to refresh recipes."}
              </Text>
            </View>
          ) : (
            <Animated.View style={[styles.recipesGrid, { opacity: fadeAnim }]}>
              {displayRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.recipeImageWrapper}>
                    <Image
                      source={{ uri: recipe.image }}
                      style={styles.recipeImage}
                    />
                    <View style={styles.recipeImageGradient} />
                    <TouchableOpacity
                      style={styles.recipeBookmarkBtn}
                      onPress={() => handleSaveRecipe(recipe)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Bookmark
                        size={16}
                        color={
                          isRecipeSaved(recipe.title)
                            ? Colors.primary
                            : Colors.white
                        }
                        fill={
                          isRecipeSaved(recipe.title)
                            ? Colors.primary
                            : "transparent"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeTitle} numberOfLines={2}>
                      {recipe.title}
                    </Text>
                    <Text style={styles.recipeDescription} numberOfLines={2}>
                      {recipe.description}
                    </Text>
                    <View style={styles.recipeMeta}>
                      <View style={styles.recipeMetaItem}>
                        <Clock size={12} color={Colors.textMuted} />
                        <Text style={styles.recipeMetaText}>
                          {recipe.cookTime}
                        </Text>
                      </View>
                      <View style={styles.recipeMetaDot} />
                      <Text
                        style={[
                          styles.recipeDifficulty,
                          {
                            color: getDifficultyColor(recipe.difficulty),
                          },
                        ]}
                      >
                        {recipe.difficulty}
                      </Text>
                      <View style={styles.recipeMetaDot} />
                      <View style={styles.recipeMetaItem}>
                        <Flame size={12} color={Colors.orange} />
                        <Text style={styles.recipeMetaText}>
                          {recipe.calories}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.tagRow}>
                      {recipe.tags.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </View>
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
    flexGrow: 1,
  },
  headerSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    backgroundColor: Colors.cardGlass,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.white,
    padding: 0,
  },
  searchingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
  },
  searchingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: Colors.cardGlass,
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary + "20",
    borderColor: Colors.primary + "50",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
  },
  categoryTextActive: {
    color: Colors.primary,
  },
  pantrySection: {
    marginBottom: 8,
  },
  pantrySectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  pantryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pantrySectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  pantryRecipesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  pantryRecipeCard: {
    width: 200,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  pantryRecipeImage: {
    width: "100%",
    height: "100%",
  },
  pantryRecipeOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  pantryRecipeContent: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  pantryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  pantryBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  pantryRecipeTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
    lineHeight: 18,
  },
  saveIconButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  recipesSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  recipesSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  recipesSectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
  },
  recipesGrid: {
    gap: 14,
  },
  recipeCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  recipeImageWrapper: {
    width: "100%",
    height: 160,
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeImageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  recipeBookmarkBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  recipeInfo: {
    padding: 14,
  },
  recipeTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
    lineHeight: 22,
  },
  recipeDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  recipeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "500" as const,
  },
  recipeMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
  },
  recipeDifficulty: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
});
