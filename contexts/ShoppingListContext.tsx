import React, { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

export interface ShoppingListItem {
    id: string;
    name: string;
    amount?: string;
    image?: string;
    isChecked: boolean;
    category: string;
}

interface DbShoppingListItem {
    id: string;
    user_id: string;
    name: string;
    amount: string | null;
    image: string | null;
    is_checked: boolean;
    category: string;
    created_at: string;
}

const STORAGE_KEY = "shopping_list";

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    return !!url && !url.includes("your-project");
};

const dbToFrontend = (item: DbShoppingListItem): ShoppingListItem => ({
    id: item.id,
    name: item.name,
    amount: item.amount || undefined,
    image: item.image || undefined,
    isChecked: item.is_checked,
    category: item.category || "Uncategorized",
});

const frontendToDb = (
    item: Omit<ShoppingListItem, "id" | "isChecked"> & { isChecked?: boolean },
    userId: string
): Omit<DbShoppingListItem, "id" | "created_at"> => ({
    user_id: userId,
    name: item.name,
    amount: item.amount || null,
    image: item.image || null,
    is_checked: item.isChecked || false,
    category: item.category || "Uncategorized",
});

export const [ShoppingListProvider, useShoppingList] = createContextHook(() => {
    const [items, setItems] = useState<ShoppingListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user, getUserId } = useAuth();
    const useSupabase = isSupabaseConfigured();
    const userId = getUserId();

    useEffect(() => {
        loadList();
    }, [userId]);

    const loadList = async () => {
        try {
            if (useSupabase && userId) {
                const { data, error } = await supabase
                    .from("shopping_list")
                    .select("*")
                    .eq("user_id", userId)
                    .order("is_checked", { ascending: true })
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("[ShoppingList] Supabase error:", error.message);
                    await loadFromAsyncStorage();
                } else {
                    setItems(data ? data.map(dbToFrontend) : []);
                }
            } else {
                await loadFromAsyncStorage();
            }
        } catch (error) {
            console.log("Error loading shopping list:", error);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadFromAsyncStorage = async () => {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
            setItems(JSON.parse(stored));
        } else {
            setItems([]);
        }
    };

    const saveToAsyncStorage = async (newItems: ShoppingListItem[]) => {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    };

    const addItem = useCallback(
        async (item: Omit<ShoppingListItem, "id" | "isChecked">) => {
            const newItemTemp: ShoppingListItem = {
                ...item,
                id: Date.now().toString(),
                isChecked: false,
            };

            // Optimistic update
            setItems((prev) => [newItemTemp, ...prev]);

            try {
                if (useSupabase && userId) {
                    const dbItem = frontendToDb(item, userId);
                    const { data, error } = await supabase
                        .from("shopping_list")
                        .insert(dbItem)
                        .select()
                        .single();

                    if (error) {
                        console.error("[ShoppingList] Insert error:", error.message);
                        // Revert or fallback (here we keep optimistic for now but should handle error)
                        return false;
                    } else {
                        // Replace temp item with real DB item
                        setItems((prev) =>
                            prev.map((i) => (i.id === newItemTemp.id ? dbToFrontend(data) : i))
                        );
                    }
                } else {
                    const updated = [newItemTemp, ...items];
                    await saveToAsyncStorage(updated);
                }
                return true;
            } catch (error) {
                console.log("Error adding item:", error);
                return false;
            }
        },
        [items, useSupabase, userId]
    );

    const toggleItem = useCallback(
        async (id: string) => {
            const itemToToggle = items.find((i) => i.id === id);
            if (!itemToToggle) return;

            const newStatus = !itemToToggle.isChecked;

            // Optimistic update
            setItems((prev) =>
                prev.map((i) => (i.id === id ? { ...i, isChecked: newStatus } : i))
            );

            try {
                if (useSupabase && userId) {
                    const { error } = await supabase
                        .from("shopping_list")
                        .update({ is_checked: newStatus })
                        .eq("id", id);

                    if (error) console.error("[ShoppingList] Toggle error:", error.message);
                } else {
                    const updated = items.map((i) => (i.id === id ? { ...i, isChecked: newStatus } : i));
                    await saveToAsyncStorage(updated);
                }
            } catch (error) {
                console.log("Error toggling item:", error);
            }
        },
        [items, useSupabase, userId]
    );

    const removeItem = useCallback(
        async (id: string) => {
            // Optimistic update
            setItems((prev) => prev.filter((i) => i.id !== id));

            try {
                if (useSupabase && userId) {
                    const { error } = await supabase
                        .from("shopping_list")
                        .delete()
                        .eq("id", id);

                    if (error) console.error("[ShoppingList] Delete error:", error.message);
                } else {
                    const updated = items.filter((i) => i.id !== id);
                    await saveToAsyncStorage(updated);
                }
            } catch (error) {
                console.log("Error removing item:", error);
            }
        },
        [items, useSupabase, userId]
    );

    const clearChecked = useCallback(async () => {
        // Optimistic
        setItems((prev) => prev.filter((i) => !i.isChecked));

        try {
            if (useSupabase && userId) {
                const { error } = await supabase
                    .from("shopping_list")
                    .delete()
                    .eq("user_id", userId)
                    .eq("is_checked", true);

                if (error) console.error("[ShoppingList] Clear checked error:", error.message);
            } else {
                const updated = items.filter((i) => !i.isChecked);
                await saveToAsyncStorage(updated);
            }
        } catch (error) {
            console.log("Error clearing checked items:", error);
        }
    }, [items, useSupabase, userId]);

    return {
        items,
        isLoading,
        addItem,
        toggleItem,
        removeItem,
        clearChecked,
        refreshList: loadList,
    };
});
