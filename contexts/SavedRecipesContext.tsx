import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

export interface SavedRecipe {
  id: string;
  title: string;
  videoThumbnail: string;
  videoDuration: string;
  readinessPercent: number;
  totalIngredients: number;
  readyIngredients: number;
  savedAt: string;
}

const STORAGE_KEY = "saved_recipes";

export const [SavedRecipesProvider, useSavedRecipes] = createContextHook(() => {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Error loading saved recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveRecipe = useCallback(async (recipe: Omit<SavedRecipe, "id" | "savedAt">) => {
    const newRecipe: SavedRecipe = {
      ...recipe,
      id: Date.now().toString(),
      savedAt: new Date().toISOString(),
    };
    
    const updated = [newRecipe, ...savedRecipes];
    setSavedRecipes(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("Recipe saved successfully:", newRecipe.title);
      return true;
    } catch (error) {
      console.log("Error saving recipe:", error);
      return false;
    }
  }, [savedRecipes]);

  const removeRecipe = useCallback(async (recipeId: string) => {
    const updated = savedRecipes.filter((r) => r.id !== recipeId);
    setSavedRecipes(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("Recipe removed successfully");
      return true;
    } catch (error) {
      console.log("Error removing recipe:", error);
      return false;
    }
  }, [savedRecipes]);

  const isRecipeSaved = useCallback((title: string) => {
    return savedRecipes.some((r) => r.title === title);
  }, [savedRecipes]);

  return useMemo(() => ({
    savedRecipes,
    isLoading,
    saveRecipe,
    removeRecipe,
    isRecipeSaved,
  }), [savedRecipes, isLoading, saveRecipe, removeRecipe, isRecipeSaved]);
});
