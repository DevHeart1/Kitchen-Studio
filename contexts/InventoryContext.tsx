import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase, DbInventoryItem } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toSystemUnit, normalizeUnit, checkAvailability as serviceCheckAvailability, UsageEvent, toHumanUnit } from "@/services/UnitConversionService";

export interface InventoryItem {
  id: string;
  name: string;
  normalizedName: string;
  image: string;
  category: string;
  addedDate: string;
  status: "good" | "low" | "expiring";
  stockPercentage: number;

  // User View (What they typed)
  quantity?: number;
  unit?: string;

  // System View (Math)
  baseQuantity?: number;
  baseUnit?: string;

  originalQuantity?: number;
  expiresIn?: string;
  usageHistory?: UsageEvent[];
}

const STORAGE_KEY = "pantry_inventory";
const MOCK_CLEARED_KEY = "pantry_mock_cleared_v3";
const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

const MOCK_IDS = ["1-1", "1-2", "2-1", "2-2", "3-1", "4-1", "4-2", "4-3"];
const KNOWN_MOCK_CATEGORIES = ["Snacks", "Grains & Pasta", "Oils & Spices", "Produce", "Dairy", "Proteins", "Beverages", "Condiments"];



const normalizeIngredientName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/fresh\s+/gi, "")
    .replace(/extra\s+virgin\s+/gi, "")
    .replace(/unsalted\s+/gi, "")
    .replace(/kosher\s+/gi, "")
    .replace(/\s+fillets?/gi, "")
    .replace(/\s+cloves?/gi, "")
    .replace(/,.*$/g, "")
    .trim();
};

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes("your-project");
};

// Convert DB item to frontend item
const dbToFrontend = (item: DbInventoryItem): InventoryItem => ({
  id: item.id,
  name: item.name,
  normalizedName: item.normalized_name,
  image: item.image || "",
  category: item.category,
  addedDate: item.added_date,
  status: item.status,
  stockPercentage: item.stock_percentage,
  quantity: item.quantity,
  unit: item.unit,
  baseQuantity: item.base_quantity,
  baseUnit: item.base_unit,
  originalQuantity: item.original_quantity,
  expiresIn: item.expires_in || undefined,
  usageHistory: item.usage_history ? (typeof item.usage_history === 'string' ? JSON.parse(item.usage_history) : item.usage_history) : [],
});

// Convert frontend item to DB item
const frontendToDb = (
  item: Omit<InventoryItem, "id" | "normalizedName">,
  userId: string
): Omit<DbInventoryItem, "id" | "created_at" | "updated_at"> => ({
  user_id: userId,
  name: item.name,
  normalized_name: normalizeIngredientName(item.name),
  image: item.image || null,
  category: item.category,
  added_date: item.addedDate,
  status: item.status,
  stock_percentage: item.stockPercentage,
  quantity: item.quantity || 1,
  unit: item.unit || "count",
  base_quantity: item.baseQuantity,
  base_unit: item.baseUnit,
  original_quantity: item.originalQuantity || item.quantity || 1,
  expires_in: item.expiresIn || null,
  usage_history: item.usageHistory ? JSON.stringify(item.usageHistory) : '[]',
});

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, getUserId } = useAuth();
  const useSupabase = isSupabaseConfigured();
  const userId = getUserId();

  useEffect(() => {
    if (userId) {
      loadInventory();
    }
  }, [userId]);

  const loadInventory = async () => {
    try {
      if (useSupabase && userId) {
        // Load from Supabase
        const { data, error } = await supabase
          .from("inventory_items")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[Inventory] Supabase error:", error.message);
          // Fallback to AsyncStorage
          await loadFromAsyncStorage();
        } else {
          setInventory(data ? data.map(dbToFrontend) : []);
        }
      } else {
        // Use AsyncStorage (demo mode)
        await loadFromAsyncStorage();
      }
    } catch (error) {
      console.log("Error loading inventory:", error);
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromAsyncStorage = async () => {
    const mockCleared = await AsyncStorage.getItem(MOCK_CLEARED_KEY);
    if (!mockCleared) {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: InventoryItem[] = JSON.parse(stored);
        const isMockItem = (item: InventoryItem): boolean => {
          if (MOCK_IDS.includes(item.id)) return true;
          if (/^\d+-\d+$/.test(item.id)) return true;
          if (/^mock-/.test(item.id)) return true;
          return false;
        };
        const realItems = parsed.filter((item) => !isMockItem(item));
        console.log(`[Inventory] Purged ${parsed.length - realItems.length} mock items, kept ${realItems.length} real items`);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(realItems));
        setInventory(realItems);
      } else {
        setInventory([]);
      }
      await AsyncStorage.setItem(MOCK_CLEARED_KEY, "true");
      return;
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      setInventory(JSON.parse(stored));
    } else {
      setInventory([]);
    }
  };





  const removeItem = useCallback(
    async (itemId: string) => {
      try {
        if (useSupabase) {
          const { error } = await supabase
            .from("inventory_items")
            .delete()
            .eq("id", itemId);

          if (error) {
            console.error("[Inventory] Delete error:", error.message);
            return false;
          }

          setInventory((prev) => prev.filter((item) => item.id !== itemId));
          console.log("Item removed from inventory");
          return true;
        } else {
          const updated = inventory.filter((item) => item.id !== itemId);
          setInventory(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          console.log("Item removed from inventory");
          return true;
        }
      } catch (error) {
        console.log("Error removing item:", error);
        return false;
      }
    },
    [inventory, useSupabase]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: Partial<InventoryItem>) => {
      try {
        if (useSupabase) {
          const dbUpdates: Partial<DbInventoryItem> = {};
          if (updates.name) dbUpdates.name = updates.name;
          if (updates.normalizedName)
            dbUpdates.normalized_name = updates.normalizedName;
          if (updates.image) dbUpdates.image = updates.image;
          if (updates.category) dbUpdates.category = updates.category;
          if (updates.addedDate) dbUpdates.added_date = updates.addedDate;
          if (updates.status) dbUpdates.status = updates.status;
          if (updates.stockPercentage !== undefined)
            dbUpdates.stock_percentage = updates.stockPercentage;
          if (updates.expiresIn !== undefined)
            dbUpdates.expires_in = updates.expiresIn || null;

          // If manually updating quantity? We'd ideally need to update base too
          if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
          if (updates.unit) dbUpdates.unit = updates.unit;
          if (updates.baseQuantity !== undefined) dbUpdates.base_quantity = updates.baseQuantity;
          if (updates.baseUnit) dbUpdates.base_unit = updates.baseUnit;
          if (updates.usageHistory) dbUpdates.usage_history = JSON.stringify(updates.usageHistory);
          if (updates.originalQuantity) dbUpdates.original_quantity = updates.originalQuantity;

          const { error } = await supabase
            .from("inventory_items")
            .update(dbUpdates)
            .eq("id", itemId);

          if (error) {
            console.error("[Inventory] Update error:", error.message);
            return false;
          }

          setInventory((prev) =>
            prev.map((item) =>
              item.id === itemId ? { ...item, ...updates } : item
            )
          );
          return true;
        } else {
          const updated = inventory.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          );
          setInventory(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return true;
        }
      } catch (error) {
        console.log("Error updating item:", error);
        return false;
      }
    },
    [inventory, useSupabase]
  );


  /*
   * ADD ITEM Logic (Dual-Unit)
   * 1. Accept User Input (2 cups)
   * 2. Calculate Base System Unit (320g)
   * 3. Check for duplicates -> Merge if found
   * 4. Else -> Create New
   */
  const addItem = useCallback(
    async (item: Omit<InventoryItem, "id" | "normalizedName">) => {
      try {
        const userQty = item.quantity || 1;
        const userUnit = item.unit || "count";
        const normalizedName = normalizeIngredientName(item.name);

        // Convert new item to System Unit (Base)
        const conversion = toSystemUnit(userQty, userUnit, item.name);
        // conversion -> { amount: 320, unit: "g" }

        // CHECK FOR DUPLICATES
        const existingItem = inventory.find(
          (i) => (i.normalizedName || normalizeIngredientName(i.name)) === normalizedName
        );

        if (existingItem) {
          console.log(`[Inventory] Duplicate found for ${item.name}, merging...`);

          // Calculate New Base Totals
          const currentBaseQty = existingItem.baseQuantity || 0;
          const newBaseQty = currentBaseQty + conversion.amount;

          // Calculate New Original Quantity (Expand capacity)
          // If we are adding stock, we assume we are filling up/expanding.
          const currentOriginalQty = existingItem.originalQuantity || currentBaseQty;
          const newOriginalQty = currentOriginalQty + conversion.amount;

          // Recalculate User View Quantity
          // We keep the EXISTING User Unit preference
          const existingUserUnit = existingItem.unit || "count";

          // Convert newBaseQty (g) back to existingUserUnit (e.g. cups)
          // We need a reverse conversion or a ratio.
          // Ratio = currentBaseQty / currentQty
          let newUserQty = newBaseQty;
          if (existingItem.quantity && currentBaseQty > 0) {
            const ratio = currentBaseQty / existingItem.quantity;
            if (ratio > 0) {
              newUserQty = parseFloat((newBaseQty / ratio).toFixed(2));
            }
          } else {
            // Fallback: If we can't deduce ratio, assume 1:1 or use base
            newUserQty = newBaseQty;
          }

          // Update Status
          const newPercentage = Math.round((newBaseQty / newOriginalQty) * 100);
          let newStatus: InventoryItem["status"] = "good";
          if (newPercentage <= 25) newStatus = "low";

          // Merge Expiry (Keep the nearest one? Or the new one? Let's keep the nearest expiring one to be safe)
          let newExpiresIn = existingItem.expiresIn;
          // logic to compare dates omitted for brevity - keeping existing for now is safer than overwriting with null
          if (item.expiresIn && (!existingItem.expiresIn || new Date(item.expiresIn) < new Date(existingItem.expiresIn))) {
            newExpiresIn = item.expiresIn;
            // If new expiration is sooner, status might change
            if (new Date(newExpiresIn) < new Date()) newStatus = "expiring";
          } else if (existingItem.expiresIn && new Date(existingItem.expiresIn) < new Date()) {
            newStatus = "expiring";
          }

          return await updateItem(existingItem.id, {
            quantity: newUserQty,
            baseQuantity: newBaseQty,
            originalQuantity: newOriginalQty,
            stockPercentage: newPercentage,
            status: newStatus,
            expiresIn: newExpiresIn,
            // Append usage history? No, adding stock isn't usage.
          });
        }

        // NO DUPLICATE -> CREATE NEW
        const newItemData: InventoryItem = {
          ...item,
          id: Date.now().toString(), // Temp ID for fallback, Supabase will overwrite
          normalizedName: normalizedName,
          quantity: userQty,
          unit: userUnit,
          baseQuantity: conversion.amount,
          baseUnit: conversion.unit,
          originalQuantity: conversion.amount, // Track original BASE quantity for progress bar
        };

        if (useSupabase) {
          const dbItem = frontendToDb(newItemData, userId || DEMO_USER_ID);

          const { data, error } = await supabase
            .from("inventory_items")
            .insert(dbItem)
            .select()
            .single();

          if (error) {
            console.error("[Inventory] Insert error:", error.message);
            return false;
          }

          const createdItem = dbToFrontend(data);
          setInventory((prev) => [createdItem, ...prev]);
          console.log(`Added: ${userQty} ${userUnit} converted to ${conversion.amount} ${conversion.unit}`);
          return true;
        } else {
          // AsyncStorage fallback
          const updated = [newItemData, ...inventory];
          setInventory(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          console.log(`Added (Local): ${userQty} ${userUnit} converted to ${conversion.amount} ${conversion.unit}`);
          return true;
        }
      } catch (error) {
        console.log("Error adding item:", error);
        return false;
      }
    },
    [inventory, useSupabase, userId, updateItem]
  );

  const checkIngredientInPantry = useCallback(
    (
      ingredientName: string
    ): {
      found: boolean;
      item?: InventoryItem;
      hasSubstitute: boolean;
      substituteItem?: InventoryItem;
    } => {
      const normalized = normalizeIngredientName(ingredientName);

      // Check for direct match
      const directMatch = inventory.find((item) => {
        const itemNormalized =
          item.normalizedName || normalizeIngredientName(item.name);
        return (
          itemNormalized.includes(normalized) ||
          normalized.includes(itemNormalized)
        );
      });

      if (directMatch) {
        return { found: true, item: directMatch, hasSubstitute: false };
      }

      // Check for substitutes (simple map for now, could be enhanced with UnitConversionService later if needed)
      const substitutes: Record<string, string[]> = {
        "kosher salt": ["salt", "table salt", "sea salt"],
        "table salt": ["salt", "kosher salt", "sea salt"],
        "fresh parsley": ["parsley", "dried parsley", "cilantro"],
        "fresh garlic": ["garlic", "garlic cloves", "minced garlic"],
        "olive oil": ["vegetable oil", "canola oil"],
        "butter": ["margarine", "oil"],
        "milk": ["cream", "soy milk", "almond milk"],
      };

      const possibleSubs = substitutes[normalized] || [];
      for (const sub of possibleSubs) {
        const subMatch = inventory.find((item) => {
          const itemNormalized =
            item.normalizedName || normalizeIngredientName(item.name);
          return (
            itemNormalized.includes(sub) || sub.includes(itemNormalized)
          );
        });
        if (subMatch) {
          return { found: false, hasSubstitute: true, substituteItem: subMatch };
        }
      }

      return { found: false, hasSubstitute: false };
    },
    [inventory]
  );

  const checkAvailability = useCallback((
    recipeAmount: number,
    recipeUnit: string,
    ingredientName: string
  ): { available: boolean; remaining?: number; missingAmount?: number } => {
    // 1. Find the item in pantry
    const { item } = checkIngredientInPantry(ingredientName);

    if (!item) {
      return { available: false, missingAmount: recipeAmount };
    }

    // 2. Use Service to check availability (System Logic)
    // Convert recipe req to system unit
    const recipeReq = toSystemUnit(recipeAmount, recipeUnit, ingredientName);

    // Use BASE fields if available, else fallback to quantity (legacy)
    const pantryBaseAmount = item.baseQuantity !== undefined ? item.baseQuantity : (item.quantity || 0);
    const pantryBaseUnit = item.baseUnit || item.unit || "count";

    // Compare
    if (recipeReq.unit !== pantryBaseUnit) {
      // Mismatch (e.g. recipe wants 'count' but pantry has 'g'?)
      return { available: false, missingAmount: recipeAmount };
    }

    if (pantryBaseAmount >= recipeReq.amount) {
      return { available: true, remaining: pantryBaseAmount - recipeReq.amount };
    } else {
      return { available: false, remaining: pantryBaseAmount, missingAmount: recipeReq.amount - pantryBaseAmount };
    }
  }, [inventory, checkIngredientInPantry]);

  /* 
   * CONSUME INGREDIENTS Logic (Dual-Unit)
   * Deducts base quantity, recalculates user display quantity.
   */
  const consumeIngredients = useCallback(
    async (recipeAmount: number, recipeUnit: string, ingredientName: string) => {
      try {
        const { item } = checkIngredientInPantry(ingredientName);
        if (!item) return false;

        // 1. Convert consumption amount to system unit (Base)
        const consumed = toSystemUnit(recipeAmount, recipeUnit, ingredientName);

        const currentBaseQty = item.baseQuantity !== undefined ? item.baseQuantity : (item.quantity || 0);
        const currentBaseUnit = item.baseUnit || item.unit || "count";

        // Ensure units match
        if (consumed.unit !== currentBaseUnit) {
          console.warn(`Unit mismatch in consume: ${consumed.unit} vs ${currentBaseUnit}`);
          return false;
        }

        // 2. Calculate new BASE quantity
        const newBaseQty = Math.max(0, currentBaseQty - consumed.amount);

        // 3. Recalculate User Quantity (The magic "1.5 cups left")
        // We know: newBaseQty (grams). We want: UserQty (cups).
        // Formula: UserQty = newBaseQty / (originalBaseQty / originalUserQty)

        // Infer density factor from CURRENT state if possible
        // If 2 cups = 320g, then factor = 160.
        // If we have 240g left, then 240 / 160 = 1.5 cups.

        let newUserQty = newBaseQty;
        if (item.quantity && item.baseQuantity && item.quantity > 0) {
          const ratio = item.baseQuantity / item.quantity; // g per cup
          if (ratio > 0) {
            newUserQty = parseFloat((newBaseQty / ratio).toFixed(2));
          }
        } else {
          // If we don't have dual data, just use base math
          newUserQty = newBaseQty;
        }

        // 4. Update Usage History
        const newEvent: UsageEvent = {
          timestamp: new Date().toISOString(),
          amount: consumed.amount
        };
        const updatedHistory = [...(item.usageHistory || []), newEvent];

        // 5. Update Status & Stock Percentage
        const originalBaseQty = item.originalQuantity || (currentBaseQty > newBaseQty ? currentBaseQty : newBaseQty) || 1;

        const newPercentage = Math.round((newBaseQty / originalBaseQty) * 100);
        let newStatus: "good" | "low" | "expiring" = "good";

        if (newPercentage <= 25) newStatus = "low";
        if (item.expiresIn && new Date(item.expiresIn) < new Date()) newStatus = "expiring";

        // 6. Save Updates
        await updateItem(item.id, {
          quantity: newUserQty, // User sees "1.5"
          unit: item.unit,      // User sees "cups"
          baseQuantity: newBaseQty, // System knows "240"
          baseUnit: currentBaseUnit, // System knows "g"
          stockPercentage: newPercentage,
          status: newStatus,
          usageHistory: updatedHistory,
          originalQuantity: originalBaseQty
        });

        console.log(`Consumed ${consumed.amount}${consumed.unit}. Remaining: ${newUserQty} ${item.unit} (${newBaseQty}${currentBaseUnit})`);
        return true;

      } catch (error) {
        console.error("Error consuming ingredients:", error);
        return false;
      }
    },
    [checkIngredientInPantry, updateItem]
  );

  const getTotalCount = useMemo(() => inventory.length, [inventory]);

  const getExpiringCount = useMemo(
    () => inventory.filter((item) => item.status === "expiring").length,
    [inventory]
  );

  return useMemo(
    () => ({
      inventory,
      isLoading,
      addItem,
      removeItem,
      updateItem,
      checkIngredientInPantry,
      checkAvailability,
      consumeIngredients,
      getTotalCount,
      getExpiringCount,
      refreshInventory: loadInventory,
    }),
    [
      inventory,
      isLoading,
      addItem,
      removeItem,
      updateItem,
      checkIngredientInPantry,
      consumeIngredients,
      getTotalCount,
      getExpiringCount,
    ]
  );
});
