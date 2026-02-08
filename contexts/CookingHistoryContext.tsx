import { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { RecentCook } from "@/types";

const STORAGE_KEY = "cooking_history";

export const [CookingHistoryProvider, useCookingHistory] = createContextHook(() => {
  const [cookingSessions, setCookingSessions] = useState<RecentCook[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecentCook[];
        setCookingSessions(parsed);
        console.log("[CookingHistory] Loaded", parsed.length, "sessions");
      }
    } catch (error) {
      console.log("[CookingHistory] Error loading:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const persist = async (sessions: RecentCook[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.log("[CookingHistory] Error persisting:", error);
    }
  };

  const addSession = useCallback(async (session: RecentCook) => {
    const updated = [session, ...cookingSessions];
    setCookingSessions(updated);
    await persist(updated);
    console.log("[CookingHistory] Added session:", session.title);
    return session;
  }, [cookingSessions]);

  const updateSession = useCallback(async (sessionId: string, updates: Partial<RecentCook>) => {
    const updated = cookingSessions.map((s) =>
      s.id === sessionId ? { ...s, ...updates } : s
    );
    setCookingSessions(updated);
    await persist(updated);
    console.log("[CookingHistory] Updated session:", sessionId);
  }, [cookingSessions]);

  const removeSession = useCallback(async (sessionId: string) => {
    const updated = cookingSessions.filter((s) => s.id !== sessionId);
    setCookingSessions(updated);
    await persist(updated);
    console.log("[CookingHistory] Removed session:", sessionId);
  }, [cookingSessions]);

  const getSession = useCallback((sessionId: string) => {
    return cookingSessions.find((s) => s.id === sessionId) ?? null;
  }, [cookingSessions]);

  const inProgressSessions = useMemo(() => {
    return cookingSessions.filter((s) => s.progress < 100);
  }, [cookingSessions]);

  const completedSessions = useMemo(() => {
    return cookingSessions.filter((s) => s.progress === 100);
  }, [cookingSessions]);

  const activeCookingSession = useMemo(() => {
    return cookingSessions.find((s) => s.progress < 100) ?? null;
  }, [cookingSessions]);

  return useMemo(() => ({
    cookingSessions,
    isLoading,
    addSession,
    updateSession,
    removeSession,
    getSession,
    inProgressSessions,
    completedSessions,
    activeCookingSession,
    refreshHistory: loadHistory,
  }), [
    cookingSessions,
    isLoading,
    addSession,
    updateSession,
    removeSession,
    getSession,
    inProgressSessions,
    completedSessions,
    activeCookingSession,
  ]);
});
