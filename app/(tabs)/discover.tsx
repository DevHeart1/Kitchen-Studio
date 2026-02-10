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
import { calculateRecipeMatch } from "@/services/RecipeMatcherService";
import { Recipe, RecipeIngredient } from "@/types/recipe";

// Map internal DiscoverRecipe to the global Recipe type for matching
export interface DiscoverRecipe extends Recipe {
  id: string; // Ensure string ID
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
  { id: "pantry", name: "Pantry Match", icon: <Sparkles size={20} color={Colors.primary} />, color: Colors.primary + "20" },
];

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

export async function extractRecipeFromImage(imageUri: string): Promise<DiscoverRecipe | null> {
  if (!GEMINI_API_KEY) {
    console.log("[Discover] No Gemini API key found");
    return null;
  }

  try {
    const prompt = `Analyze this food image and extract the detailed recipe. Return ONLY a JSON object with this structure: { title, description (max 80 chars), cookTime, difficulty (Easy/Medium/Hard), calories, tags (2-3 tags), ingredients: [{ name: string, amount: number, unit: string, originalString: string, unsplashPhotoId: string }], instructions: [{ step: number, text: string, time: optional number in seconds }], cuisine: string }. Do not include markdown code blocks.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                // { inline_data: { mime_type: "image/jpeg", data: base64Image } } 
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log("Gemini extraction failed no data");
      return null;
    }

    const text = data.candidates[0].content.parts[0].text;
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const recipe = JSON.parse(jsonStr);

    return {
      id: Date.now().toString(),
      image: imageUri,
      ...recipe,
      // Ensure ingredients match structure if needed, though prompt asks for it correctly
      ingredients: recipe.ingredients.map((ing: any) => ({
        ...ing,
        // Map unsplashPhotoId to image if present for consistency with our type
        image: ing.unsplashPhotoId ? `https://images.unsplash.com/${ing.unsplashPhotoId}` : undefined
      }))
    } as DiscoverRecipe;

  } catch (error) {
    console.error("Gemini extraction error:", error);
    return null;
  }
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
  if (!GEMINI_API_KEY) {
    console.log("[Discover] No Gemini API key found");
    return [];
  }

  const dietStr = preferences.dietaryPreferences?.length
    ? `Dietary restrictions: ${preferences.dietaryPreferences.join(", ")}.`
    : "";
  const levelStr = preferences.cookingLevel
    ? `Cooking skill level: ${preferences.cookingLevel}.`
    : "";
  const goalStr = preferences.primaryGoal
    ? `Primary cooking goal: ${preferences.primaryGoal}.`
    : "";
  const pantryStr = preferences.pantryItems.length
    ? `Available pantry items: ${preferences.pantryItems.slice(0, 15).join(", ")}.`
    : "";

  let categoryPrompt = "";
  switch (category) {
    case "quick":
      categoryPrompt = "Focus on recipes that take 30 minutes or less.";
      break;
    case "healthy":
      categoryPrompt = "Focus on nutritious, low-calorie, wholesome recipes.";
      break;
    case "trending":
      categoryPrompt = "Focus on popular, trendy recipes from 2025-2026 food trends like smash burgers, birria, ube desserts, or viral TikTok recipes.";
      break;
    case "comfort":
      categoryPrompt = "Focus on hearty comfort food like pasta, stews, baked dishes, and homestyle meals.";
      break;
    case "pantry":
      categoryPrompt = `Focus on recipes that can be made with these pantry items: ${preferences.pantryItems.slice(0, 15).join(", ")}. Prioritize recipes using available ingredients.`;
      break;
    default:
      categoryPrompt = "Suggest a diverse mix of popular recipes.";
  }

  const prompt = `Generate exactly 6 recipe suggestions as a JSON array. ${categoryPrompt} ${dietStr} ${levelStr} ${goalStr} ${pantryStr}

  Each recipe must have:
  - title: string
  - description: string (max 80 chars)
  - cookTime: string (e.g. "25 min")
  - difficulty: "Easy" | "Medium" | "Hard"
  - calories: string
  - tags: string[]
  - cuisine: string (e.g. "Mexican", "Nigerian")
  - ingredients: { name: string, amount: number, unit: string, originalString: string }[] (e.g. {name: "Rice", amount: 2, unit: "cups", originalString: "2 cups Rice"})
  - instructions: { step: number, text: string, time?: number }[]

  Return ONLY the JSON array.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2500, // Increased for detailed JSON
          },
        }),
      }
    );

    if (!response.ok) {
      console.log("[Discover] Gemini API error:", response.status);
      return [];
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const recipes = JSON.parse(cleaned) as DiscoverRecipe[];

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
    if (!searchQuery.trim() || !GEMINI_API_KEY) return;
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate 4 recipe suggestions for: "${searchQuery}". Return ONLY a JSON array. Each recipe: { "title": string, "description": string (max 80 chars), "cookTime": string, "difficulty": string, "calories": string, "tags": string[], "ingredients": {name: string, amount: number, unit: string, originalString: string, unsplashPhotoId?: string}[], "instructions": { "step": number, "text": string, "time": number }[], "cuisine": string }`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
          }),
        }
      );
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      const parsed = JSON.parse(cleaned) as any[];

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
          ingredients: r.ingredients.map((ing: any) => ({
            id: `ing-${Math.random()}`,
            name: ing.name,
            amount: Number(ing.amount) || 0,
            unit: ing.unit || "pcs",
            originalString: ing.originalString || `${ing.amount} ${ing.unit} ${ing.name}`,
            image: ing.unsplashPhotoId ? `https://images.unsplash.com/${ing.unsplashPhotoId}` : undefined
          }))
        })) as DiscoverRecipe[]
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
          id: ing.id || `ing-${idx}`,
          name: ing.name,
          amount: `${ing.amount} ${ing.unit}`,
          image: ing.image || "",
        })),
        instructions: recipe.instructions,
      });
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
                {GEMINI_API_KEY
                  ? "No recipes found. Pull down to refresh."
                  : "Add your Gemini API key to discover recipes."}
              </Text>
            </View>
          ) : (
            <Animated.View style={[styles.recipesGrid, { opacity: fadeAnim }]}>
              {displayRecipes.map((recipe) => {
                const matchInfo = calculateRecipeMatch(recipe, inventory);

                return (
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

                      {/* Match Badge */}
                      <View style={[styles.matchBadge, {
                        backgroundColor: matchInfo.canCook ? Colors.green : (matchInfo.matchPercentage > 70 ? Colors.orange : Colors.surfaceLight)
                      }]}>
                        <Sparkles size={12} color={Colors.white} />
                        <Text style={styles.matchText}>
                          {matchInfo.canCook ? "Cook Now" : `${matchInfo.matchPercentage}% Match`}
                        </Text>
                      </View>

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

                      {/* Missing Ingredients Summary */}
                      {!matchInfo.canCook && matchInfo.missingIngredients.length > 0 && (
                        <Text style={styles.missingCountText}>
                          Missing: {matchInfo.missingIngredients.slice(0, 2).join(", ")} {matchInfo.missingIngredients.length > 2 ? `+${matchInfo.missingIngredients.length - 2} more` : ""}
                        </Text>
                      )}

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
                )
              })}
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
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  recipesGrid: {
    gap: 16,
  },
  recipeCard: {
    backgroundColor: Colors.cardGlass,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.cardGlassBorder,
  },
  recipeImageWrapper: {
    height: 180,
    width: "100%",
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
    height: "100%",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  recipeBookmarkBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(30, 30, 30, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  recipeInfo: {
    padding: 16,
    gap: 8,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
    lineHeight: 24,
  },
  recipeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  recipeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  recipeMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeMetaText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500" as const,
  },
  recipeMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  recipeDifficulty: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tagText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  matchBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    zIndex: 10,
  },
  matchText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  missingCountText: {
    fontSize: 12,
    color: Colors.red,
    marginTop: 4,
    marginBottom: 4,
    fontWeight: "600"
  },
});
