// @ts-nocheck
// Supabase Edge Function: Get AI-Powered Starter Recipes
// Uses Gemini 3 Flash Preview to generate personalized recipe recommendations
// Note: This file runs in Deno runtime, not Node.js

import { GoogleGenAI } from "npm:@google/genai@^1.0.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserPreferences {
    cookingLevel: "beginner" | "intermediate" | "pro";
    dietaryPreferences: string[];
    primaryGoal: "eat-healthy" | "save-money" | "learn-new";
}

interface StarterRecipe {
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

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const { preferences } = (await req.json()) as { preferences: UserPreferences };

        if (!preferences) {
            throw new Error("Missing user preferences");
        }

        const ai = new GoogleGenAI({ apiKey });

        const dietaryText = preferences.dietaryPreferences.length > 0
            ? preferences.dietaryPreferences.join(", ")
            : "no specific restrictions";

        const goalText = {
            "eat-healthy": "eating healthy and nutritious meals",
            "save-money": "cooking budget-friendly meals",
            "learn-new": "learning new cooking techniques and cuisines",
        }[preferences.primaryGoal];

        const levelText = {
            beginner: "simple recipes with basic techniques",
            intermediate: "moderately challenging recipes",
            pro: "advanced recipes with complex techniques",
        }[preferences.cookingLevel];

        const prompt = `You are a culinary AI assistant. Generate exactly 3 personalized starter recipes for a new user with these preferences:

- Cooking skill level: ${preferences.cookingLevel} (prefer ${levelText})
- Dietary preferences/restrictions: ${dietaryText}
- Primary cooking goal: ${goalText}

For each recipe, provide:
1. A creative, appetizing name
2. Brief description (1-2 sentences)
3. Estimated cook time in minutes
4. Approximate calories per serving
5. Difficulty level matching user's skill
6. Match percentage (85-99%) based on how well it fits their preferences
7. 2-3 relevant tags
8. A high-quality food image URL from Unsplash (use format: https://images.unsplash.com/photo-ID?w=800&h=600&fit=crop)

Return a JSON array with this exact structure:
[
  {
    "id": "unique-id-1",
    "name": "Recipe Name",
    "description": "Brief appetizing description",
    "image": "https://images.unsplash.com/photo-...",
    "cookTime": 25,
    "calories": 420,
    "difficulty": "Beginner",
    "matchPercentage": 95,
    "isArGuided": true,
    "tags": ["Healthy", "Quick"]
  }
]

Make recipes appealing, practical, and perfectly matched to the user's preferences. First recipe should have highest match percentage.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            config: {
                thinkingConfig: { thinkingLevel: "MINIMAL" },
                responseMimeType: "application/json",
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
        });

        const text = response.text || "";
        let recipes: StarterRecipe[];

        try {
            recipes = JSON.parse(text);
        } catch {
            // Try to extract JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                recipes = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error("Failed to parse AI response");
            }
        }

        // Validate and ensure all recipes have required fields
        recipes = recipes.map((recipe, index) => ({
            id: recipe.id || `recipe-${index + 1}`,
            name: recipe.name || "Delicious Recipe",
            description: recipe.description || "A tasty dish tailored to your preferences",
            image: recipe.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop",
            cookTime: recipe.cookTime || 30,
            calories: recipe.calories || 400,
            difficulty: recipe.difficulty || "Beginner",
            matchPercentage: recipe.matchPercentage || 90,
            isArGuided: recipe.isArGuided !== false,
            tags: recipe.tags || [],
        }));

        return new Response(JSON.stringify({ recipes, success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error generating recipes:", error);

        const errorMessage = error instanceof Error ? error.message : "Failed to generate recipes";

        return new Response(
            JSON.stringify({
                recipes: [],
                success: false,
                error: errorMessage
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
