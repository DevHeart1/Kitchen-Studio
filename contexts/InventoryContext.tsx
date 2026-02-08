import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase, DbInventoryItem } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

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
  unit?: string;
  expiresIn?: string;
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
  expiresIn: item.expires_in || undefined,
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
  unit: item.unit || "pcs",
  expires_in: item.expiresIn || null,
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
        if (useSupabase) {
          const dbItem = frontendToDb(item, DEMO_USER_ID);
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
          console.log("Item added to inventory:", newItem.name);
          return true;
        } else {
          // AsyncStorage fallback
          const newItem: InventoryItem = {
            ...item,
            id: Date.now().toString(),
            normalizedName: normalizeIngredientName(item.name),
          };

          const updated = [...inventory, newItem];
          setInventory(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          console.log("Item added to inventory:", newItem.name);
          return true;
        }
      } catch (error) {
        console.log("Error adding item:", error);
        return false;
      }
    },
    [inventory, useSupabase]
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

      const substitutes: Record<string, string[]> = {
        "kosher salt": ["salt", "table salt", "sea salt"],
        "table salt": ["salt", "kosher salt", "sea salt"],
        "fresh parsley": ["parsley", "dried parsley", "cilantro"],
        "fresh garlic": ["garlic", "garlic cloves", "minced garlic"],
        "olive oil": ["vegetable oil", "canola oil"],
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
      getTotalCount,
      getExpiringCount,
    ]
  );
});
