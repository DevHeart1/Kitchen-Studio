import * as z from "zod";
import { GoogleGenAI } from "@google/genai";

import { createTRPCRouter, publicProcedure } from "../create-context";

export interface DetectedItem {
  name: string;
  category: string;
  confidence: number;
  estimatedQuantity?: string;
  suggestedStatus?: "good" | "low" | "expiring";
}

export interface ScanResult {
  items: DetectedItem[];
  overallConfidence: number;
  processingTime: number;
}

const CATEGORIES = [
  "Oils & Spices",
  "Grains & Pasta",
  "Proteins",
  "Dairy",
  "Produce",
  "Canned Goods",
  "Condiments",
  "Beverages",
  "Snacks",
  "Baking",
  "Frozen",
  "Other",
];

const SCAN_PROMPT = `You are an expert kitchen inventory scanner. Analyze this image of a pantry, refrigerator, or kitchen storage area and identify all visible food items, ingredients, and cooking supplies.

For each item you can identify, provide:
1. name: The specific name of the item (e.g., "Extra Virgin Olive Oil", "Garlic Cloves", "Spaghetti Pasta")
2. category: One of these categories: ${CATEGORIES.join(", ")}
3. confidence: A number between 0 and 1 indicating how confident you are about this identification
4. estimatedQuantity: An estimate like "full", "half", "almost empty", "multiple" if visible
5. suggestedStatus: "good" if item appears fresh/full, "low" if running low, "expiring" if it looks old or near expiration

Be thorough but only include items you can actually see in the image. Don't make up items that aren't visible.

Return your response as a JSON object with this exact structure:
{
  "items": [
    {
      "name": "Item Name",
      "category": "Category",
      "confidence": 0.95,
      "estimatedQuantity": "full",
      "suggestedStatus": "good"
    }
  ],
  "overallConfidence": 0.85
}

Only return the JSON object, no additional text.`;

export const pantryScanRouter = createTRPCRouter({
  analyzeImage: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      const startTime = Date.now();

      const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }

      const ai = new GoogleGenAI({ apiKey });

      try {
        console.log("[PantryScan] Starting image analysis...");

        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [
            {
              role: "user",
              parts: [
                {
                  inlineData: {
                    mimeType: input.mimeType,
                    data: input.imageBase64,
                  },
                },
                {
                  text: SCAN_PROMPT,
                },
              ],
            },
          ],
          config: {
            thinkingConfig: {
              thinkingLevel: "MINIMAL",
            },
            mediaResolution: "MEDIA_RESOLUTION_HIGH",
            responseMimeType: "application/json",
          },
        });

        const processingTime = Date.now() - startTime;
        console.log(`[PantryScan] Analysis completed in ${processingTime}ms`);

        const text = response.text || "";
        console.log("[PantryScan] Raw response:", text.substring(0, 500));

        let parsedResult: { items: DetectedItem[]; overallConfidence: number };
        try {
          parsedResult = JSON.parse(text);
        } catch (parseError) {
          console.error("[PantryScan] Failed to parse response:", parseError);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("Failed to parse AI response as JSON");
          }
        }

        const validatedItems = parsedResult.items.map((item) => ({
          name: item.name || "Unknown Item",
          category: CATEGORIES.includes(item.category) ? item.category : "Other",
          confidence: Math.max(0, Math.min(1, item.confidence || 0.5)),
          estimatedQuantity: item.estimatedQuantity,
          suggestedStatus: item.suggestedStatus || "good",
        }));

        const result: ScanResult = {
          items: validatedItems,
          overallConfidence: Math.max(
            0,
            Math.min(1, parsedResult.overallConfidence || 0.7)
          ),
          processingTime,
        };

        console.log(`[PantryScan] Found ${result.items.length} items`);
        return result;
      } catch (error) {
        console.error("[PantryScan] Error analyzing image:", error);
        throw new Error(
          `Failed to analyze pantry image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
