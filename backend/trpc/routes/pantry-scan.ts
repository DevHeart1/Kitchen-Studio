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

Return a valid JSON object matching the following schema:
{
  "items": [
    {
      "name": "specific name of the item",
      "category": "One of: ${CATEGORIES.join(", ")}",
      "confidence": "number between 0 and 1",
      "estimatedQuantity": "full, half, almost empty, or multiple",
      "suggestedStatus": "good, low, or expiring"
    }
  ],
  "overallConfidence": "number between 0 and 1"
}

Be thorough but only include items you can actually see in the image.`;

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

      try {
        console.log(`[PantryScan] Starting image analysis with Gemini 3 Flash. Size: ${Math.round(input.imageBase64.length / 1024)}KB`);

        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not set");
        }

        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
        });

        const result = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          config: {
            responseMimeType: 'application/json',
          },
          contents: [
            {
              role: 'user',
              parts: [
                { text: SCAN_PROMPT },
                {
                  inlineData: {
                    mimeType: input.mimeType,
                    data: input.imageBase64
                  }
                },
              ],
            },
          ],
        });

        const processingTime = Date.now() - startTime;
        console.log(`[PantryScan] Analysis completed in ${processingTime}ms`);

        const responseText = result.text ?? '';
        console.log("[PantryScan] Raw response:", responseText.substring(0, 200) + "...");

        const parsedResult = JSON.parse(responseText);

        const validatedItems = (parsedResult.items || []).map((item: any) => ({
          name: item.name || "Unknown Item",
          category: CATEGORIES.includes(item.category) ? item.category : "Other",
          confidence: Math.max(0, Math.min(1, item.confidence || 0.5)),
          estimatedQuantity: item.estimatedQuantity,
          suggestedStatus: item.suggestedStatus || "good",
        }));

        const finalResult: ScanResult = {
          items: validatedItems,
          overallConfidence: Math.max(
            0,
            Math.min(1, parsedResult.overallConfidence || 0.7)
          ),
          processingTime,
        };

        console.log(`[PantryScan] Found ${finalResult.items.length} items`);
        return finalResult;
      } catch (error) {
        console.error("[PantryScan] Error analyzing image:", error);
        throw new Error(
          `Failed to analyze pantry image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
