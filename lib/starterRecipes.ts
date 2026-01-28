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
    fallback?: boolean;
}

// Default fallback recipes if API fails
const FALLBACK_RECIPES: StarterRecipe[] = [
    {
        id: "fallback-1",
        name: "Rainbow Buddha Bowl",
        description: "A colorful, nutrient-packed bowl with fresh vegetables and wholesome grains.",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
        cookTime: 25,
        calories: 420,
        difficulty: "Intermediate",
        matchPercentage: 98,
        isArGuided: true,
        tags: ["Healthy", "Colorful"],
    },
    {
        id: "fallback-2",
        name: "Supergreen Pesto Zoodles",
        description: "Zucchini noodles tossed in a vibrant homemade basil pesto.",
        image: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=800&h=600&fit=crop",
        cookTime: 15,
        calories: 310,
        difficulty: "Beginner",
        matchPercentage: 92,
        isArGuided: true,
        tags: ["Low-Carb", "Quick"],
    },
    {
        id: "fallback-3",
        name: "Crispy Chickpea Wrap",
        description: "Crunchy spiced chickpeas wrapped with fresh avocado and greens.",
        image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&h=600&fit=crop",
        cookTime: 20,
        calories: 380,
        difficulty: "Beginner",
        matchPercentage: 88,
        isArGuided: true,
        tags: ["Protein", "Fresh"],
    },
];

export async function getStarterRecipes(preferences: UserPreferences): Promise<StarterRecipe[]> {
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
            return FALLBACK_RECIPES;
        }

        if (data?.recipes && data.recipes.length > 0) {
            console.log("[StarterRecipes] Received", data.recipes.length, "recipes", data.fallback ? "(fallback)" : "");
            return data.recipes;
        }

        return FALLBACK_RECIPES;
    } catch (error) {
        console.error("[StarterRecipes] Error fetching recipes:", error);
        return FALLBACK_RECIPES;
    }
}
