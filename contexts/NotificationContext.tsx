import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useInventory, InventoryItem } from "@/contexts/InventoryContext";
import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";
import { Notification, NotificationType } from "@/types";
import { useAuth } from "./AuthContext";

const NOTIFICATIONS_KEY_PREFIX = "app_notifications_v2_";
const LAST_AI_CHECK_KEY = "last_ai_recommendation_check";
const AI_CHECK_INTERVAL = 4 * 60 * 60 * 1000;

interface ShelfLifeEstimate {
  name: string;
  shelfLifeDays: number;
  expiryDate: string | null;
  perishability: "perishable" | "semi_perishable" | "non_perishable";
  storageAdvice: string;
  spoilageSign: string;
}

const parseExpiryDate = (expiresIn?: string): Date | null => {
  if (!expiresIn) return null;

  const dateMatch = expiresIn.match(/^\d{4}-\d{2}-\d{2}$/);
  if (dateMatch) {
    const d = new Date(expiresIn + "T00:00:00");
    if (!isNaN(d.getTime())) return d;
  }

  const lower = expiresIn.toLowerCase();
  if (lower === "expired") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }
  if (lower === "soon" || lower === "expiring soon") {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  }

  const daysMatch = lower.match(/(\d+)\s*days?/);
  if (daysMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(daysMatch[1]));
    return d;
  }

  return null;
};

const getDaysUntilExpiry = (expiresIn?: string): number | null => {
  const date = parseExpiryDate(expiresIn);
  if (!date) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

const generateExpiryNotifications = (inventory: InventoryItem[]): Notification[] => {
  const notifications: Notification[] = [];
  const now = new Date().toISOString();

  for (const item of inventory) {
    const daysLeft = getDaysUntilExpiry(item.expiresIn);

    if (daysLeft !== null && daysLeft < 0) {
      notifications.push({
        id: `expiry-expired-${item.id}`,
        type: "expiry_urgent",
        title: `${item.name} Has Expired`,
        message: `This item expired ${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? "s" : ""} ago. Consider discarding it or checking if it's still safe to consume.`,
        timestamp: now,
        read: false,
        priority: "high",
        relatedItems: [item.name],
        actionLabel: "View Pantry",
        actionRoute: "/inventory",
      });
    } else if (daysLeft !== null && daysLeft <= 1) {
      notifications.push({
        id: `expiry-urgent-${item.id}`,
        type: "expiry_urgent",
        title: `${item.name} Expires ${daysLeft === 0 ? "Today" : "Tomorrow"}!`,
        message: `Use it now or freeze it to extend its life. Don't let it go to waste!`,
        timestamp: now,
        read: false,
        priority: "high",
        relatedItems: [item.name],
        actionLabel: "Find Recipes",
        actionRoute: "/pantry-recipes",
      });
    } else if (daysLeft !== null && daysLeft <= 3) {
      notifications.push({
        id: `expiry-soon-${item.id}`,
        type: "expiry_warning",
        title: `${item.name} Expiring in ${daysLeft} Days`,
        message: `Plan to use this item soon. We can suggest recipes that use ${item.name.toLowerCase()}.`,
        timestamp: now,
        read: false,
        priority: "high",
        relatedItems: [item.name],
        actionLabel: "Find Recipes",
        actionRoute: "/pantry-recipes",
      });
    } else if (daysLeft !== null && daysLeft <= 7) {
      notifications.push({
        id: `expiry-week-${item.id}`,
        type: "expiry_warning",
        title: `${item.name} Expires This Week`,
        message: `You have about ${daysLeft} days to use this item. Consider meal planning around it.`,
        timestamp: now,
        read: false,
        priority: "medium",
        relatedItems: [item.name],
      });
    }

    if (item.status === "low" && item.stockPercentage <= 20) {
      notifications.push({
        id: `low-stock-${item.id}`,
        type: "ingredient_alert",
        title: `Running Low on ${item.name}`,
        message: `Only about ${item.stockPercentage}% left. Add it to your shopping list.`,
        timestamp: now,
        read: false,
        priority: "low",
        relatedItems: [item.name],
      });
    }
  }

  return notifications;
};

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const { inventory } = useInventory();
  const { user } = useAuth();
  const userId = user?.id || "guest"; // Fallback for demo mode

  const notificationsKey = `${NOTIFICATIONS_KEY_PREFIX}${userId}`;
  const prevInventoryRef = useRef<string>("");
  const recommendationsMutation = useMutation({
    mutationFn: async (data: { inventoryItems: any[] }) => {
      const { data: response, error } = await supabase.functions.invoke('pantry-scan', {
        body: { action: 'getSmartRecommendations', ...data }
      });
      if (error) throw error;
      if (response && response.error) throw new Error(response.error);
      return response;
    }
  });

  const shelfLifeMutation = useMutation({
    mutationFn: async (data: { items: any[] }) => {
      const { data: response, error } = await supabase.functions.invoke('pantry-scan', {
        body: { action: 'estimateShelfLife', ...data }
      });
      if (error) throw error;
      if (response && response.error) throw new Error(response.error);
      return response;
    }
  });

  useEffect(() => {
    loadPersistedState();
  }, [userId]); // Reload when user changes

  const loadPersistedState = async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem(notificationsKey);
      if (stored) {
        const parsed: Notification[] = JSON.parse(stored);
        setNotifications(parsed.filter(n => !n.dismissed));
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.log("[Notifications] Error loading:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const persistNotifications = useCallback(async (notifs: Notification[]) => {
    try {
      await AsyncStorage.setItem(notificationsKey, JSON.stringify(notifs));
    } catch (e) {
      console.log("[Notifications] Error persisting:", e);
    }
  }, [notificationsKey]);

  useEffect(() => {
    if (inventory.length === 0) return;

    const inventoryKey = inventory.map(i => `${i.id}-${i.status}-${i.expiresIn}`).join("|");
    if (inventoryKey === prevInventoryRef.current) return;
    prevInventoryRef.current = inventoryKey;

    console.log("[Notifications] Inventory changed, generating expiry notifications...");
    const expiryNotifs = generateExpiryNotifications(inventory);

    setNotifications(prev => {
      const aiNotifs = prev.filter(n => n.aiGenerated);
      const manualNotifs = prev.filter(n => !n.aiGenerated && !n.type.startsWith("expiry") && n.type !== "ingredient_alert");

      const merged = [...expiryNotifs, ...aiNotifs, ...manualNotifs];

      const readMap = new Map<string, boolean>();
      prev.forEach(n => { if (n.read) readMap.set(n.id, true); });
      const withReadState = merged.map(n => ({
        ...n,
        read: readMap.has(n.id) ? true : n.read,
      }));

      persistNotifications(withReadState);
      return withReadState;
    });
  }, [inventory, persistNotifications]);

  const fetchAIRecommendations = useCallback(async () => {
    if (inventory.length === 0 || isGeneratingAI) return;

    try {
      const lastCheck = await AsyncStorage.getItem(LAST_AI_CHECK_KEY);
      if (lastCheck) {
        const elapsed = Date.now() - parseInt(lastCheck);
        if (elapsed < AI_CHECK_INTERVAL) {
          console.log("[Notifications] AI check skipped - too recent");
          return;
        }
      }

      setIsGeneratingAI(true);
      console.log("[Notifications] Fetching AI recommendations...");

      const inventoryItems = inventory.map(i => ({
        name: i.name,
        category: i.category,
        status: i.status,
        expiresIn: i.expiresIn,
        stockPercentage: i.stockPercentage,
      }));

      const result = await recommendationsMutation.mutateAsync({ inventoryItems });

      const aiNotifs: Notification[] = result.recommendations.map((rec: any) => {
        let notifType: NotificationType = "smart_recommendation";
        if (rec.type === "expiry_warning") notifType = "expiry_warning";
        else if (rec.type === "recipe_suggestion") notifType = "recipe_suggestion";
        else if (rec.type === "storage_tip") notifType = "storage_tip";
        else if (rec.type === "waste_reduction") notifType = "waste_reduction";

        return {
          id: `ai-${rec.id}`,
          type: notifType,
          title: rec.title,
          message: rec.message,
          timestamp: new Date().toISOString(),
          read: false,
          priority: rec.priority,
          relatedItems: rec.relatedItems,
          actionLabel: rec.actionLabel || undefined,
          actionRoute: rec.type === "recipe_suggestion" ? "/pantry-recipes" : undefined,
          aiGenerated: true,
        };
      });

      setNotifications(prev => {
        const nonAI = prev.filter(n => !n.aiGenerated);
        const merged = [...nonAI, ...aiNotifs];
        persistNotifications(merged);
        return merged;
      });

      await AsyncStorage.setItem(LAST_AI_CHECK_KEY, Date.now().toString());
      console.log(`[Notifications] Generated ${aiNotifs.length} AI recommendations`);
    } catch (e) {
      console.error("[Notifications] AI recommendations error:", e);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [inventory, isGeneratingAI, recommendationsMutation, persistNotifications]);

  const estimateShelfLifeForItems = useCallback(async (items: { name: string; category: string; isPackaged?: boolean }[]): Promise<ShelfLifeEstimate[]> => {
    try {
      console.log("[Notifications] Estimating shelf life for", items.length, "items");
      const result = await shelfLifeMutation.mutateAsync({ items });
      return result.items;
    } catch (e) {
      console.error("[Notifications] Shelf life estimation error:", e);
      return [];
    }
  }, [shelfLifeMutation]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      persistNotifications(updated);
      return updated;
    });
  }, [persistNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persistNotifications(updated);
      return updated;
    });
  }, [persistNotifications]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      persistNotifications(updated);
      return updated;
    });
  }, [persistNotifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    persistNotifications([]);
  }, [persistNotifications]);

  const addNotification = useCallback((notif: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif: Notification = {
      ...notif,
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      persistNotifications(updated);
      return updated;
    });
  }, [persistNotifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const sortedNotifications = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return [...notifications].sort((a, b) => {
      const pa = priorityOrder[a.priority || "medium"];
      const pb = priorityOrder[b.priority || "medium"];
      if (pa !== pb) return pa - pb;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [notifications]);

  return useMemo(() => ({
    notifications: sortedNotifications,
    isLoading,
    isGeneratingAI,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAll,
    addNotification,
    fetchAIRecommendations,
    estimateShelfLifeForItems,
  }), [
    sortedNotifications, isLoading, isGeneratingAI, unreadCount,
    markAsRead, markAllAsRead, dismissNotification, clearAll,
    addNotification, fetchAIRecommendations, estimateShelfLifeForItems,
  ]);
});
