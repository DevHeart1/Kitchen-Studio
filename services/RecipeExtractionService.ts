// @ts-ignore
import { YoutubeTranscript } from 'youtube-transcript';
import { DiscoverRecipe } from '@/app/(tabs)/discover';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";

export async function extractRecipeFromVideoUrl(url: string): Promise<DiscoverRecipe | null> {
    if (!GEMINI_API_KEY) {
        console.log("[Extraction] No Gemini API key found");
        return null;
    }

    try {
        // 1. Fetch Transcript Client-Side (Trem-inspired Robustness)
        let transcriptText = "";
        try {
            const transcriptItems = await YoutubeTranscript.fetchTranscript(url);
            transcriptText = transcriptItems.map((item: any) => item.text).join(" ");
        } catch (transcriptError) {
            console.warn("Transcribing failed, attempting direct Gemini analysis of URL metadata:", transcriptError);
            // Fallback behavior
            transcriptText = "TRANSCRIPT_UNAVAILABLE. Analyze based on video metadata/title only.";
        }

        // 2. Advanced System Prompt (Culinara Engine)
        const prompt = `
# Identity
You are **Culinara**, a highly advanced Culinary Intelligence Engine. Your purpose is to deconstruct cooking videos into precise, AR-ready recipe data with quantified ingredients and timed instructions.

## Core Capabilities
- **Technique Analysis**: Distinguishing "sauté" from "sear".
- **Implicit Measurement**: converting "a pinch" to "1/8 tsp", "a handful" to "1/2 cup".
- **Gap Filling**: Inferring critical missing steps (e.g., "Season with salt" if omitted).

---

# Inputs
- **Video Source**: ${url}
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
    "model": "gemini-3-pro",
    "timestamp": "${new Date().toISOString()}",
    "agent_version": "culinara-v1"
  },
  "title": "string (Professional Title)",
  "description": "string (Enticing summary, max 100 chars)",
  "cookTime": "string (e.g. '45 min')",
  "difficulty": "string (from Ontology)",
  "calories": "string (Estimated kcal)",
  "tags": ["string"],
  "ingredients": [
    { "name": "string", "amount": "string", "unsplashPhotoId": "string (relevant ID)" }
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

        // 3. Call Gemini (Using 1.5 Pro for Reasoning)
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2, // Low temp for precision
                    },
                }),
            }
        );

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const result = JSON.parse(cleaned);

        return {
            id: `video-${Date.now()}`,
            image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
            ...result,
        };

    } catch (error) {
        console.error("Culinara Engine error:", error);
        return null;
    }
}
