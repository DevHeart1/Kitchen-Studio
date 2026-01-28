// API client for fetching AI-generated starter recipes
import { supabase } from "./supabase";

export interface StarterRecipe {
    id: string;
    name: string;
    description: string;
    image: string;
    cookTime: number;
    calories: number;
    difficulty: "Beginner" | "Intermediate" | "Advanced";
    matchPercentage: number;
    isArGuided: boolean;
    tags: string[];
}

export interface UserPreferences {
    cookingLevel: "beginner" | "intermediate" | "pro";
    dietaryPreferences: string[];
    primaryGoal: "eat-healthy" | "save-money" | "learn-new";
}

interface StarterRecipesResponse {
    recipes: StarterRecipe[];
    success: boolean;
    error?: string;
}

export interface StarterRecipesResult {
    recipes: StarterRecipe[];
    error: string | null;
}

export async function getStarterRecipes(preferences: UserPreferences): Promise<StarterRecipesResult> {
    try {
        console.log("[StarterRecipes] Fetching AI recommendations for:", preferences);

        const { data, error } = await supabase.functions.invoke<StarterRecipesResponse>(
            "get-starter-recipes",
            {
                body: { preferences },
            }
        );

        if (error) {
            console.error("[StarterRecipes] Edge function error:", error);
            return {
                recipes: [],
                error: "Failed to connect to AI service. Please check your connection and try again.",
            };
        }

        if (data?.recipes && data.recipes.length > 0) {
            console.log("[StarterRecipes] Received", data.recipes.length, "recipes");
            return { recipes: data.recipes, error: null };
        }

        return {
            recipes: [],
            error: "AI could not generate recipes. Please try again.",
        };
    } catch (error) {
        console.error("[StarterRecipes] Error fetching recipes:", error);
        return {
            recipes: [],
            error: "An unexpected error occurred. Please try again.",
        };
    }
}
