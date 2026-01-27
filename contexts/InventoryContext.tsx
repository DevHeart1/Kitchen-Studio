import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

export interface InventoryItem {
  id: string;
  name: string;
  normalizedName: string;
  image: string;
  category: string;
  addedDate: string;
  status: "good" | "low" | "expiring";
  stockPercentage: number;
  expiresIn?: string;
}

const STORAGE_KEY = "pantry_inventory";

const DEFAULT_INVENTORY: InventoryItem[] = [
  {
    id: "1-1",
    name: "Extra Virgin Olive Oil",
    normalizedName: "olive oil",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGihIrsVtJRXiaNrreWJ3lM36p0d3HqJYFX5GfaAqlOPdgqetMaggvadRosPF4KsiZcrN9Xpcn_1GSKCoLMrRZNegS43G0NSdJpcevWkvKtuWmjkozS7lRFoXkjR2UaTu3Nby-s526Ct-5mmUEuAjvYyx1hexJZ9u4p8_konOz-p-t0C65FMjWeLoN1H1CwoxoRTug4tOPB6wfuaxNCZ_2N_PuzX8UPeOkPE02YfJ-S6NccQzIoVcrtN0tlLgAu9sij7Qd1qG3Dw",
    category: "Oils & Spices",
    addedDate: "Added 2 days ago",
    status: "good",
    stockPercentage: 75,
  },
  {
    id: "1-2",
    name: "Garlic Cloves",
    normalizedName: "garlic",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUuHZTd2EL84IxLzodhX6BSnuiMWOsvVrJ_PI7i0V24zTPHLL8gvOMBQ5nbl-UrrnMOvDvTOhRj40j9_Dp8ykRFnxe8nuLvdDi0xmGOpPGtTpja-6Nci0g_jGEGwj-fv9Kmm8Gj7icidipi4QGdsho4ofbJAMXdfWSE24c2AKoISz4IkBZgHBkG4PuWxXDi2RqkLBNHOIXRSHHSC0SzcGwif9tTNp3EFl9gwLTJovDGmFfkZyuzOGahIMizI0ZV_Ev90A4IrUegA",
    category: "Oils & Spices",
    addedDate: "Added 5 days ago",
    status: "low",
    stockPercentage: 25,
  },
  {
    id: "2-1",
    name: "Spaghetti Pasta",
    normalizedName: "pasta",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyBHuo2syefoICrth20zOOkyxJGr7IdioHXX-118lN1ydGbO7e3ZPyodX6okmABO7GfEhV8_swxL0zAeoHPt21YSECsfgKSqfn_KcEABDsgS2qwQtEvVjKVowT4dB_jkoBTD0eqbxJIIV51irecbAEK3FanqFcQ2Dn9hDLHdY6wqtcS6GOnfeXVDFvDPi7Q6xM9vuTawlj6HcvCipskJhvFNrTWJ_r79kTXxoIflzGxRD9a28b9EGLfBKbjqmb8bwEwUoeGb8Zig",
    category: "Grains & Pasta",
    addedDate: "Added 1 week ago",
    status: "good",
    stockPercentage: 100,
  },
  {
    id: "2-2",
    name: "Brown Rice",
    normalizedName: "rice",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFBjVsYo6FI2HtenEQ0CdD7FS-eF3Oag5PxJIgXbPa32CRyiVIZDnvnBhlqRp-f_yPGTwlbIV4-ugkDmG0Wu5__MhnJXabpzmoKB8-ygnCmCwVqSpFXiX38e0P6vffaE1J9Gs8zjtJ8l9ul3Vb5xPcAKXtas4oELv1CUTY-dKAAzBdllbIx_LMn2kzZngy7OM31RwT7zr_az9ePjV4uolVWuHo8ipQxZUC8tmymVyfAbj5LjW717BV1gBy-NWs6WOS17NSnGMRaQ",
    category: "Grains & Pasta",
    addedDate: "Expires in 2 days",
    status: "expiring",
    stockPercentage: 50,
    expiresIn: "2 days",
  },
  {
    id: "3-1",
    name: "Fresh Salmon Fillet",
    normalizedName: "salmon",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuARg6uLtked95kTG0C5p5SRtNryHxrdaIGcD1hMIRwlCp2H0Xnt9NIZnbi01naMTFFqqzLxaf97lrt4L4QA-pQA6EXeU4etHmHrYKHgF16LkIENW2mramX5I8INSM_6hI81K7DAmysd4xv2NbQGtqZuLs2L6rNYSE3qvr6MaXqHHVIqAEcPvRDDdpTrF6qHyQe8fBtD409m2x9mwyvuz_w7ivtFS5Abn1DcDGnfASmo3lYm7u62cXCvbvAoDxgvTtTiM3DFdZrZmQ",
    category: "Proteins",
    addedDate: "Expires in 1 day",
    status: "expiring",
    stockPercentage: 100,
    expiresIn: "1 day",
  },
  {
    id: "4-1",
    name: "Unsalted Butter",
    normalizedName: "butter",
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=200",
    category: "Dairy",
    addedDate: "Added 3 days ago",
    status: "good",
    stockPercentage: 80,
  },
  {
    id: "4-2",
    name: "Fresh Lemon",
    normalizedName: "lemon",
    image: "https://images.unsplash.com/photo-1582087463261-ddea03f80f5d?w=200",
    category: "Produce",
    addedDate: "Added 4 days ago",
    status: "good",
    stockPercentage: 60,
  },
  {
    id: "4-3",
    name: "Table Salt",
    normalizedName: "salt",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBA-7sCtfjffeCbyNeMwxGx0ZAwPeGwFGrM3RfQtcU-2AZ9Vk6mleSdAYDLzy5Ow6sT31SJbvBvJQwIbcmYi2s9dKyp9fMcvnm13h_1Drc5CMYo9EjX6gCQK6U7nthgiA4oLqh1kad8_TgtELWCvGz6L5Gr5KAHLh7y_hIQbqOyrtVB2QFqTM0l_Mih6P2wMFDqM5yCyGV8pljXtNn_E5hSz57MWjKZCAGYd7vS4HXs_zR8i7YzfK7pPj0ZdcsSalaY2Q-yCdhxow",
    category: "Oils & Spices",
    addedDate: "Added 1 week ago",
    status: "good",
    stockPercentage: 90,
  },
];

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

export const [InventoryProvider, useInventory] = createContextHook(() => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setInventory(JSON.parse(stored));
      } else {
        setInventory(DEFAULT_INVENTORY);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_INVENTORY));
      }
    } catch (error) {
      console.log("Error loading inventory:", error);
      setInventory(DEFAULT_INVENTORY);
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = useCallback(async (item: Omit<InventoryItem, "id" | "normalizedName">) => {
    const newItem: InventoryItem = {
      ...item,
      id: Date.now().toString(),
      normalizedName: normalizeIngredientName(item.name),
    };
    
    const updated = [...inventory, newItem];
    setInventory(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("Item added to inventory:", newItem.name);
      return true;
    } catch (error) {
      console.log("Error adding item:", error);
      return false;
    }
  }, [inventory]);

  const removeItem = useCallback(async (itemId: string) => {
    const updated = inventory.filter((item) => item.id !== itemId);
    setInventory(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("Item removed from inventory");
      return true;
    } catch (error) {
      console.log("Error removing item:", error);
      return false;
    }
  }, [inventory]);

  const updateItem = useCallback(async (itemId: string, updates: Partial<InventoryItem>) => {
    const updated = inventory.map((item) =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    setInventory(updated);
    
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.log("Error updating item:", error);
      return false;
    }
  }, [inventory]);

  const checkIngredientInPantry = useCallback((ingredientName: string): {
    found: boolean;
    item?: InventoryItem;
    hasSubstitute: boolean;
    substituteItem?: InventoryItem;
  } => {
    const normalized = normalizeIngredientName(ingredientName);
    
    const directMatch = inventory.find((item) => {
      const itemNormalized = item.normalizedName || normalizeIngredientName(item.name);
      return itemNormalized.includes(normalized) || normalized.includes(itemNormalized);
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
        const itemNormalized = item.normalizedName || normalizeIngredientName(item.name);
        return itemNormalized.includes(sub) || sub.includes(itemNormalized);
      });
      if (subMatch) {
        return { found: false, hasSubstitute: true, substituteItem: subMatch };
      }
    }

    return { found: false, hasSubstitute: false };
  }, [inventory]);

  const getTotalCount = useMemo(() => inventory.length, [inventory]);
  
  const getExpiringCount = useMemo(() => 
    inventory.filter((item) => item.status === "expiring").length,
  [inventory]);

  return useMemo(() => ({
    inventory,
    isLoading,
    addItem,
    removeItem,
    updateItem,
    checkIngredientInPantry,
    getTotalCount,
    getExpiringCount,
    refreshInventory: loadInventory,
  }), [inventory, isLoading, addItem, removeItem, updateItem, checkIngredientInPantry, getTotalCount, getExpiringCount]);
});
