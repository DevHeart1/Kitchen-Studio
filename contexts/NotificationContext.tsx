import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import createContextHook from "@nkzw/create-context-hook";
import { useInventory, InventoryItem } from "@/contexts/InventoryContext";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification, NotificationType } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const NOTIFICATIONS_TABLE = "notifications";
const LAST_AI_CHECK_KEY = "last_ai_recommendation_check"; // Keep this local for now or move to user settings
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
  const prevInventoryRef = useRef<string>("");
  const queryClient = useQueryClient();

  const loadNotifications = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from(NOTIFICATIONS_TABLE)
        .select("*")
        .eq("user_id", user.id)
        .order("timestamp", { ascending: false });

      if (error) throw error;

      const parsed: Notification[] = (data || []).map((n: any) => ({
        id: n.id,
        type: n.type as NotificationType,
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read,
        dismissed: n.dismissed,
        priority: n.priority,
        image: n.image,
        actionLabel: n.action_label,
        actionRoute: n.action_route,
        actionParams: n.action_params,
        relatedItems: n.related_items,
        aiGenerated: n.ai_generated,
      }));

      setNotifications(parsed.filter(n => !n.dismissed));
    } catch (e) {
      console.log("[Notifications] Error loading from Supabase:", e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('notifications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: NOTIFICATIONS_TABLE,
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadNotifications]);

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

  const addNotificationToDb = useCallback(async (notif: Partial<Notification>) => {
    if (!user) return;
    try {
      const dbNotif = {
        user_id: user.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        timestamp: notif.timestamp,
        read: notif.read,
        dismissed: notif.dismissed,
        priority: notif.priority,
        image: notif.image,
        action_label: notif.actionLabel,
        action_route: notif.actionRoute,
        action_params: notif.actionParams,
        related_items: notif.relatedItems,
        ai_generated: notif.aiGenerated,
      };

      const { error } = await supabase.from(NOTIFICATIONS_TABLE).insert(dbNotif);
      if (error) throw error;
    } catch (e) {
      console.error("[Notifications] Error adding to DB:", e);
    }
  }, [user]);

  useEffect(() => {
    if (inventory.length === 0 || !user) return;

    const inventoryKey = inventory.map(i => `${i.id}-${i.status}-${i.expiresIn}`).join("|");
    if (inventoryKey === prevInventoryRef.current) return;
    prevInventoryRef.current = inventoryKey;

    console.log("[Notifications] Inventory changed, checking for expiry alerts...");
    const expiryNotifs = generateExpiryNotifications(inventory);

    const newNotifs = expiryNotifs.filter(en => {
      return !notifications.some(existing => existing.title === en.title && !existing.dismissed);
    });

    if (newNotifs.length > 0) {
      newNotifs.forEach(n => {
        addNotificationToDb({ ...n, aiGenerated: false });
      });
    }
  }, [inventory, user, notifications, addNotificationToDb]);

  const fetchAIRecommendations = useCallback(async () => {
    if (inventory.length === 0 || isGeneratingAI || !user) return;

    try {
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

      const aiNotifs = result.recommendations.map((rec: any) => {
        let notifType: NotificationType = "smart_recommendation";
        if (rec.type === "expiry_warning") notifType = "expiry_warning";
        else if (rec.type === "recipe_suggestion") notifType = "recipe_suggestion";
        else if (rec.type === "storage_tip") notifType = "storage_tip";
        else if (rec.type === "waste_reduction") notifType = "waste_reduction";

        return {
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

      for (const n of aiNotifs) {
        if (!notifications.some(ex => ex.title === n.title)) {
          await addNotificationToDb(n);
        }
      }

      console.log(`[Notifications] Generated ${aiNotifs.length} AI recommendations`);
    } catch (e) {
      console.error("[Notifications] AI recommendations error:", e);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [inventory, isGeneratingAI, user, recommendationsMutation, addNotificationToDb, notifications]);

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

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await supabase.from(NOTIFICATIONS_TABLE).update({ read: true }).eq('id', id);
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      if (user) {
        await supabase.from(NOTIFICATIONS_TABLE).update({ read: true }).eq('user_id', user.id);
      }
    } catch (e) {
      console.error("Failed to mark all as read:", e);
    }
  }, [user]);

  const dismissNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await supabase.from(NOTIFICATIONS_TABLE).update({ dismissed: true }).eq('id', id);
    } catch (e) {
      console.error("Failed to dismiss:", e);
    }
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      if (user) {
        await supabase.from(NOTIFICATIONS_TABLE).delete().eq('user_id', user.id);
      }
    } catch (e) {
      console.error("Failed to clear all:", e);
    }
  }, [user]);

  const addNotification = useCallback(async (notif: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif = {
      ...notif,
      timestamp: new Date().toISOString(),
      read: false,
      aiGenerated: notif.aiGenerated || false
    };
    await addNotificationToDb(newNotif);
  }, [addNotificationToDb]);

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
