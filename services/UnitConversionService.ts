
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
    tsp: { type: "volume", baseUnit: "ml", factor: 4.92892 },
    tbsp: { type: "volume", baseUnit: "ml", factor: 14.7868 },
    cup: { type: "volume", baseUnit: "ml", factor: 236.588 },
    pt: { type: "volume", baseUnit: "ml", factor: 473.176 },
    qt: { type: "volume", baseUnit: "ml", factor: 946.353 },
    gal: { type: "volume", baseUnit: "ml", factor: 3785.41 },
    "fl oz": { type: "volume", baseUnit: "ml", factor: 29.5735 },

    // Count
    count: { type: "count", baseUnit: "count", factor: 1 },
    pcs: { type: "count", baseUnit: "count", factor: 1 },
    each: { type: "count", baseUnit: "count", factor: 1 },
};

// Density map for common ingredients (g/ml)
// This allows converting volume to mass (e.g., cups of flour to grams)
const INGREDIENT_DENSITIES: Record<string, number> = {
    water: 1,
    milk: 1.03,
    oil: 0.92,
    butter: 0.911, // ~227g per cup (236ml) -> 0.96 actually? USDA says 1 cup butter = 227g. 227/236.59 = 0.96
    flour: 0.53, // ~125g per cup
    sugar: 0.85, // ~200g per cup
    rice: 0.85,
    oats: 0.4,
    honey: 1.42,
};

const BASE_UNIT_MAP: Record<string, string> = {
    // Mass
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

    // Volume
    milk: "ml",
    oil: "ml",
    water: "ml",
    vinegar: "ml",
    sauce: "ml",
    stock: "ml",
    broth: "ml",
    cream: "ml",

    // Count
    egg: "count",
    onion: "count",
    garlic: "count",
    tomato: "count",
    potato: "count",
    apple: "count",
    banana: "count",
    carrot: "count",
};

export function normalizeUnit(unit: string): string {
    if (!unit) return "count";
    const lower = unit.toLowerCase().trim();
    // Handle some plurals
    if (lower.endsWith("s") && !["s", "pcs"].includes(lower)) {
        // simpler crude check
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
    return "count"; // Default fallback
}

export function convertToBase(
    amount: number,
    unit: string,
    ingredientName: string
): { amount: number; unit: string } {
    const normUnit = normalizeUnit(unit);
    const def = UNIT_DEFINITIONS[normUnit];
    const targetBase = getBaseUnitForIngredient(ingredientName);

    // If unit is unknown, return as-is or maybe force count?
    if (!def) {
        return { amount, unit: normUnit };
    }

    // 1. Convert to its own type's base unit (e.g. tbsp -> ml)
    let baseAmount = amount * def.factor;
    let currentBase = def.baseUnit;

    // 2. If types match (e.g. input is volume, target is volume), we are done.
    // Actually targetBase definitions in UNIT_DEFINITIONS?
    // g -> mass, ml -> volume, count -> count

    const targetType = UNIT_DEFINITIONS[targetBase]?.type;

    if (def.type === targetType) {
        return { amount: baseAmount, unit: targetBase };
    }

    // 3. Cross-type conversion (Volume <-> Mass)
    // Need density
    let density = 1; // Default to water
    const lowerName = ingredientName.toLowerCase();
    for (const [key, d] of Object.entries(INGREDIENT_DENSITIES)) {
        if (lowerName.includes(key)) {
            density = d;
            break;
        }
    }

    // Mass -> Volume (g -> ml) = mass / density
    if (def.type === "mass" && targetType === "volume") {
        return { amount: baseAmount / density, unit: targetBase };
    }

    // Volume -> Mass (ml -> g) = volume * density
    if (def.type === "volume" && targetType === "mass") {
        return { amount: baseAmount * density, unit: targetBase };
    }

    // Count to anything else is hard without specific item weight (e.g. 1 onion = 150g?)
    // For now, if types mismatch and one is count, we might just fail to convert and return original or try best guess.

    return { amount: baseAmount, unit: currentBase };
}

export function checkAvailability(
    recipeAmount: number,
    recipeUnit: string,
    pantryAmount: number,
    pantryUnit: string,
    ingredientName: string
): boolean {
    // Convert both to the target base unit for this ingredient
    const recipeBase = convertToBase(recipeAmount, recipeUnit, ingredientName);
    const pantryBase = convertToBase(pantryAmount, pantryUnit, ingredientName);

    if (recipeBase.unit !== pantryBase.unit) {
        // If we couldn't align units (e.g. count vs grams without conversion), 
        // we might do a loose check or fail. 
        // Fallback: strictly compare numbers if units are "compatible" loosely?
        // user said: "3 tbsp butter -> 42g" vs "250g butter".
        // convertToBase should handle this if density is known.
        return false;
    }

    // buffer for Float precision issues?
    return pantryBase.amount >= recipeBase.amount * 0.95;
}
