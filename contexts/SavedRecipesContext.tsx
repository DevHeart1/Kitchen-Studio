import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { SavedRecipe, GeneratedRecipe } from "@/types";
import { useGamification } from "@/contexts/GamificationContext";
import { supabase, DbSavedRecipe } from "@/lib/supabase";

// Interfaces moved to @/types

const STORAGE_KEY = "saved_recipes";
const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes("your-project");
};

// Convert DB recipe to frontend recipe
const dbToFrontend = (item: DbSavedRecipe): SavedRecipe => ({
  id: item.id,
  title: item.title,
  videoThumbnail: item.video_thumbnail || "",
  videoDuration: item.video_duration || "",
  ingredients: item.ingredients || [],
  instructions: item.instructions || [],
  savedAt: item.saved_at,
});

export const [SavedRecipesProvider, useSavedRecipes] = createContextHook(() => {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { awardXP } = useGamification();
  const useSupabase = isSupabaseConfigured();

  useEffect(() => {
    loadSavedRecipes();
  }, []);

  const loadSavedRecipes = async () => {
    try {
      if (useSupabase) {
        const { data, error } = await supabase
          .from("saved_recipes")
          .select("*")
          .order("saved_at", { ascending: false });

        if (error) {
          console.error("[SavedRecipes] Supabase error:", error.message);
          await loadFromAsyncStorage();
        } else {
          setSavedRecipes((data || []).map(dbToFrontend));
        }
      } else {
        await loadFromAsyncStorage();
      }
    } catch (error) {
      console.log("Error loading saved recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromAsyncStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedRecipes(JSON.parse(stored));
      }
    } catch (error) {
      console.log("Error loading from AsyncStorage:", error);
    }
  };

  const saveRecipe = useCallback(async (recipe: Omit<SavedRecipe, "id" | "savedAt">) => {
    try {
      if (useSupabase) {
        const { data, error } = await supabase
          .from("saved_recipes")
          .insert({
            user_id: DEMO_USER_ID,
            title: recipe.title,
            video_thumbnail: recipe.videoThumbnail,
            video_duration: recipe.videoDuration,
            ingredients: recipe.ingredients,
            instructions: recipe.instructions,
          })
          .select()
          .single();

        if (error) {
          console.error("[SavedRecipes] Insert error:", error.message);
          return false;
        }

        const newRecipe = dbToFrontend(data);
        setSavedRecipes((prev) => [newRecipe, ...prev]);
        console.log("Recipe saved successfully:", newRecipe.title);
        return true;
      } else {
        const newRecipe: SavedRecipe = {
          ...recipe,
          id: Date.now().toString(),
          savedAt: new Date().toISOString(),
        };

        const updated = [newRecipe, ...savedRecipes];
        setSavedRecipes(updated);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log("Recipe saved successfully:", newRecipe.title);
        awardXP("save_recipe");
        return true;
      }
    } catch (error) {
      console.log("Error saving recipe:", error);
      return false;
    }
  }, [savedRecipes, useSupabase]);

  const removeRecipe = useCallback(async (recipeId: string) => {
    try {
      if (useSupabase) {
        const { error } = await supabase
          .from("saved_recipes")
          .delete()
          .eq("id", recipeId);

        if (error) {
          console.error("[SavedRecipes] Delete error:", error.message);
          return false;
        }

        setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        console.log("Recipe removed successfully");
        return true;
      } else {
        const updated = savedRecipes.filter((r) => r.id !== recipeId);
        setSavedRecipes(updated);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log("Recipe removed successfully");
        return true;
      }
    } catch (error) {
      console.log("Error removing recipe:", error);
      return false;
    }
  }, [savedRecipes, useSupabase]);

  const isRecipeSaved = useCallback((title: string) => {
    return savedRecipes.some((r) => r.title === title);
  }, [savedRecipes]);

  return useMemo(() => ({
    savedRecipes,
    isLoading,
    saveRecipe,
    removeRecipe,
    isRecipeSaved,
    refreshSavedRecipes: loadSavedRecipes,
  }), [savedRecipes, isLoading, saveRecipe, removeRecipe, isRecipeSaved]);
});
