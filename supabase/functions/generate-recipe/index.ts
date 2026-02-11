// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { prompt, inventory } = await req.json();

        if (!prompt) {
            throw new Error("Missing prompt");
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        console.log(`[GenerateRecipe] Generating recipe for: ${prompt}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const systemPrompt = `
        You are an expert chef assistant. 
        User Request: "${prompt}"
        User Inventory: "${inventory || "No inventory provided"}"

        Generate a SINGLE high-quality recipe that matches the user's request.
        Prioritize using ingredients from the User Inventory.
        
        Return strictly a JSON object with this schema:
        {
            "recipe": {
                "title": "Recipe Title",
                "description": "Brief appetizing description",
                "ingredients": [
                    { "name": "Ingredient Name", "amount": "Quantity (e.g. 2 cups)", "inPantry": boolean }
                ],
                "instructions": [
                    { "step": 1, "text": "Instruction text" }
                ],
                "prepTime": "e.g. 15 mins",
                "cookTime": "e.g. 30 mins",
                "difficulty": "Easy" | "Medium" | "Hard",
                "calories": "e.g. 450 kcal"
            }
        }
        
        For "inPantry", set to true if the ingredient (or a close variant) is present in the User Inventory list provided.
        `;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();

        console.log("[GenerateRecipe] Gemini Response received");

        return new Response(responseText, {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[GenerateRecipe] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
