import * as z from "zod";
import { generateObject } from "@rork-ai/toolkit-sdk";

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

Be thorough but only include items you can actually see in the image. Don't make up items that aren't visible.`;

const ScanResultSchema = z.object({
  items: z.array(z.object({
    name: z.string(),
    category: z.string(),
    confidence: z.number(),
    estimatedQuantity: z.string().optional(),
    suggestedStatus: z.enum(["good", "low", "expiring"]).optional(),
  })),
  overallConfidence: z.number(),
});

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
        console.log(`[PantryScan] Starting image analysis. Payload size: ${Math.round(input.imageBase64.length / 1024)}KB`);

        const imageDataUrl = `data:${input.mimeType};base64,${input.imageBase64}`;

        const parsedResult = await generateObject({
          messages: [
            {
              role: "user",
              content: [
                { type: "image", image: imageDataUrl },
                { type: "text", text: SCAN_PROMPT },
              ],
            },
          ],
          schema: ScanResultSchema,
        });

        const processingTime = Date.now() - startTime;
        console.log(`[PantryScan] Analysis completed in ${processingTime}ms`);
        console.log("[PantryScan] Result:", JSON.stringify(parsedResult).substring(0, 500));

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
