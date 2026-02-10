import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase, DbInventoryItem } from "@/lib/supabase";
import { useAuth } from "./AuthContext";
import { toSystemUnit, normalizeUnit, checkAvailability as serviceCheckAvailability, UsageEvent } from "@/services/UnitConversionService";

export interface InventoryItem {
  id: string;
  name: string;
  normalizedName: string;
  image: string;
  category: string;
  addedDate: string;
  status: "good" | "low" | "expiring";
  stockPercentage: number;
  quantity?: number;
  originalQuantity?: number;
  unit?: string;
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
  originalQuantity: item.original_quantity,
  unit: item.unit,
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
  original_quantity: item.originalQuantity || item.quantity || 1,
  unit: item.unit || "count",
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

  const addItem = useCallback(
    async (item: Omit<InventoryItem, "id" | "normalizedName">) => {
      try {
        // --- SMART UNIT CONVERSION START ---
        // user inputs: item.quantity (human amount), item.unit (human unit)
        // we convert to system unit
        let systemAmount = item.quantity || 1;
        let systemUnit = item.unit || "count";
        const humanUnit = item.unit || "count"; // store preference

        const conversion = toSystemUnit(systemAmount, humanUnit, item.name);
        systemAmount = conversion.amount;
        systemUnit = conversion.unit;
        // --- SMART UNIT CONVERSION END ---

        if (useSupabase) {
          const dbItem = frontendToDb({
            ...item,
            quantity: systemAmount, // Store converted amount
            unit: systemUnit,       // Store converted unit
            // We might want to store 'original_unit' in a metadata field later if needed for display preference persistence
            // For now, we rely on the UI to re-convert for display if it guesses well.
          }, userId || DEMO_USER_ID);

          const { data, error } = await supabase
            .from("inventory_items")
            .insert(dbItem)
            .select()
            .single();

          if (error) {
            console.error("[Inventory] Insert error:", error.message);
            return false;
          }

          const newItem = dbToFrontend(data);
          setInventory((prev) => [newItem, ...prev]);
          console.log("Item added to inventory (converted):", newItem.name, newItem.quantity, newItem.unit);
          return true;
        } else {
          // AsyncStorage fallback
          const newItem: InventoryItem = {
            ...item,
            id: Date.now().toString(),
            normalizedName: normalizeIngredientName(item.name),
            quantity: systemAmount,
            unit: systemUnit,
          };

          const updated = [...inventory, newItem];
          setInventory(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          console.log("Item added to inventory (converted):", newItem.name);
          return true;
        }
      } catch (error) {
        console.log("Error adding item:", error);
        return false;
      }
    },
    [inventory, useSupabase, userId]
  );

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

    // 2. Use Service to check availability
    // Convert recipe req to system unit
    const recipeReq = toSystemUnit(recipeAmount, recipeUnit, ingredientName);

    // Pantry item is already system unit (theoretically), but let's be safe
    const pantryAmount = item.quantity || 0;
    const pantryUnit = item.unit || "count";

    // Compare
    if (recipeReq.unit !== pantryUnit) {
      // Mismatch (e.g. recipe wants 'count' but pantry has 'g'?)
      // Attempt cross-conversion? 
      // toSystemUnit already attempts to align to base. 
      // So if they differ here, it's likely incompatible (e.g. count vs mass without density).
      return { available: false, missingAmount: recipeAmount };
    }

    if (pantryAmount >= recipeReq.amount) {
      return { available: true, remaining: pantryAmount - recipeReq.amount };
    } else {
      return { available: false, remaining: pantryAmount, missingAmount: recipeReq.amount - pantryAmount };
    }
  }, [inventory, checkIngredientInPantry]);

  /* 
   * CONSUME INGREDIENTS Logic
   * Deducts quantity, updates usage history, and checks for low stock.
   */
  const consumeIngredients = useCallback(
    async (recipeAmount: number, recipeUnit: string, ingredientName: string) => {
      try {
        const { item } = checkIngredientInPantry(ingredientName);
        if (!item) return false;

        // 1. Convert consumption amount to system unit
        const consumed = toSystemUnit(recipeAmount, recipeUnit, ingredientName);
        const currentQty = item.quantity || 0;
        const currentUnit = item.unit || "count";

        // Ensure units match (simple check)
        if (consumed.unit !== currentUnit) {
          console.warn(`Unit mismatch in consume: ${consumed.unit} vs ${currentUnit}`);
          return false;
        }

        // 2. Calculate new quantity
        const newQty = Math.max(0, currentQty - consumed.amount);

        // 3. Update Usage History
        const newEvent: UsageEvent = {
          timestamp: new Date().toISOString(),
          amount: consumed.amount
        };
        const updatedHistory = [...(item.usageHistory || []), newEvent];

        // 4. Update Status & Stock Percentage
        const originalQty = item.originalQuantity || (item.quantity && item.quantity > newQty ? item.quantity : newQty) || 1;
        // If originalQuantity wasn't set (legacy items), assume previous qty was original if it was higher? 
        // Or just use new max. Let's try to be smart.

        const newPercentage = Math.round((newQty / originalQty) * 100);
        let newStatus: "good" | "low" | "expiring" = "good";

        if (newPercentage <= 25) newStatus = "low";
        if (item.expiresIn && new Date(item.expiresIn) < new Date()) newStatus = "expiring";

        // 5. Save Updates
        await updateItem(item.id, {
          quantity: newQty,
          stockPercentage: newPercentage,
          status: newStatus,
          usageHistory: updatedHistory,
          originalQuantity: originalQty
          // ensure originalQuantity is preserved or set
        });

        console.log(`Consumed ${consumed.amount}${consumed.unit} of ${item.name}. Remaining: ${newQty}`);
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
