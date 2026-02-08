import * as z from "zod";
import { GoogleGenAI } from "@google/genai";
import { createTRPCRouter, publicProcedure } from "../create-context";

export interface DetectedItem {
  name: string;
  category: string;
  confidence: number;
  estimatedQuantity?: string;
  suggestedStatus?: "good" | "low" | "expiring";
  quantityCount?: number;
  isPackaged?: boolean;
  expiryDate?: string | null;
  expiryStatus?: "fresh" | "expiring_soon" | "expired" | "unknown";
  unit?: string;
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

const SCAN_PROMPT = `You are an expert kitchen inventory scanner with advanced detection capabilities. Analyze this image of a pantry, refrigerator, kitchen counter, or storage area and identify ALL visible food items, ingredients, and cooking supplies.

IMPORTANT DETECTION RULES:
1. QUANTITY DETECTION: If you see multiple units of the SAME item (e.g., 3 cans of beans, 2 bottles of milk), report it as ONE entry with "quantityCount" set to the number of units. Do NOT create duplicate entries for the same item.
2. EXPIRY DATE DETECTION: Look carefully for expiry dates, best-before dates, use-by dates, or sell-by dates printed on packaging. If visible, include the date in "expiryDate" field (format: YYYY-MM-DD or the text as shown). If the date is partially visible, estimate it. If not visible, set to null.
3. EXPIRY STATUS: Based on any visible expiry date, determine:
   - "fresh": expiry date is more than 2 weeks away or product looks fresh
   - "expiring_soon": expiry date is within 2 weeks or product shows signs of aging
   - "expired": expiry date has passed or product looks spoiled
   - "unknown": cannot determine expiry status
4. PACKAGED vs LOOSE: Identify if the item is a packaged/canned product ("isPackaged": true) or loose/fresh produce ("isPackaged": false).
5. UNIT DETECTION: Identify the unit type if visible (e.g., "can", "bottle", "bag", "box", "piece", "bunch", "lb", "kg", "oz").
6. For "suggestedStatus": set to "expiring" if expiryStatus is "expiring_soon" or "expired". Set to "low" if estimatedQuantity is "almost empty". Otherwise "good".

Return a valid JSON object matching the following schema:
{
  "items": [
    {
      "name": "specific name of the item (include brand if visible)",
      "category": "One of: ${CATEGORIES.join(", ")}",
      "confidence": "number between 0 and 1",
      "estimatedQuantity": "full, half, almost empty, or multiple",
      "suggestedStatus": "good, low, or expiring",
      "quantityCount": "integer - how many units of this same item (default 1)",
      "isPackaged": "boolean - true if packaged/canned/bottled, false if loose/fresh",
      "expiryDate": "YYYY-MM-DD string if visible on packaging, or null if not visible",
      "expiryStatus": "fresh, expiring_soon, expired, or unknown",
      "unit": "can, bottle, bag, box, piece, bunch, lb, kg, oz, etc."
    }
  ],
  "overallConfidence": "number between 0 and 1"
}

Be thorough but only include items you can actually see. Pay close attention to labels, dates, and quantities.`;

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
          model: 'gemini-3-flash-preview',
          config: {
            responseMimeType: 'application/json',
            thinkingConfig: {
              thinkingLevel: 'HIGH' as any,
            },
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
          quantityCount: Math.max(1, parseInt(item.quantityCount) || 1),
          isPackaged: typeof item.isPackaged === 'boolean' ? item.isPackaged : false,
          expiryDate: item.expiryDate || null,
          expiryStatus: ["fresh", "expiring_soon", "expired", "unknown"].includes(item.expiryStatus) ? item.expiryStatus : "unknown",
          unit: item.unit || undefined,
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
