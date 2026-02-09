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
        const { name, amount, existingSubstitutes = [] } = await req.json();

        if (!name) {
            throw new Error("Missing ingredient name");
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        console.log(`[GetSubstitutes] Finding substitutes for: ${amount || ""} ${name}`);

        const existingNames = existingSubstitutes.map((s: any) => s.name).join(", ");

        const prompt = existingSubstitutes.length > 0
            ? `Find 2-3 MORE diverse kitchen substitutions for "${amount || "1 unit"} of ${name}". 
               IMPORTANT: Do NOT suggest any of these already listed items: ${existingNames}. 
               Return ONLY a JSON array of objects with this structure: 
               [{ 
                 "id": "unique-id", 
                 "name": "substitute name", 
                 "ratio": "e.g. Use 1:1 ratio", 
                 "matchPercent": 85, 
                 "explanation": "Why it works", 
                 "unsplashPhotoId": "optional-photo-id" 
               }]. Do not include markdown code blocks.`
            : `Find 2-3 common kitchen substitutions for "${amount || "1 unit"} of ${name}". 
               Return ONLY a JSON array of objects with this structure: 
               [{ 
                 "id": "unique-id", 
                 "name": "substitute name", 
                 "ratio": "e.g. Use 1:1 ratio", 
                 "matchPercent": 90, 
                 "explanation": "Why it works", 
                 "unsplashPhotoId": "optional-photo-id" 
               }]. Do not include markdown code blocks.`;

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log("[GetSubstitutes] Gemini Response received");

        // Clean JSON (remove markdown fences if present)
        let cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

        // Attempt to fix unquoted keys if simple parse fails
        try {
            JSON.parse(cleaned);
        } catch (e) {
            // Fix unquoted keys: { key: "value" } -> { "key": "value" }
            cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
        }

        let substitutes;
        try {
            substitutes = JSON.parse(cleaned);
        } catch (e) {
            console.error("Failed to parse JSON:", cleaned);
            throw new Error("Failed to parse substitutes from AI response");
        }

        return new Response(JSON.stringify({ substitutes }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[GetSubstitutes] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
