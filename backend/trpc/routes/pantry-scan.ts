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

const EXPIRY_SCAN_PROMPT = `You are an expert at reading expiry dates, best-before dates, use-by dates, and sell-by dates on food packaging.

Analyze this image and look for ANY date printed on the packaging. This could be:
- "Best Before", "BB", "Best By"
- "Use By", "Use Before"
- "Sell By"
- "Expiry Date", "EXP", "Expires"
- Any date format (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD MMM YYYY, etc.)

Return a valid JSON object:
{
  "found": true/false,
  "expiryDate": "YYYY-MM-DD" or null,
  "dateType": "best_before" | "use_by" | "sell_by" | "expiry" | "unknown",
  "rawText": "the exact text seen on packaging" or null,
  "confidence": 0.0 to 1.0
}

If no date is found, return { "found": false, "expiryDate": null, "dateType": "unknown", "rawText": null, "confidence": 0 }`;

const SHELF_LIFE_PROMPT = `You are a food safety expert. For each food item provided, estimate its shelf life and expiry information.

Consider:
- Whether the item is perishable, semi-perishable, or non-perishable
- Typical storage conditions (room temperature, refrigerated, frozen)
- Common shelf life ranges
- Signs of spoilage to watch for

For the given items, return a valid JSON object:
{
  "items": [
    {
      "name": "item name",
      "shelfLifeDays": number (estimated days from purchase),
      "expiryDate": "YYYY-MM-DD" (calculated from today),
      "perishability": "perishable" | "semi_perishable" | "non_perishable",
      "storageAdvice": "brief storage tip",
      "spoilageSign": "what to look for when it goes bad",
      "category": "produce" | "dairy" | "protein" | "grain" | "canned" | "frozen" | "other"
    }
  ]
}`;

const SMART_RECOMMENDATIONS_PROMPT = `You are a helpful AI chef assistant. Based on the user's pantry inventory (especially items that are expiring soon), suggest practical actions and recipe ideas.

For each recommendation, provide:
- A clear, actionable title
- A helpful message explaining why
- The type of recommendation
- Priority level

Return a valid JSON object:
{
  "recommendations": [
    {
      "id": "unique-id",
      "type": "expiry_warning" | "recipe_suggestion" | "storage_tip" | "meal_plan" | "waste_reduction",
      "title": "short title",
      "message": "detailed helpful message",
      "priority": "high" | "medium" | "low",
      "relatedItems": ["item names"],
      "actionLabel": "optional action button text" or null
    }
  ]
}

Limit to 5-8 most relevant recommendations. Focus on preventing food waste and using items that expire soonest.`;

export const pantryScanRouter = createTRPCRouter({
  analyzeExpiryDate: publicProcedure
    .input(
      z.object({
        imageBase64: z.string(),
        mimeType: z.string().default("image/jpeg"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`[ExpiryDateScan] Starting expiry date analysis...`);

        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not set");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          config: { responseMimeType: 'application/json' },
          contents: [
            {
              role: 'user',
              parts: [
                { text: EXPIRY_SCAN_PROMPT },
                { inlineData: { mimeType: input.mimeType, data: input.imageBase64 } },
              ],
            },
          ],
        });

        const responseText = result.text ?? '{}';
        console.log("[ExpiryDateScan] Response:", responseText.substring(0, 200));
        const parsed = JSON.parse(responseText);

        return {
          found: parsed.found ?? false,
          expiryDate: parsed.expiryDate ?? null,
          dateType: parsed.dateType ?? "unknown",
          rawText: parsed.rawText ?? null,
          confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0)),
        };
      } catch (error) {
        console.error("[ExpiryDateScan] Error:", error);
        throw new Error(`Failed to analyze expiry date: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  estimateShelfLife: publicProcedure
    .input(
      z.object({
        items: z.array(z.object({
          name: z.string(),
          category: z.string(),
          isPackaged: z.boolean().optional(),
        })),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`[ShelfLife] Estimating shelf life for ${input.items.length} items...`);

        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not set");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const today = new Date().toISOString().split('T')[0];

        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          config: { responseMimeType: 'application/json' },
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${SHELF_LIFE_PROMPT}\n\nToday's date is: ${today}\n\nItems to analyze:\n${JSON.stringify(input.items, null, 2)}` },
              ],
            },
          ],
        });

        const responseText = result.text ?? '{}';
        console.log("[ShelfLife] Response:", responseText.substring(0, 300));
        const parsed = JSON.parse(responseText);

        return {
          items: (parsed.items || []).map((item: any) => ({
            name: item.name || "",
            shelfLifeDays: item.shelfLifeDays || 7,
            expiryDate: item.expiryDate || null,
            perishability: ["perishable", "semi_perishable", "non_perishable"].includes(item.perishability) ? item.perishability : "semi_perishable",
            storageAdvice: item.storageAdvice || "",
            spoilageSign: item.spoilageSign || "",
            category: item.category || "other",
          })),
        };
      } catch (error) {
        console.error("[ShelfLife] Error:", error);
        throw new Error(`Failed to estimate shelf life: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  getSmartRecommendations: publicProcedure
    .input(
      z.object({
        inventoryItems: z.array(z.object({
          name: z.string(),
          category: z.string(),
          status: z.string(),
          expiresIn: z.string().optional(),
          stockPercentage: z.number(),
        })),
      })
    )
    .mutation(async ({ input }) => {
      try {
        console.log(`[SmartRec] Generating recommendations for ${input.inventoryItems.length} items...`);

        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not set");
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          config: { responseMimeType: 'application/json' },
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${SMART_RECOMMENDATIONS_PROMPT}\n\nCurrent pantry inventory:\n${JSON.stringify(input.inventoryItems, null, 2)}` },
              ],
            },
          ],
        });

        const responseText = result.text ?? '{}';
        console.log("[SmartRec] Response:", responseText.substring(0, 300));
        const parsed = JSON.parse(responseText);

        return {
          recommendations: (parsed.recommendations || []).map((rec: any) => ({
            id: rec.id || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: rec.type || "storage_tip",
            title: rec.title || "Tip",
            message: rec.message || "",
            priority: ["high", "medium", "low"].includes(rec.priority) ? rec.priority : "medium",
            relatedItems: Array.isArray(rec.relatedItems) ? rec.relatedItems : [],
            actionLabel: rec.actionLabel || null,
          })),
        };
      } catch (error) {
        console.error("[SmartRec] Error:", error);
        throw new Error(`Failed to generate recommendations: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

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
      } catch (error: any) {
        console.error("[PantryScan] Error analyzing image:", error);

        // Log detailed error info if available
        if (error.response) {
          console.error("[PantryScan] API Response Error:", JSON.stringify(error.response, null, 2));
        }
        if (error.message) {
          console.error("[PantryScan] Error Message:", error.message);
        }

        throw new Error(
          `Failed to analyze pantry image: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
