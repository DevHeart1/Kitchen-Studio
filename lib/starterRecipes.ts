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

const FALLBACK_RECIPES: StarterRecipe[] = [
    {
        id: "fallback-1",
        name: "Classic Avocado Toast",
        description: "Creamy avocado on crispy toast with a perfect blend of seasonings",
        image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800&h=600&fit=crop",
        cookTime: 10,
        calories: 320,
        difficulty: "Beginner",
        matchPercentage: 95,
        isArGuided: true,
        tags: ["Quick", "Healthy", "Breakfast"],
    },
    {
        id: "fallback-2",
        name: "Garlic Butter Pasta",
        description: "Simple yet delicious pasta with aromatic garlic and fresh herbs",
        image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop",
        cookTime: 20,
        calories: 450,
        difficulty: "Beginner",
        matchPercentage: 92,
        isArGuided: true,
        tags: ["Comfort Food", "Easy"],
    },
    {
        id: "fallback-3",
        name: "Fresh Garden Salad",
        description: "Crisp mixed greens with colorful vegetables and tangy vinaigrette",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop",
        cookTime: 15,
        calories: 180,
        difficulty: "Beginner",
        matchPercentage: 88,
        isArGuided: false,
        tags: ["Healthy", "Fresh", "Light"],
    },
];

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
            console.log("[StarterRecipes] Using fallback recipes");
            return {
                recipes: FALLBACK_RECIPES,
                error: null,
            };
        }

        if (data?.recipes && data.recipes.length > 0) {
            console.log("[StarterRecipes] Received", data.recipes.length, "recipes");
            return { recipes: data.recipes, error: null };
        }

        console.log("[StarterRecipes] No recipes returned, using fallback");
        return {
            recipes: FALLBACK_RECIPES,
            error: null,
        };
    } catch (error) {
        console.error("[StarterRecipes] Error fetching recipes:", error);
        console.log("[StarterRecipes] Using fallback recipes due to error");
        return {
            recipes: FALLBACK_RECIPES,
            error: null,
        };
    }
}
