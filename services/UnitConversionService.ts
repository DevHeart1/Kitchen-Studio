
interface UnitDefinition {
    type: "mass" | "volume" | "count";
    baseUnit: "g" | "ml" | "count";
    factor: number; // Factor to convert TO base unit
}

const UNIT_DEFINITIONS: Record<string, UnitDefinition> = {
    // Mass
    g: { type: "mass", baseUnit: "g", factor: 1 },
    kg: { type: "mass", baseUnit: "g", factor: 1000 },
    mg: { type: "mass", baseUnit: "g", factor: 0.001 },
    oz: { type: "mass", baseUnit: "g", factor: 28.3495 },
    lb: { type: "mass", baseUnit: "g", factor: 453.592 },
    pounds: { type: "mass", baseUnit: "g", factor: 453.592 },

    // Volume
    ml: { type: "volume", baseUnit: "ml", factor: 1 },
    l: { type: "volume", baseUnit: "ml", factor: 1000 },
    liter: { type: "volume", baseUnit: "ml", factor: 1000 },
    tsp: { type: "volume", baseUnit: "ml", factor: 4.92892 }, // ~5ml
    tbsp: { type: "volume", baseUnit: "ml", factor: 14.7868 }, // ~15ml
    cup: { type: "volume", baseUnit: "ml", factor: 236.588 }, // ~240ml standard
    pt: { type: "volume", baseUnit: "ml", factor: 473.176 },
    qt: { type: "volume", baseUnit: "ml", factor: 946.353 },
    gal: { type: "volume", baseUnit: "ml", factor: 3785.41 },
    "fl oz": { type: "volume", baseUnit: "ml", factor: 29.5735 },

    // Count / Kitchen Measures
    count: { type: "count", baseUnit: "count", factor: 1 },
    pcs: { type: "count", baseUnit: "count", factor: 1 },
    each: { type: "count", baseUnit: "count", factor: 1 },
    clove: { type: "count", baseUnit: "count", factor: 1 }, // Special handling in density map if needed
    bulb: { type: "count", baseUnit: "count", factor: 1 },
};

// Density map: how many grams are in 1 unit of VOLUME (usually 1 cup / ~240ml) or 1 COUNT
// For volume items, value = grams per ml (g/ml)
// For count items (clove, onion), value = grams per 1 count
// For "cup" specific mapping, we derive g/ml from the "g per cup" user provided.
// 1 Cup ~ 236.6 ml.
const DENSITY_MAP: Record<string, { gPerMl?: number; gPerCount?: number }> = {
    // --- Nigerian / Local Staples (User Provided) ---
    garri: { gPerMl: 160 / 236.6 }, // 160g per cup
    egusi: { gPerMl: 120 / 236.6 }, // 120g per cup
    ogbono: { gPerMl: 130 / 236.6 }, // 130g per cup
    beans: { gPerMl: 200 / 236.6 }, // 200g per cup
    rice: { gPerMl: 190 / 236.6 }, // 190g per cup
    flour: { gPerMl: 120 / 236.6 }, // 120g per cup
    sugar: { gPerMl: 200 / 236.6 }, // 200g per cup
    salt: { gPerMl: 280 / 236.6 }, // 280g per cup (Heavy!)
    "palm oil": { gPerMl: 0.92 }, // ~220ml implies density, but oil is usually ~0.92 g/ml
    "vegetable oil": { gPerMl: 0.92 },
    "stock fish": { gPerMl: 300 / 500 }, // "1 bowl" is vague, let's assume bowl ~ 500ml? Or treat as weight directly.
    // If user says "1 bowl", we need to know bowl size.
    // Let's standardise "bowl" -> 300g for now if used as unit.
    "dried fish": { gPerMl: 120 / 236.6 }, // 120g per cup

    // --- Common Counts (User Provided) ---
    garlic: { gPerCount: 5 }, // 1 clove = 5g
    onion: { gPerCount: 110 }, // 1 medium onion = 110g
    tomato: { gPerCount: 120 }, // medium tomato
    potato: { gPerCount: 150 }, // medium potato
    egg: { gPerCount: 50 }, // standard large egg

    // --- Defaults ---
    water: { gPerMl: 1 },
    milk: { gPerMl: 1.03 },
    butter: { gPerMl: 0.911 }, // ~215g per cup
    honey: { gPerMl: 1.42 },
};

const BASE_UNIT_MAP: Record<string, string> = {
    // Mass-tracked items (Solids)
    butter: "g",
    rice: "g",
    flour: "g",
    sugar: "g",
    salt: "g",
    pasta: "g",
    cheese: "g",
    meat: "g",
    chicken: "g",
    beef: "g",
    garri: "g",
    egusi: "g",
    ogbono: "g",
    beans: "g",
    "stock fish": "g",
    "dried fish": "g",

    // Volume-tracked items (Liquids)
    milk: "ml",
    oil: "ml",
    water: "ml",
    vinegar: "ml",
    sauce: "ml",
    stock: "ml",
    broth: "ml",
    cream: "ml",

    // Count-tracked items (Discrete)
    egg: "count",
    // Produce can be fuzzy. User said "Garlic -> 5 cloves -> 25g". 
    // So strictly speaking, garlic should be "g" internally for precision?
    // Let's stick to "g" for anything convertible to weight, "count" for strictly things like "eggs" or "cans".
    garlic: "g",
    onion: "g",
    tomato: "g",
    potato: "g",
    carrot: "g",
};

export function normalizeUnit(unit: string): string {
    if (!unit) return "count";
    const lower = unit.toLowerCase().trim();
    // Handle some plurals and aliases
    if (lower.endsWith("s") && !["s", "pcs"].includes(lower) && !UNIT_DEFINITIONS[lower]) {
        const singular = lower.slice(0, -1);
        if (UNIT_DEFINITIONS[singular]) return singular;
    }
    return lower;
}

export function getBaseUnitForIngredient(ingredientName: string): string {
    const lowerName = ingredientName.toLowerCase();
    for (const [key, base] of Object.entries(BASE_UNIT_MAP)) {
        if (lowerName.includes(key)) return base;
    }
    // Default fallback: if it sounds like a liquid? 
    return "count"; // Safe default
}

function getDensity(ingredientName: string): { gPerMl?: number; gPerCount?: number } {
    const lowerName = ingredientName.toLowerCase();
    // Try exact match first
    if (DENSITY_MAP[lowerName]) return DENSITY_MAP[lowerName];

    // Try partial match
    for (const [key, val] of Object.entries(DENSITY_MAP)) {
        if (lowerName.includes(key)) return val;
    }

    return { gPerMl: 1 }; // Default to water density for volume, undefined for count
}

/**
 * Converts ANY human input (3 cups) to SYSTEM storage unit (grams/ml/count).
 * "Golden Rule: Input in Cups -> Store in Grams"
 */
export function toSystemUnit(
    amount: number,
    unit: string,
    ingredientName: string
): { amount: number; unit: string; originalUnit: string; originalAmount: number } {
    const normUnit = normalizeUnit(unit);
    const def = UNIT_DEFINITIONS[normUnit];
    const targetBase = getBaseUnitForIngredient(ingredientName);
    const density = getDensity(ingredientName);

    // If unit unknown, store as is
    if (!def) {
        return { amount, unit: normUnit, originalUnit: unit, originalAmount: amount };
    }

    // 1. Convert to its own base first (e.g. cup -> ml)
    let baseAmount = amount * def.factor; // now in ml or g or count
    let currentBase = def.baseUnit;

    // 2. Align with Target Base
    // Case A: Mass -> Mass (g -> g) or Volume -> Volume (ml -> ml)
    if (currentBase === targetBase) {
        // No conversion needed, maybe just floating point cleanup
        return {
            amount: parseFloat(baseAmount.toFixed(1)),
            unit: targetBase,
            originalUnit: unit,
            originalAmount: amount
        };
    }

    // Case B: Volume -> Mass (ml -> g) e.g. "3 cups egusi" -> ml -> g
    // formula: mass (g) = volume (ml) * density (g/ml)
    if (currentBase === "ml" && targetBase === "g") {
        const gPerMl = density.gPerMl || 1;
        const finalGrams = baseAmount * gPerMl;
        return {
            amount: parseFloat(finalGrams.toFixed(1)),
            unit: "g",
            originalUnit: unit,
            originalAmount: amount
        };
    }

    // Case C: Mass -> Volume (g -> ml) e.g. "500g water" -> ml
    // formula: volume (ml) = mass (g) / density (g/ml)
    if (currentBase === "g" && targetBase === "ml") {
        const gPerMl = density.gPerMl || 1;
        const finalMl = baseAmount / gPerMl;
        return {
            amount: parseFloat(finalMl.toFixed(1)),
            unit: "ml",
            originalUnit: unit,
            originalAmount: amount
        };
    }

    // Case D: Count -> Mass (count -> g) e.g. "5 cloves garlic" -> g
    if (currentBase === "count" && targetBase === "g") {
        const gPerCount = density.gPerCount;
        if (gPerCount) {
            const finalGrams = baseAmount * gPerCount;
            return {
                amount: parseFloat(finalGrams.toFixed(1)),
                unit: "g",
                originalUnit: unit,
                originalAmount: amount
            };
        }
        // If no count density, fallback to keeping as count?
        // User wants "Garlic" stored as 25g.
        // If we assume default weight? Or fail?
        // Let's fallback to returning as count if we can't convert.
        return { amount, unit: "count", originalUnit: unit, originalAmount: amount };
    }

    // Fallback
    return { amount: baseAmount, unit: currentBase, originalUnit: unit, originalAmount: amount };
}

/**
 * Converts SYSTEM storage unit (g) back to HUMAN readable unit (cups/tbsp) if meaningful.
 * Or returns a smart string like "300g (approx 2.5 cups)"
 */
export function toHumanUnit(
    systemAmount: number,
    systemUnit: string,
    ingredientName: string,
    preferredUnit?: string // e.g., if user originally added in cups, try to show cups
): string {
    // If we have a preferred unit, try to convert to it.
    if (preferredUnit) {
        const normPref = normalizeUnit(preferredUnit);
        const prefDef = UNIT_DEFINITIONS[normPref];
        const density = getDensity(ingredientName);

        if (prefDef) {
            // Reverse conversion: System -> Human
            // 1. Convert System Base (e.g. g) -> Pref Base (e.g. ml) if needed
            let targetBaseAmount = systemAmount;

            if (systemUnit === "g" && prefDef.baseUnit === "ml") {
                const gPerMl = density.gPerMl || 1;
                targetBaseAmount = systemAmount / gPerMl;
            } else if (systemUnit === "ml" && prefDef.baseUnit === "g") {
                const gPerMl = density.gPerMl || 1;
                targetBaseAmount = systemAmount * gPerMl; // ml shouldn't convert to g usually for display, but mathematically valid
            }

            // 2. Convert Pref Base -> Pref Unit (e.g. ml -> cup)
            // factor converts TO base, so divide by factor to get FROM base
            const finalAmount = targetBaseAmount / prefDef.factor;

            // Round nicely
            const rounded = Math.round(finalAmount * 10) / 10;
            return `${systemAmount}${systemUnit} (approx. ${rounded} ${preferredUnit})`;
        }
    }

    // Automatic "Smart" formatting
    // e.g. if > 1000g, show kg
    if (systemUnit === "g") {
        if (systemAmount >= 1000) return `${(systemAmount / 1000).toFixed(2)} kg`;
        return `${Math.round(systemAmount)} g`;
    }
    if (systemUnit === "ml") {
        if (systemAmount >= 1000) return `${(systemAmount / 1000).toFixed(2)} L`;
        return `${Math.round(systemAmount)} ml`;
    }

    return `${systemAmount} ${systemUnit}`;
}

export function calculateRemainingServings(
    pantryAmount: number,
    pantryUnit: string, // should be base unit (g/ml)
    recipeAmount: number,
    recipeUnit: string,
    ingredientName: string
): number {
    const convertedRecipe = toSystemUnit(recipeAmount, recipeUnit, ingredientName);

    if (convertedRecipe.unit !== pantryUnit) {
        // Unit Mismatch despite attempted conversion? 
        // Maybe trying to cook "count" from "grams"?
        return 0;
    }

    if (convertedRecipe.amount === 0) return 0;

    return Math.floor(pantryAmount / convertedRecipe.amount);
}

export function checkAvailability(
    recipeAmount: number,
    recipeUnit: string,
    pantryAmount: number,
    pantryUnit: string,
    ingredientName: string
): boolean {
    // Convert both to the target base unit for this ingredient
    const recipeBase = toSystemUnit(recipeAmount, recipeUnit, ingredientName);
    // Pantry amount is likely already in system unit if coming from DB, but let's ensure
    const pantryBase = toSystemUnit(pantryAmount, pantryUnit, ingredientName);

    if (recipeBase.unit !== pantryBase.unit) {
        return false;
    }

    // buffer for Float precision issues?
    return pantryBase.amount >= recipeBase.amount * 0.95;
}
