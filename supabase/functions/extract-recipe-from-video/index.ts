// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.21.0";
import { YoutubeTranscript } from "npm:youtube-transcript@^1.2.1";

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
        const { videoUrl } = await req.json();

        if (!videoUrl) {
            throw new Error("Missing videoUrl");
        }

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        // Helper to extract video ID from various YouTube URL formats
        const extractVideoId = (url: string) => {
            const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
            const match = url.match(regex);
            return match ? match[1] : null;
        };

        const videoId = extractVideoId(videoUrl);
        console.log(`[ExtractRecipe] Extracted Video ID: ${videoId}`);

        console.log(`[ExtractRecipe] Processing URL: ${videoUrl}`);

        // 1. Fetch Transcript using youtube-transcript package
        let transcriptText = "";
        try {
            // Deno npm compatibility might require some node polyfills, usually handled automatically
            if (!videoId) throw new Error("Could not extract YouTube Video ID");
            const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
            transcriptText = transcriptItems.map((item: any) => item.text).join(" ");
        } catch (transcriptError) {
            console.warn("Transcribing failed, attempting metadata fetch fallback:", transcriptError);

            // Fallback: Fetch Title and Description from the YouTube page
            try {
                const response = await fetch(videoUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
                    }
                });
                const html = await response.text();

                const titleMatch = html.match(/<title>(.*?)<\/title>/);
                const descMatch = html.match(/<meta name="description" content="(.*?)">/) ||
                    html.match(/<meta property="og:description" content="(.*?)">/);

                const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "Unknown Title";
                const desc = descMatch ? descMatch[1] : "No description available";

                const videoMetadata = `Title: ${title}\nDescription: ${desc}`;
                transcriptText = `TRANSCRIPT_UNAVAILABLE.\n\nENRICHED METADATA:\n${videoMetadata}`;
                console.log("[ExtractRecipe] Fallback Metadata Extracted:", title);
            } catch (metadataError) {
                console.error("Metadata fetch failed as well:", metadataError);
                transcriptText = "TRANSCRIPT_UNAVAILABLE. Analyze based on URL only.";
            }
        }

        // 2. Construct the Prompt (Same as client-side Version)
        const prompt = `
# Identity
You are **Culinara**, a highly advanced Culinary Intelligence Engine. Your purpose is to deconstruct cooking videos into precise, AR-ready recipe data with quantified ingredients and timed instructions.

## Core Capabilities
- **Technique Analysis**: Distinguishing "sauté" from "sear".
- **Implicit Measurement**: converting "a pinch" to "1/8 tsp", "a handful" to "1/2 cup".
- **Gap Filling**: Inferring critical missing steps (e.g., "Season with salt" if omitted).

---

# Inputs
- **Video Source**: ${videoUrl}
- **Audio Transcript**: "${transcriptText.slice(0, 15000)}" (truncated for context window)
- **Goal**: Generate a structured AR cooking session.

---

# Strict Ontology
- **Difficulty**: [Easy, Medium, Hard, Chef-Level]
- **Tags**: Lowercase, hyphenated (e.g., gluten-free, 30-min-meal, high-protein).
- **Time**: Integer minutes.

# Robustness & Error Handling
- **Missing Duration**: Estimate based on transcript length (150 words/min).
- **Ambiguity**: If an ingredient amount is vague, provide a standard culinary estimate (e.g., "1 clove garlic").

# Output Schema (Strict JSON)
Output ONLY valid JSON. No markdown.

{
  "provenance": {
    "model": "gemini-3-flash-preview",
    "timestamp": "${new Date().toISOString()}",
    "agent_version": "culinara-v1-edge"
  },
  "title": "string (Professional Title)",
  "description": "string (Enticing summary, max 100 chars)",
  "cookTime": "string (e.g. '45 min')",
  "difficulty": "string (from Ontology)",
  "calories": "string (Estimated kcal)",
  "tags": ["string"],
  "ingredients": [
    { "id": "string (slug-style)", "name": "string", "amount": "string (e.g. 500g)", "unsplashPhotoId": "string (optional Unsplash ID)" }
  ],
  "instructions": [
    {
      "step": 1,
      "text": "string (Action-oriented)",
      "time": 0 (seconds estimate)
    }
  ]
}
`;

        // 3. Call Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        console.log("[ExtractRecipe] Gemini Response received");

        // Clean JSON (remove markdown fences if present)
        const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        let recipeData;
        try {
            recipeData = JSON.parse(cleaned);
        } catch (e) {
            console.error("Failed to parse JSON:", cleaned);
            throw new Error("Failed to parse recipe data from AI response");
        }

        // Add extra metadata expected by the frontend
        const finalRecipe = {
            id: `video-${Date.now()}`,
            image: videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            videoUrl: videoUrl, // Ensure videoUrl is passed back so we can play it
            ...recipeData
        };

        // If transcript was unavailable, maybe flag it? 
        if (transcriptText.startsWith("TRANSCRIPT_UNAVAILABLE")) {
            finalRecipe.provenance.warning = "Transcript could not be fetched. Quality may be lower.";
        }

        return new Response(JSON.stringify(finalRecipe), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("[ExtractRecipe] Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
