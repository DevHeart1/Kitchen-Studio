
import { InventoryItem } from "@/contexts/InventoryContext";
import { Recipe } from "@/types/recipe";
import { normalizeUnit, toSystemUnit } from "./UnitConversionService";

/**
 * Normalizes an ingredient name for comparison.
 * e.g. "Fresh Basil Leaves" -> "basil"
 */
export const normalizeIngredientName = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/fresh\s+/gi, "")
        .replace(/extra\s+virgin\s+/gi, "")
        .replace(/unsalted\s+/gi, "")
        .replace(/kosher\s+/gi, "")
        .replace(/ground\s+/gi, "")
        .replace(/dried\s+/gi, "")
        .replace(/chopped\s+/gi, "")
        .replace(/\s+fillets?/gi, "")
        .replace(/\s+cloves?/gi, "")
        .replace(/,.*$/g, "")
        .trim();
};

/**
 * Calculates how well a recipe matches the user's inventory.
 * Returns match percentage and missing items.
 */
export const calculateRecipeMatch = (
    recipe: Recipe,
    inventory: InventoryItem[]
): {
    matchPercentage: number;
    missingIngredients: string[];
    canCook: boolean;
} => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
        return { matchPercentage: 0, missingIngredients: [], canCook: false };
    }

    let matchedCount = 0;
    const missingIngredients: string[] = [];

    recipe.ingredients.forEach((req) => {
        const reqName = normalizeIngredientName(req.name);

        // 1. Check for existence
        const pantryItem = inventory.find((item) => {
            const itemName = normalizeIngredientName(item.name);
            return itemName.includes(reqName) || reqName.includes(itemName);
        });

        if (pantryItem) {
            // 2. (Advanced) Check Quantity
            // If the recipe needs 500g and we have 100g, it's a partial match or missing?
            // For V1 "Cookability", we'll check simple presence + basic quantity availability if possible.

            // Convert recipe req to system unit
            const reqSystem = toSystemUnit(req.amount, req.unit, req.name);

            // Get pantry item system amount
            const pantryAmount = pantryItem.quantity || 0;
            const pantryUnit = pantryItem.unit || "count";

            // If units match (both g, both ml, both count), check amount
            if (reqSystem.unit === pantryUnit) {
                if (pantryAmount >= reqSystem.amount) {
                    matchedCount++;
                } else {
                    // We have it but not enough
                    // For now, let's count it as missing or half-match?
                    // Let's call it missing to be strict for "Can Cook"
                    missingIngredients.push(`${req.name} (Need ${req.amount} ${req.unit}, Have ${pantryItem.quantity} ${pantryItem.unit})`);
                }
            } else {
                // Units don't match, fallback to just presence for now to avoid false negatives on complex conversions
                // e.g. Recipe "1 bunch" vs Pantry "50g"
                matchedCount++;
            }
        } else {
            missingIngredients.push(req.name);
        }
    });

    const matchPercentage = Math.round((matchedCount / recipe.ingredients.length) * 100);

    return {
        matchPercentage,
        missingIngredients,
        canCook: matchPercentage === 100,
    };
};

/**
 * Sorts recipes by match percentage (highest first).
 */
export const sortRecipesByMatch = (recipes: Recipe[]): Recipe[] => {
    return [...recipes].sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0));
};
