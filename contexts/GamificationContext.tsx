import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";

// ── XP Award Table ──────────────────────────────────────────────
const XP_VALUES = {
    complete_cook: 100,
    save_recipe: 25,
    scan_item: 15,
    manual_add_item: 10,
    ai_recipe: 30,
    share_recipe: 20,
    daily_streak: 10,
} as const;

export type XPAction = keyof typeof XP_VALUES;

// ── Achievement Definitions ─────────────────────────────────────
export interface AchievementDef {
    id: string;
    name: string;
    description: string;
    requirement: string;
    icon: string;
    color: string;
    gradientFrom: string;
    gradientTo: string;
    xpReward: number;
    reward?: string;
    rewardType?: "skin" | "recipe" | "tool" | "title";
    getProgress: (stats: GamificationStats) => { current: number; max: number };
}

interface GamificationStats {
    recipesCompleted: number;
    inventoryCount: number;
    savedRecipesCount: number;
    sharedRecipesCount: number;
    totalCookSessions: number;
    totalXP: number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
    {
        id: "1",
        name: "Pantry Master",
        description: "Stock your pantry to the max",
        requirement: "Stock 50 unique ingredients in your pantry inventory.",
        icon: "package",
        color: "#f97316",
        gradientFrom: "#f97316",
        gradientTo: "#ea580c",
        xpReward: 300,
        reward: "Title",
        rewardType: "title",
        getProgress: (s) => ({ current: Math.min(s.inventoryCount, 50), max: 50 }),
    },
    {
        id: "2",
        name: "Knife Pro",
        description: "Perfect cuts streak",
        requirement: "Complete 10 cooking sessions.",
        icon: "utensils-crossed",
        color: "#3b82f6",
        gradientFrom: "#3b82f6",
        gradientTo: "#2563eb",
        xpReward: 350,
        reward: "Recipe",
        rewardType: "recipe",
        getProgress: (s) => ({ current: Math.min(s.recipesCompleted, 10), max: 10 }),
    },
    {
        id: "3",
        name: "Sauce Boss",
        description: "Master of flavors",
        requirement: "Complete 5 cooking sessions.",
        icon: "soup",
        color: "#a855f7",
        gradientFrom: "#a855f7",
        gradientTo: "#ec4899",
        xpReward: 400,
        reward: "Title",
        rewardType: "title",
        getProgress: (s) => ({ current: Math.min(s.recipesCompleted, 5), max: 5 }),
    },
    {
        id: "4",
        name: "Early Bird",
        description: "Rise and cook",
        requirement: "Complete 10 recipes.",
        icon: "sun",
        color: "#eab308",
        gradientFrom: "#eab308",
        gradientTo: "#f59e0b",
        xpReward: 250,
        reward: "Recipe",
        rewardType: "recipe",
        getProgress: (s) => ({ current: Math.min(s.recipesCompleted, 10), max: 10 }),
    },
    {
        id: "5",
        name: "Socialite",
        description: "Share the love",
        requirement: "Share 10 recipes with the community.",
        icon: "share-2",
        color: "#14b8a6",
        gradientFrom: "#14b8a6",
        gradientTo: "#0d9488",
        xpReward: 300,
        reward: "Title",
        rewardType: "title",
        getProgress: (s) => ({ current: Math.min(s.sharedRecipesCount, 10), max: 10 }),
    },
    {
        id: "6",
        name: "Speed Chef",
        description: "Cook with lightning speed",
        requirement: "Complete 20 cooking sessions.",
        icon: "flame",
        color: "#ef4444",
        gradientFrom: "#ef4444",
        gradientTo: "#dc2626",
        xpReward: 600,
        reward: "Skin",
        rewardType: "skin",
        getProgress: (s) => ({ current: Math.min(s.recipesCompleted, 20), max: 20 }),
    },
    {
        id: "7",
        name: "Master Baker",
        description: "Baking perfection",
        requirement: "Complete 15 cooking sessions.",
        icon: "cookie",
        color: "#d97706",
        gradientFrom: "#d97706",
        gradientTo: "#b45309",
        xpReward: 500,
        reward: "Recipe",
        rewardType: "recipe",
        getProgress: (s) => ({ current: Math.min(s.recipesCompleted, 15), max: 15 }),
    },
    {
        id: "8",
        name: "Wine Master",
        description: "Pair like a pro",
        requirement: "Complete 25 cooking sessions.",
        icon: "wine",
        color: "#7c3aed",
        gradientFrom: "#7c3aed",
        gradientTo: "#6d28d9",
        xpReward: 500,
        reward: "Tool",
        rewardType: "tool",
        getProgress: (s) => ({ current: Math.min(s.recipesCompleted, 25), max: 25 }),
    },
    {
        id: "9",
        name: "Efficiency King",
        description: "Never waste a second",
        requirement: "Save 20 recipes to your collection.",
        icon: "timer",
        color: "#06b6d4",
        gradientFrom: "#06b6d4",
        gradientTo: "#0891b2",
        xpReward: 400,
        reward: "Title",
        rewardType: "title",
        getProgress: (s) => ({ current: Math.min(s.savedRecipesCount, 20), max: 20 }),
    },
];

// ── Streak Storage ──────────────────────────────────────────────
const STREAK_KEY = "gamification_streak";
const GAMIFICATION_LOG_KEY = "gamification_action_log";

interface StreakData {
    currentStreak: number;
    lastActiveDate: string; // YYYY-MM-DD
    longestStreak: number;
}

// ── Toast Queue ─────────────────────────────────────────────────
export interface XPToastData {
    id: string;
    type: "xp" | "badge" | "streak" | "levelup";
    message: string;
    xpAmount?: number;
    badgeName?: string;
}

// ── Context ─────────────────────────────────────────────────────
interface GamificationContextType {
    awardXP: (action: XPAction) => Promise<void>;
    streak: StreakData;
    getStreakMultiplier: () => number;
    achievements: Array<AchievementDef & { unlocked: boolean; progress: number; progressMax: number; earnedDate?: string }>;
    toastQueue: XPToastData[];
    dismissToast: (id: string) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamification() {
    const ctx = useContext(GamificationContext);
    if (!ctx) throw new Error("useGamification must be within GamificationProvider");
    return ctx;
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const {
        profile,
        addXP,
        unlockBadge,
        incrementRecipesCompleted,
    } = useUserProfile();

    const { inventory } = useInventory();
    const { savedRecipes } = useSavedRecipes();
    const { completedSessions } = useCookingHistory();

    const [streak, setStreak] = useState<StreakData>({
        currentStreak: 0,
        lastActiveDate: "",
        longestStreak: 0,
    });
    const [toastQueue, setToastQueue] = useState<XPToastData[]>([]);
    const processedRef = useRef<Set<string>>(new Set());

    // ── Load Streak ─────────────────────────────────────────────
    useEffect(() => {
        loadStreak();
    }, []);

    const loadStreak = async () => {
        try {
            const stored = await AsyncStorage.getItem(STREAK_KEY);
            if (stored) {
                const data: StreakData = JSON.parse(stored);
                setStreak(data);
                checkDailyStreak(data);
            } else {
                // First ever open
                const today = getTodayStr();
                const newStreak: StreakData = {
                    currentStreak: 1,
                    lastActiveDate: today,
                    longestStreak: 1,
                };
                await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
                setStreak(newStreak);
                enqueueToast({ type: "streak", message: "Day 1 streak started! 🔥" });
            }
        } catch (e) {
            console.log("[Gamification] Streak load error:", e);
        }
    };

    const checkDailyStreak = async (data: StreakData) => {
        const today = getTodayStr();
        if (data.lastActiveDate === today) return; // Already counted today

        const yesterday = getYesterdayStr();
        let newStreak: StreakData;

        if (data.lastActiveDate === yesterday) {
            // Consecutive day
            const newCount = data.currentStreak + 1;
            newStreak = {
                currentStreak: newCount,
                lastActiveDate: today,
                longestStreak: Math.max(data.longestStreak, newCount),
            };
            enqueueToast({
                type: "streak",
                message: `${newCount}-day streak! 🔥`,
                xpAmount: XP_VALUES.daily_streak * getStreakMultiplierFromCount(newCount),
            });
            // Award streak XP
            const multiplier = getStreakMultiplierFromCount(newCount);
            await addXP(XP_VALUES.daily_streak * multiplier);
        } else {
            // Streak broken
            newStreak = {
                currentStreak: 1,
                lastActiveDate: today,
                longestStreak: data.longestStreak,
            };
            if (data.currentStreak > 1) {
                enqueueToast({ type: "streak", message: "Streak reset. Day 1! 🔥" });
            }
        }

        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
        setStreak(newStreak);
    };

    // ── XP Award ────────────────────────────────────────────────
    const awardXP = useCallback(async (action: XPAction) => {
        const baseXP = XP_VALUES[action];
        const multiplier = getStreakMultiplier();
        const finalXP = Math.round(baseXP * multiplier);

        console.log(`[Gamification] +${finalXP} XP for "${action}" (base: ${baseXP}, mult: ${multiplier}x)`);

        const result = await addXP(finalXP);

        enqueueToast({
            type: "xp",
            message: getActionLabel(action),
            xpAmount: finalXP,
        });

        if (result.leveledUp) {
            enqueueToast({
                type: "levelup",
                message: `Level ${result.newLevel}!`,
            });
        }

        // Check achievements after XP award
        setTimeout(() => checkAchievements(), 500);
    }, [addXP, streak]);

    // ── Achievement Checking ────────────────────────────────────
    const getStats = useCallback((): GamificationStats => {
        return {
            recipesCompleted: profile.stats.recipesCompleted,
            inventoryCount: inventory.length,
            savedRecipesCount: savedRecipes.length,
            sharedRecipesCount: profile.sharedRecipes?.length || 0,
            totalCookSessions: completedSessions.length,
            totalXP: profile.stats.totalXP,
        };
    }, [profile, inventory, savedRecipes, completedSessions]);

    const checkAchievements = useCallback(() => {
        const stats = getStats();
        const unlocked = new Set(profile.unlockedBadgeIds);

        ACHIEVEMENT_DEFS.forEach((achievement) => {
            if (unlocked.has(achievement.id)) return;
            const { current, max } = achievement.getProgress(stats);
            if (current >= max) {
                // Unlock!
                unlockBadge(achievement.id);
                addXP(achievement.xpReward);
                enqueueToast({
                    type: "badge",
                    message: "Achievement Unlocked!",
                    badgeName: achievement.name,
                    xpAmount: achievement.xpReward,
                });
                console.log(`[Gamification] 🏆 Badge unlocked: ${achievement.name}`);
            }
        });
    }, [getStats, profile.unlockedBadgeIds, unlockBadge, addXP]);

    // Run achievement check when relevant stats change
    useEffect(() => {
        if (profile.stats.totalXP > 0) {
            checkAchievements();
        }
    }, [
        profile.stats.recipesCompleted,
        inventory.length,
        savedRecipes.length,
        completedSessions.length,
    ]);

    // ── Computed Achievements ───────────────────────────────────
    const achievements = useMemo(() => {
        const stats = getStats();
        return ACHIEVEMENT_DEFS.map((def) => {
            const { current, max } = def.getProgress(stats);
            const isUnlocked = profile.unlockedBadgeIds.includes(def.id);
            return {
                ...def,
                unlocked: isUnlocked,
                progress: current,
                progressMax: max,
                earnedDate: isUnlocked ? "Earned" : undefined,
            };
        });
    }, [getStats, profile.unlockedBadgeIds]);

    // ── Streak Multiplier ───────────────────────────────────────
    const getStreakMultiplier = useCallback(() => {
        return getStreakMultiplierFromCount(streak.currentStreak);
    }, [streak.currentStreak]);

    // ── Toast Management ────────────────────────────────────────
    const enqueueToast = (toast: Omit<XPToastData, "id">) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setToastQueue((prev) => [...prev, { ...toast, id }]);
    };

    const dismissToast = useCallback((id: string) => {
        setToastQueue((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const value = useMemo(
        () => ({
            awardXP,
            streak,
            getStreakMultiplier,
            achievements,
            toastQueue,
            dismissToast,
        }),
        [awardXP, streak, getStreakMultiplier, achievements, toastQueue, dismissToast]
    );

    return (
        <GamificationContext.Provider value={value}>
            {children}
        </GamificationContext.Provider>
    );
}

// ── Helpers ───────────────────────────────────────────────────
function getTodayStr(): string {
    return new Date().toISOString().split("T")[0];
}

function getYesterdayStr(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
}

function getStreakMultiplierFromCount(count: number): number {
    if (count >= 30) return 2;
    if (count >= 7) return 1.5;
    return 1;
}

function getActionLabel(action: XPAction): string {
    const labels: Record<XPAction, string> = {
        complete_cook: "Recipe Completed",
        save_recipe: "Recipe Saved",
        scan_item: "Item Scanned",
        manual_add_item: "Item Added",
        ai_recipe: "AI Recipe Generated",
        share_recipe: "Recipe Shared",
        daily_streak: "Daily Streak",
    };
    return labels[action];
}
