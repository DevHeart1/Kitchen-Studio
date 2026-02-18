// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenAI } from "npm:@google/genai";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
    mode: "discover" | "search";
    query?: string; // For search mode
    // For discover mode
    category?: string;
    preferences?: {
        dietary?: string[];
        level?: string;
        goal?: string;
        pantry?: string[];
    };
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const { mode = "discover", query, category, preferences } = (await req.json()) as RequestBody;

        console.log(`[DiscoverRecipes] Mode: ${mode}, Category: ${category}, Query: ${query}`);

        const ai = new GoogleGenAI({ apiKey });

        let prompt = "";
        const count = mode === "search" ? 4 : 6;

        if (mode === "search") {
            prompt = `
            Act as a culinary expert. Search for recipes matching the query: "${query}".
            Generate exactly ${count} distinct recipes that are relevant to this search.
            `;
        } else {
            // Discover mode
            const dietStr = preferences?.dietary?.length ? `Dietary preferences: ${preferences.dietary.join(", ")}.` : "";
            const levelStr = preferences?.level ? `Cooking level: ${preferences.level}.` : "";
            const goalStr = preferences?.goal ? `Goal: ${preferences.goal}.` : "";
            const pantryStr = preferences?.pantry?.length ? `Prioritize using these ingredients: ${preferences.pantry.join(", ")}.` : "";
            const categoryPrompt = category === "For You"
                ? "Suggest personalized recipes based on the user preferences."
                : `Suggest recipes for the category: "${category}".`;

            prompt = `
            Act as a culinary expert. ${categoryPrompt}
            ${dietStr} ${levelStr} ${goalStr} ${pantryStr}
            Generate exactly ${count} distinct and appealing recipes.
            `;
        }

        prompt += `
        Return a JSON array where each object has these exact fields:
        - title: string (Creative name)
        - description: string (Appetizing one-liner)
        - cookTime: string (e.g. "25 min")
        - difficulty: "Easy" | "Medium" | "Hard"
        - calories: string (e.g. "450 kcal")
        - tags: string[] (2-3 relevant tags)
        - ingredients: { name: string, amount: string, unsplashPhotoId: string (search keyword for photo) }[] (5-8 main items)
        - instructions: { step: number, text: string, time?: number }[] (Step-by-step guide)

        Provide strictly the JSON array.
        `;

        // Use the new Google Gen AI SDK
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            config: {
                responseMimeType: 'application/json',
            },
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt }
                    ]
                }
            ]
        });

        // The response format for the new SDK
        // According to documentation/usage, we should access text.
        // Assuming response.text() is available as in other Google AI SDKs,
        // or response.candidates[0].content.parts[0].text

        let responseText: string | null = null;

        if (typeof response.text === 'function') {
            responseText = response.text();
        } else if (response.candidates && response.candidates.length > 0 && response.candidates[0].content.parts.length > 0) {
            responseText = response.candidates[0].content.parts[0].text;
        } else {
            // Fallback for debugging - stringify the whole response
            console.log("Unexpected response structure:", JSON.stringify(response));
            throw new Error("Unexpected response structure from Gemini API");
        }

        if (!responseText) {
            throw new Error("Empty response from AI");
        }

        // Clean potentially markdown-wrapped JSON
        const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        let recipes = [];
        try {
            recipes = JSON.parse(cleaned);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log("Raw Text:", responseText);
            throw new Error("Failed to parse AI response");
        }

        return new Response(JSON.stringify({ recipes }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error.message, recipes: [] }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
