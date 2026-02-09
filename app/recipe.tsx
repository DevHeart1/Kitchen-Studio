import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Share2,
  CheckCircle,
  Play,
  Box,
  Info,
  Bookmark,
  BookmarkCheck,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { useSavedRecipes, RecipeIngredient } from "@/contexts/SavedRecipesContext";
import { useInventory } from "@/contexts/InventoryContext";
import { extractRecipeFromVideoUrl, DiscoverRecipe } from "./(tabs)/discover";
import { ActivityIndicator } from "react-native";

interface Ingredient {
  id: string;
  name: string;
  amount: string;
  image: string;
  status: "in_pantry" | "substitute" | "missing";
  substituteSuggestion?: string;
}

const BASE_INGREDIENTS: RecipeIngredient[] = [];

const RECIPE_TITLE = "Recipe Details";
const VIDEO_THUMBNAIL = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400";
const VIDEO_DURATION = "--:--";

const COMMON_INGREDIENT_IMAGES: Record<string, string> = {
  onion: "photo-1508747703725-719777637510",
  garlic: "photo-1581065114138-16477dbe8f66",
  salt: "photo-1615485290382-441e4d019cb0",
  pepper: "photo-1606787366850-de6330128bfc",
  oil: "photo-1474979266404-7eaacbadb8c5",
  water: "photo-1548839140-29a749e1cf4d",
  chicken: "photo-1587593810167-a84920ea0781",
  beef: "photo-1588168333986-5078d3ae3971",
  tomato: "photo-1518977676601-b53f02bad177",
  lettuce: "photo-1622205313162-be1d5712a43f",
  cheese: "photo-1486297678162-eb2a19b0a32d",
  egg: "photo-1582722872445-44c507c31885",
  flour: "photo-1509440159596-0249088772ff",
  sugar: "photo-1581441363689-1f3c3c414635",
  milk: "photo-1563636619-e910009355dc",
  butter: "photo-1589985270826-4b7bb135bc9d",
  bread: "photo-1509440159596-0249088772ff",
  rice: "photo-1586201375761-83865001e31c",
  pasta: "photo-1473093226795-af9932fe5856",
};

const getUnsplashImage = (name: string, photoId?: string) => {
  if (photoId) {
    return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=200&q=80`;
  }

  const lowerName = name.toLowerCase();
  for (const [key, id] of Object.entries(COMMON_INGREDIENT_IMAGES)) {
    if (lowerName.includes(key)) {
      return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=200&q=80`;
    }
  }

  return "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=200&q=80";
};

export default function RecipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, recipeData, videoUrl } = useLocalSearchParams<{ id: string; recipeData: string; videoUrl: string }>();
  const { savedRecipes, saveRecipe, isRecipeSaved } = useSavedRecipes();
  const { checkIngredientInPantry } = useInventory();

  const [isSaving, setIsSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractedRecipe, setExtractedRecipe] = useState<DiscoverRecipe | null>(null);

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [manualIngredients, setManualIngredients] = useState<RecipeIngredient[] | null>(null);

  // Parse recipeData if provided (from Discovery tab)
  const parsedRecipeData = useMemo(() => {
    if (recipeData) {
      try {
        return JSON.parse(recipeData) as DiscoverRecipe;
      } catch {
        return null;
      }
    }
    return null;
  }, [recipeData]);

  // Extract recipe from video URL using Gemini
  React.useEffect(() => {
    if (videoUrl && !id && !recipeData) {
      extractFromVideoUrl(videoUrl);
    }
  }, [videoUrl, id, recipeData]);

  const extractFromVideoUrl = async (url: string) => {
    setIsLoading(true);
    setExtractionError(null);
    try {
      const result = await extractRecipeFromVideoUrl(url);
      if (result) {
        setExtractedRecipe(result);
      } else {
        setExtractionError("Failed to extract recipe from video. Please try again.");
      }
    } catch (err) {
      setExtractionError("An error occurred during extraction.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Priority: ID (saved) > recipeData (from discovery) > extractedRecipe (from video URL)
  const savedRecipe = savedRecipes.find((r) => r.id === id);
  const activeRecipe = savedRecipe || parsedRecipeData || extractedRecipe;

  // For data mapping
  const currentTitle = activeRecipe?.title || (isLoading ? "Analyzing video..." : RECIPE_TITLE);
  const currentThumbnail = (activeRecipe as any)?.image || (activeRecipe as any)?.videoThumbnail || VIDEO_THUMBNAIL;
  const currentDuration = (activeRecipe as any)?.cookTime || (activeRecipe as any)?.videoDuration || VIDEO_DURATION;

  // Map ingredients from DiscoverRecipe (strings) or SavedRecipe (RecipeIngredient[])
  const rawIngredients: RecipeIngredient[] = useMemo(() => {
    // If user has manually edited, use those
    if (manualIngredients) return manualIngredients;

    if (parsedRecipeData || extractedRecipe) {
      const source = parsedRecipeData || extractedRecipe;
      return (source?.ingredients || []).map((ing, idx: number) => {
        const name = typeof ing === "string" ? ing : ing.name;
        const amount = typeof ing === "string" ? "" : (ing.amount || "");
        const photoId = typeof ing === "string" ? undefined : ing.unsplashPhotoId;

        return {
          id: `dyn-${idx}`,
          name,
          amount,
          image: getUnsplashImage(name, photoId),
        };
      });
    }
    return savedRecipe?.ingredients || BASE_INGREDIENTS;
  }, [parsedRecipeData, extractedRecipe, savedRecipe, manualIngredients]);

  const currentIngredients = rawIngredients;

  const ingredients = useMemo((): Ingredient[] => {
    return currentIngredients.map((baseIngredient) => {
      const pantryCheck = checkIngredientInPantry(baseIngredient.name);

      let status: Ingredient["status"];
      let substituteSuggestion = baseIngredient.substituteSuggestion;

      if (pantryCheck.found) {
        status = "in_pantry";
        substituteSuggestion = undefined;
      } else if (pantryCheck.hasSubstitute && pantryCheck.substituteItem) {
        status = "substitute";
        substituteSuggestion = substituteSuggestion || `Use ${pantryCheck.substituteItem.name}`;
      } else {
        status = "missing";
      }

      return {
        ...baseIngredient,
        status,
        substituteSuggestion,
      };
    });
  }, [checkIngredientInPantry, currentIngredients]);

  const readyCount = ingredients.filter((i) => i.status === "in_pantry").length;
  const totalCount = ingredients.length;
  const readinessPercent = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;
  const isSaved = isRecipeSaved(currentTitle);

  const handleSaveForLater = async () => {
    if (isSaved) {
      setShowSaveModal(true);
      return;
    }

    setIsSaving(true);
    const success = await saveRecipe({
      title: currentTitle,
      videoThumbnail: currentThumbnail,
      videoDuration: currentDuration,
      ingredients: currentIngredients,
      instructions: activeRecipe?.instructions || savedRecipe?.instructions,
    });
    setIsSaving(false);

    if (success) {
      setShowSaveModal(true);
    }
  };

  const handleOpenEditModal = () => {
    setManualIngredients(rawIngredients);
    setIsEditModalVisible(true);
  };

  const addIngredientToEdit = () => {
    if (manualIngredients) {
      setManualIngredients([
        ...manualIngredients,
        {
          id: `new-${Date.now()}`,
          name: "",
          amount: "",
          image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=100&q=80",
        },
      ]);
    }
  };

  const removeIngredientFromEdit = (id: string) => {
    if (manualIngredients) {
      setManualIngredients(manualIngredients.filter((ing) => ing.id !== id));
    }
  };

  const updateIngredientInEdit = (id: string, field: "name" | "amount", value: string) => {
    if (manualIngredients) {
      setManualIngredients(
        manualIngredients.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
      );
    }
  };

  const handleSaveEdit = () => {
    setIsEditModalVisible(false);
  };

  const getStatusColor = (status: Ingredient["status"]) => {
    switch (status) {
      case "in_pantry":
        return Colors.primary;
      case "substitute":
        return "#EAB308";
      case "missing":
        return "#EF4444";
    }
  };

  const getStatusText = (status: Ingredient["status"]) => {
    switch (status) {
      case "in_pantry":
        return "IN PANTRY";
      case "substitute":
        return "SUBSTITUTE";
      case "missing":
        return "MISSING";
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <BookmarkCheck size={32} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>
              {isSaved ? "Already Saved" : "Recipe Saved!"}
            </Text>
            <Text style={styles.modalMessage}>
              {isSaved
                ? "This recipe is already in your saved recipes."
                : "You can find this recipe in your Kitchen under Saved Recipes."}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowSaveModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe & Pantry Check</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Share2 size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Analyzing recipe with Gemini AI...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.videoCard}>
            <View style={styles.videoThumbnail}>
              <Image
                source={{ uri: currentThumbnail }}
                style={styles.thumbnailImage}
              />
              <View style={styles.playOverlay}>
                <Play size={20} color={Colors.white} fill={Colors.white} />
              </View>
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={1}>
                {currentTitle}
              </Text>
              <Text style={styles.videoMeta}>{currentDuration} • Extracted via AI</Text>
            </View>
          </View>

          <View style={styles.readinessSection}>
            <View style={styles.readinessHeader}>
              <Text style={styles.readinessLabel}>Pantry Readiness</Text>
              <Text style={styles.readinessPercent}>{readinessPercent}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${readinessPercent}%` }]}
              />
            </View>
            <View style={styles.readinessStatus}>
              <CheckCircle size={14} color={Colors.primary} />
              <Text style={styles.readinessText}>
                {readyCount}/{totalCount} ingredients ready
              </Text>
            </View>
          </View>

          <View style={styles.ingredientsHeader}>
            <Text style={styles.ingredientsTitle}>Extracted Ingredients</Text>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>AI Verified</Text>
            </View>
          </View>

          <View style={styles.ingredientsList}>
            {ingredients.map((ingredient) => {
              const isClickable = ingredient.status === "substitute" || ingredient.status === "missing";
              const CardWrapper = isClickable ? TouchableOpacity : View;
              const cardProps = isClickable ? {
                onPress: () => router.push({
                  pathname: "/substitution",
                  params: {
                    id: ingredient.id,
                    name: ingredient.name,
                    amount: ingredient.amount,
                    image: ingredient.image
                  },
                }),
                activeOpacity: 0.7,
                testID: `ingredient-${ingredient.id}`,
              } : {};

              return (
                <CardWrapper
                  key={ingredient.id}
                  style={[
                    styles.ingredientCard,
                    ingredient.status === "substitute" && styles.substituteCard,
                    ingredient.status === "missing" && styles.missingCard,
                  ]}
                  {...cardProps}
                >
                  <View style={styles.ingredientMain}>
                    <View style={styles.ingredientLeft}>
                      <Image
                        source={{ uri: ingredient.image }}
                        style={[
                          styles.ingredientImage,
                          ingredient.status !== "in_pantry" &&
                          styles.ingredientImageFaded,
                        ]}
                      />
                      <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientAmount}>
                          {ingredient.amount}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.ingredientRight}>
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(ingredient.status) },
                        ]}
                      >
                        {getStatusText(ingredient.status)}
                      </Text>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: `${getStatusColor(ingredient.status)}33`,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDotInner,
                            { backgroundColor: getStatusColor(ingredient.status) },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  {ingredient.substituteSuggestion && (
                    <View
                      style={[
                        styles.suggestionBox,
                        {
                          backgroundColor: `${getStatusColor(ingredient.status)}15`,
                          borderColor: `${getStatusColor(ingredient.status)}20`,
                        },
                      ]}
                    >
                      <Info size={14} color={getStatusColor(ingredient.status)} />
                      <Text
                        style={[
                          styles.suggestionText,
                          { color: getStatusColor(ingredient.status) },
                        ]}
                      >
                        AI suggests: {ingredient.substituteSuggestion}
                      </Text>
                    </View>
                  )}
                </CardWrapper>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/ar-cooking",
                params: { id: id || (activeRecipe as any)?.id },
              })
            }
            testID="start-ar-cooking-button"
          >
            <Box size={20} color={Colors.backgroundDark} />
            <Text style={styles.primaryButtonText}>Start AR Cooking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveButton,
              isSaved && styles.saveButtonSaved,
            ]}
            activeOpacity={0.8}
            onPress={handleSaveForLater}
            disabled={isSaving}
            testID="save-for-later-button"
          >
            {isSaved ? (
              <BookmarkCheck size={20} color={Colors.primary} />
            ) : (
              <Bookmark size={20} color={Colors.white} />
            )}
            <Text style={[
              styles.saveButtonText,
              isSaved && styles.saveButtonTextSaved,
            ]}>
              {isSaving ? "Saving..." : isSaved ? "Saved" : "Save for Later"}
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={handleOpenEditModal}>
          <Text style={styles.editLink}>Edit Ingredients List</Text>
        </TouchableOpacity>
      </View>

      {/* Ingredient Edit Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Edit Ingredients</Text>
                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <X size={24} color={Colors.white} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editModalList} showsVerticalScrollIndicator={false}>
                {manualIngredients?.map((ing) => (
                  <View key={ing.id} style={styles.editIngredientRow}>
                    <View style={styles.editInputs}>
                      <TextInput
                        style={styles.editInputName}
                        placeholder="Ingredient name"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={ing.name}
                        onChangeText={(text) => updateIngredientInEdit(ing.id, "name", text)}
                      />
                      <TextInput
                        style={styles.editInputAmount}
                        placeholder="Amount (e.g. 2 tbsp)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={ing.amount}
                        onChangeText={(text) => updateIngredientInEdit(ing.id, "amount", text)}
                      />
                    </View>
                    <TouchableOpacity
                      onPress={() => removeIngredientFromEdit(ing.id)}
                      style={styles.removeBtn}
                    >
                      <Trash2 size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addIngredientToEdit}>
                  <Plus size={20} color={Colors.primary} />
                  <Text style={styles.addBtnText}>Add Ingredient</Text>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.editModalFooter}>
                <TouchableOpacity
                  style={[styles.modalButton, { width: "100%" }]}
                  onPress={handleSaveEdit}
                >
                  <Text style={styles.modalButtonText}>Done Editing</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    paddingBottom: 8,
    backgroundColor: "rgba(16, 34, 21, 0.8)",
  },
  headerButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  videoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 12,
  },
  videoThumbnail: {
    width: 96,
    height: 64,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    color: "#92c9a0",
  },
  readinessSection: {
    marginTop: 20,
    gap: 12,
  },
  readinessHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  readinessLabel: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  readinessPercent: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  progressBar: {
    height: 12,
    backgroundColor: "#32673f",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  readinessStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  readinessText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#92c9a0",
  },
  ingredientsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 16,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  aiBadge: {
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiBadgeText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  substituteCard: {
    borderColor: "rgba(234, 179, 8, 0.3)",
  },
  missingCard: {
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  ingredientMain: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ingredientLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  ingredientImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  ingredientImageFaded: {
    opacity: 0.5,
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 2,
  },
  ingredientAmount: {
    fontSize: 13,
    color: "#92c9a0",
  },
  ingredientRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  suggestionBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
    flex: 1,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
    alignItems: "center",
    backgroundColor: Colors.backgroundDark,
  },
  footerButtons: {
    width: "100%",
    flexDirection: "row",
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 9999,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  saveButtonSaved: {
    backgroundColor: "rgba(43, 238, 91, 0.1)",
    borderColor: Colors.primary + "40",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  saveButtonTextSaved: {
    color: Colors.primary,
  },
  editLink: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#92c9a0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.cardDark,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(43, 238, 91, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.white,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    color: "#92c9a0",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 9999,
    minWidth: 140,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.backgroundDark,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  editModalContent: {
    backgroundColor: "#162215",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: "85%",
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(43, 238, 91, 0.2)",
    borderBottomWidth: 0,
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  editModalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  editModalList: {
    flex: 1,
  },
  editIngredientRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  editInputs: {
    flex: 1,
    gap: 8,
  },
  editInputName: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
    padding: 0,
  },
  editInputAmount: {
    fontSize: 14,
    color: "#92c9a0",
    padding: 0,
  },
  removeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 12,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(43, 238, 91, 0.05)",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.primary + "40",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 40,
    gap: 8,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.primary,
  },
  editModalFooter: {
    paddingTop: 16,
  },
});
