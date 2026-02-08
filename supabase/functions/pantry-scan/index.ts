
// @ts-nocheck
// Supabase Edge Function: Pantry Scan AI
// Handles image analysis, shelf life estimation, and expiry date reading using Gemini

import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.21.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY not configured");
        }

        const { action, ...params } = await req.json();
        const ai = new GoogleGenerativeAI(apiKey);
        // Using User-specified model
        const model = ai.getGenerativeModel({
            model: "gemini-3-flash-preview",
            generationConfig: { responseMimeType: "application/json" }
        });

        console.log(`[PantryScan] Processing action: ${action}`);

        let responseText = "{}";

        if (action === "analyzeImage") {
            const { imageBase64, mimeType = "image/jpeg" } = params;
            if (!imageBase64) throw new Error("Missing imageBase64");

            const result = await model.generateContent([
                { text: SCAN_PROMPT },
                { inlineData: { mimeType, data: imageBase64 } }
            ]);
            responseText = result.response.text();

        } else if (action === "analyzeExpiryDate") {
            const { imageBase64, mimeType = "image/jpeg" } = params;
            if (!imageBase64) throw new Error("Missing imageBase64");

            const result = await model.generateContent([
                { text: EXPIRY_SCAN_PROMPT },
                { inlineData: { mimeType, data: imageBase64 } }
            ]);
            responseText = result.response.text();

        } else if (action === "estimateShelfLife") {
            const { items } = params;
            if (!items) throw new Error("Missing items");
            const today = new Date().toISOString().split('T')[0];

            const result = await model.generateContent([
                { text: `${SHELF_LIFE_PROMPT}\n\nToday's date is: ${today}\n\nItems to analyze:\n${JSON.stringify(items, null, 2)}` }
            ]);
            responseText = result.response.text();

        } else if (action === "getSmartRecommendations") {
            const { inventoryItems } = params;
            if (!inventoryItems) throw new Error("Missing inventoryItems");

            const result = await model.generateContent([
                { text: `${SMART_RECOMMENDATIONS_PROMPT}\n\nCurrent pantry inventory:\n${JSON.stringify(inventoryItems, null, 2)}` }
            ]);
            responseText = result.response.text();

        } else {
            throw new Error(`Unknown action: ${action}`);
        }

        console.log(`[PantryScan] Raw response:`, responseText.substring(0, 200));

        // Parse JSON safely
        let parsedData;
        try {
            parsedData = JSON.parse(responseText);
        } catch (e) {
            // Try to find JSON block if strict parse fails
            const match = responseText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                parsedData = JSON.parse(match[0]);
            } else {
                throw new Error("Failed to parse AI response");
            }
        }

        return new Response(JSON.stringify(parsedData), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error(`[PantryScan] Error:`, error);
        return new Response(
            JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
                success: false
            }),
            {
                status: 200, // Return 200 so frontend can parse error JSON comfortably, or use 500
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            }
        );
    }
});
