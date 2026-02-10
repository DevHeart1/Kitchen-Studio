
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
    clove: { type: "count", baseUnit: "count", factor: 1 },
    bulb: { type: "count", baseUnit: "count", factor: 1 },
    bowl: { type: "count", baseUnit: "g", factor: 300 }, // Approximating 'bowl' as unit? Or volume?
};

import { supabase } from "@/lib/supabase";

const STANDARD_CUP_ML = 236.6;

// Cache for loaded profiles
let PROFILES_CACHE: Record<string, { gPerMl?: number; gPerCount?: number }> = {};

// Initial Hardcoded Fallback (will be merged with DB data)
const INITIAL_DENSITY_MAP: Record<string, { gPerMl?: number; gPerCount?: number }> = {
    // --- Nigerian / Local Staples (User Provided Table) ---
    garri: { gPerMl: 160 / STANDARD_CUP_ML },
    egusi: { gPerMl: 120 / STANDARD_CUP_ML },
    ogbono: { gPerMl: 130 / STANDARD_CUP_ML },
    rice: { gPerMl: 190 / STANDARD_CUP_ML },
    beans: { gPerMl: 200 / STANDARD_CUP_ML },
    "yam flour": { gPerMl: 130 / STANDARD_CUP_ML },
    elubo: { gPerMl: 130 / STANDARD_CUP_ML },
    semolina: { gPerMl: 150 / STANDARD_CUP_ML },
    "wheat flour": { gPerMl: 120 / STANDARD_CUP_ML },
    "ground crayfish": { gPerMl: 100 / STANDARD_CUP_ML },
    crayfish: { gPerMl: 100 / STANDARD_CUP_ML },
    "ground pepper": { gPerMl: 120 / STANDARD_CUP_ML },
    pepper: { gPerMl: 120 / STANDARD_CUP_ML },
    salt: { gPerMl: 280 / STANDARD_CUP_ML },
    sugar: { gPerMl: 200 / STANDARD_CUP_ML },
    "dried fish": { gPerMl: 120 / STANDARD_CUP_ML },
    "stock fish": { gPerMl: 140 / STANDARD_CUP_ML }, // Table says 140g/cup
    onion: { gPerMl: 160 / STANDARD_CUP_ML, gPerCount: 110 }, // 160g/cup chopped, ~110g per whole
    tomato: { gPerMl: 240 / STANDARD_CUP_ML, gPerCount: 120 }, // 240g/cup blended, ~120g per whole

    // Liquids
    "palm oil": { gPerMl: 0.93 },
    "vegetable oil": { gPerMl: 0.92 },

    // Defaults
    water: { gPerMl: 1 },
    flour: { gPerMl: 120 / STANDARD_CUP_ML },
    butter: { gPerMl: 0.911 },
    honey: { gPerMl: 1.42 },
};

// Initialize cache with fallbacks
PROFILES_CACHE = { ...INITIAL_DENSITY_MAP };

export async function loadIngredientProfiles() {
    try {
        const { data, error } = await supabase
            .from("ingredient_profiles")
            .select("*");

        if (error) {
            console.error("Error loading ingredient profiles:", error);
            return;
        }

        if (data) {
            data.forEach((p: any) => {
                const gPerMl = p.gram_per_cup ? (p.gram_per_cup / STANDARD_CUP_ML) : undefined;
                if (p.name) {
                    PROFILES_CACHE[p.name.toLowerCase()] = {
                        gPerMl,
                        gPerCount: p.gram_per_count
                    };
                }
            });
            console.log(`[UnitConversion] Loaded ${data.length} profiles from DB.`);
        }
    } catch (e) {
        console.error("Failed to load profiles:", e);
    }
}

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
    "yam flour": "g",
    elubo: "g",
    semolina: "g",
    "wheat flour": "g",
    "ground crayfish": "g",
    crayfish: "g",
    "ground pepper": "g",
    pepper: "g",
    "dried fish": "g",
    "stock fish": "g",

    // Volume-tracked items (Liquids)
    milk: "ml",
    oil: "ml",
    "palm oil": "ml",
    "vegetable oil": "ml",
    water: "ml",
    vinegar: "ml",
    sauce: "ml",
    stock: "ml",
    broth: "ml",
    cream: "ml",

    // Count-tracked (or hybrid if strictly count like eggs)
    egg: "count",
    garlic: "g", // User explicitly mentioned 5 cloves = 25g
    onion: "g",
    tomato: "g",
    potato: "g",
    carrot: "g",
};

export interface UsageEvent {
    timestamp: string; // ISO date
    amount: number; // Amount used in BASE UNIT
}

export function normalizeUnit(unit: string): string {
    if (!unit) return "count";
    const lower = unit.toLowerCase().trim();
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
    return "count";
}

function getDensity(ingredientName: string): { gPerMl?: number; gPerCount?: number } {
    const lowerName = ingredientName.toLowerCase();
    if (PROFILES_CACHE[lowerName]) return PROFILES_CACHE[lowerName];
    for (const [key, val] of Object.entries(PROFILES_CACHE)) {
        if (lowerName.includes(key)) return val;
    }
    return { gPerMl: 1 };
}

export function toSystemUnit(
    amount: number,
    unit: string,
    ingredientName: string
): { amount: number; unit: string; originalUnit: string; originalAmount: number } {
    const normUnit = normalizeUnit(unit);
    const def = UNIT_DEFINITIONS[normUnit];
    const targetBase = getBaseUnitForIngredient(ingredientName);
    const density = getDensity(ingredientName);

    if (!def) {
        return { amount, unit: normUnit, originalUnit: unit, originalAmount: amount };
    }

    let baseAmount = amount * def.factor; // now in ml or g or count
    let currentBase = def.baseUnit;

    if (currentBase === targetBase) {
        return {
            amount: parseFloat(baseAmount.toFixed(1)),
            unit: targetBase,
            originalUnit: unit,
            originalAmount: amount
        };
    }

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
    }

    return { amount: baseAmount, unit: currentBase, originalUnit: unit, originalAmount: amount };
}

export function toHumanUnit(
    systemAmount: number,
    systemUnit: string,
    ingredientName: string,
    preferredUnit?: string
): string {
    if (preferredUnit) {
        const normPref = normalizeUnit(preferredUnit);
        const prefDef = UNIT_DEFINITIONS[normPref];
        const density = getDensity(ingredientName);

        if (prefDef) {
            let targetBaseAmount = systemAmount;

            if (systemUnit === "g" && prefDef.baseUnit === "ml") {
                const gPerMl = density.gPerMl || 1;
                targetBaseAmount = systemAmount / gPerMl;
            } else if (systemUnit === "ml" && prefDef.baseUnit === "g") {
                const gPerMl = density.gPerMl || 1;
                targetBaseAmount = systemAmount * gPerMl;
            }

            const finalAmount = targetBaseAmount / prefDef.factor;
            const rounded = Math.round(finalAmount * 10) / 10;
            return `${systemAmount}${systemUnit} (approx. ${rounded} ${preferredUnit})`;
        }
    }

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
    pantryUnit: string,
    recipeAmount: number,
    recipeUnit: string,
    ingredientName: string
): number {
    const convertedRecipe = toSystemUnit(recipeAmount, recipeUnit, ingredientName);

    if (convertedRecipe.unit !== pantryUnit) {
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
    const recipeBase = toSystemUnit(recipeAmount, recipeUnit, ingredientName);
    const pantryBase = toSystemUnit(pantryAmount, pantryUnit, ingredientName);

    if (recipeBase.unit !== pantryBase.unit) {
        return false;
    }

    return pantryBase.amount >= recipeBase.amount * 0.95;
}

/**
 * Predicts the date when an ingredient will run out based on usage history.
 * @param currentAmount Current quantity in pantry (System Unit)
 * @param usageHistory Array of usage events (must be in Base Unit)
 * @returns Date string (ISO) or null if not enough data
 */
export function predictRunOutDate(
    currentAmount: number,
    usageHistory: UsageEvent[]
): string | null {
    if (!usageHistory || usageHistory.length < 2) return null;

    // 1. Sort history by date
    const sorted = [...usageHistory].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // 2. Calculate average daily consumption
    const firstDate = new Date(sorted[0].timestamp);
    const lastDate = new Date(sorted[sorted.length - 1].timestamp);

    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff < 1) return null; // Need slightly longer data span

    const totalUsed = sorted.reduce((sum, e) => sum + e.amount, 0);
    const avgPerDay = totalUsed / daysDiff;

    if (avgPerDay <= 0) return null;

    // 3. Project remaining life
    const daysRemaining = currentAmount / avgPerDay;

    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysRemaining);

    return projectedDate.toISOString();
}

export function getDaysRemaining(
    currentAmount: number,
    usageHistory: UsageEvent[]
): number | null {
    const dateStr = predictRunOutDate(currentAmount, usageHistory);
    if (!dateStr) return null;

    const target = new Date(dateStr);
    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}
