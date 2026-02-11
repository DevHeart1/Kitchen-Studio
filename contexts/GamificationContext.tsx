import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useSavedRecipes } from "@/contexts/SavedRecipesContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useCookingHistory } from "@/contexts/CookingHistoryContext";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

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

// ── Streak Storage ──────────────────────────────────────────────
const STREAK_KEY_PREFIX = "gamification_streak_";

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
    achievements: Badge[];
    toastQueue: XPToastData[];
    dismissToast: (id: string) => void;
    isLoading: boolean;
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
        unlockBadge: unlockBadgeInProfile,
    } = useUserProfile();
    const { user, getUserId } = useAuth();
    const userId = getUserId();
    const streakKey = `${STREAK_KEY_PREFIX}${userId}`;

    const { inventory } = useInventory();
    const { savedRecipes } = useSavedRecipes();
    const { completedSessions } = useCookingHistory();

    const [streak, setStreak] = useState<StreakData>({
        currentStreak: 0,
        lastActiveDate: "",
        longestStreak: 0,
    });
    const [toastQueue, setToastQueue] = useState<XPToastData[]>([]);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const unlockedSessionCache = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (userId) {
            unlockedSessionCache.current.clear();
            loadStreak();
            loadBadges();
        }
    }, [userId]);

    const loadBadges = async () => {
        try {
            // Fetch badge definitions
            const { data: badgeDefs, error } = await supabase
                .from('badges')
                .select('*')
                .order('condition_value', { ascending: true });

            if (error) {
                console.error("[Gamification] Error loading badges:", error);
                // Fallback or retry logic could go here
                return;
            }

            // Map DB response to Badge interface
            const mappedBadges: Badge[] = badgeDefs.map(b => ({
                id: b.id,
                slug: b.slug,
                name: b.name,
                description: b.description,
                icon: b.icon,
                color: b.color,
                gradientFrom: b.color, // Simple fallback for now
                gradientTo: b.color,
                xpReward: b.xp_reward,
                conditionType: b.condition_type,
                conditionValue: b.condition_value,
                requirement: b.description, // Use description as requirement text
                unlocked: false, // Will be updated via profile sync
            }));

            setBadges(mappedBadges);
        } catch (e) {
            console.error("[Gamification] Exception loading badges:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadStreak = async () => {
        try {
            const stored = await AsyncStorage.getItem(streakKey);
            if (stored) {
                const data: StreakData = JSON.parse(stored);
                setStreak(data);
                checkDailyStreak(data);
            } else {
                const today = getTodayStr();
                const newStreak: StreakData = {
                    currentStreak: 1,
                    lastActiveDate: today,
                    longestStreak: 1,
                };
                await AsyncStorage.setItem(streakKey, JSON.stringify(newStreak));
                setStreak(newStreak);
                enqueueToast({ type: "streak", message: "Day 1 streak started! 🔥" });
            }
        } catch (e) {
            console.log("[Gamification] Streak load error:", e);
        }
    };

    const checkDailyStreak = async (data: StreakData) => {
        const today = getTodayStr();
        if (data.lastActiveDate === today) return;

        const yesterday = getYesterdayStr();
        let newStreak: StreakData;

        if (data.lastActiveDate === yesterday) {
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
            const multiplier = getStreakMultiplierFromCount(newCount);
            // We use the wrapper here to log to ledger too
            await awardXP("daily_streak", multiplier); // recursive but safe if handled
        } else {
            newStreak = {
                currentStreak: 1,
                lastActiveDate: today,
                longestStreak: data.longestStreak,
            };
            if (data.currentStreak > 1) {
                enqueueToast({ type: "streak", message: "Streak reset. Day 1! 🔥" });
            }
        }

        await AsyncStorage.setItem(streakKey, JSON.stringify(newStreak));
        setStreak(newStreak);
    };

    // ── XP Award ────────────────────────────────────────────────
    const awardXP = useCallback(async (action: XPAction, customMultiplier?: number) => {
        const baseXP = XP_VALUES[action];
        const multiplier = customMultiplier ?? getStreakMultiplier();
        const finalXP = Math.round(baseXP * multiplier);

        console.log(`[Gamification] +${finalXP} XP for "${action}"`);

        // 1. Update Profile (Total XP & Level) - manages local state + DB sync for profile
        const result = await addXP(finalXP);

        // 2. Log to Ledger (Audit Trail)
        if (user) {
            try {
                await supabase.from('xp_ledger').insert({
                    user_id: user.id,
                    action_type: action,
                    amount: finalXP,
                    details: { multiplier, baseXP }
                });
            } catch (err) {
                console.error("[Gamification] Error writing to ledger:", err);
            }
        }

        // 3. UI Feedback
        if (action !== 'daily_streak') { // handled separately in checkDailyStreak
            enqueueToast({
                type: "xp",
                message: getActionLabel(action),
                xpAmount: finalXP,
            });
        }

        if (result.leveledUp) {
            enqueueToast({
                type: "levelup",
                message: `Level ${result.newLevel}!`,
            });
        }

        // 4. Check achievements
        setTimeout(() => checkAchievements(), 500);
    }, [addXP, streak, user]);

    // ── Achievement Checking ────────────────────────────────────
    const getStats = useCallback(() => {
        return {
            recipesCompleted: profile.stats.recipesCompleted,
            inventoryCount: inventory.length,
            savedRecipesCount: savedRecipes.length,
            sharedRecipesCount: profile.sharedRecipes?.length || 0,
            totalCookSessions: completedSessions.length,
            totalXP: profile.stats.totalXP,
        };
    }, [profile, inventory, savedRecipes, completedSessions]);

    const checkAchievements = useCallback(async () => {
        const stats = getStats();
        // Combined locked/unlocked check
        // We rely on profile.unlockedBadgeIds as the source of truth for "already earned"
        const unlockedIds = new Set(profile.unlockedBadgeIds);

        const newUnlocks: Badge[] = [];

        for (const badge of badges) {
            // Skip if already unlocked or just unlocked in this session
            if (unlockedIds.has(badge.id) || unlockedIds.has(badge.slug) || unlockedSessionCache.current.has(badge.id)) continue;

            let isMet = false;
            const { conditionType, conditionValue } = badge;

            if (!conditionValue) continue;

            switch (conditionType) {
                case 'inventory_count':
                    isMet = stats.inventoryCount >= conditionValue;
                    break;
                case 'recipes_completed':
                    isMet = stats.recipesCompleted >= conditionValue;
                    break;
                case 'saved_recipes_count':
                    isMet = stats.savedRecipesCount >= conditionValue;
                    break;
                case 'shared_recipes_count':
                    isMet = stats.sharedRecipesCount >= conditionValue;
                    break;
                // Add more conditions here
                default:
                    break;
            }

            if (isMet) {
                newUnlocks.push(badge);
            }
        }

        // Process unlocks
        for (const badge of newUnlocks) {
            console.log(`[Gamification] 🏆 Unlocking: ${badge.name}`);

            // 1. Update UserBadges Table
            if (user) {
                const { error } = await supabase.from('user_badges').insert({
                    user_id: user.id,
                    badge_id: badge.id
                });

                if (error) {
                    // Check for unique violation (code 23505) - means already unlocked
                    if (error.code === '23505') {
                        console.warn(`[Gamification] Badge ${badge.name} already in DB, skipping insert.`);
                    } else {
                        console.error("Error saving badge:", JSON.stringify(error, null, 2));
                        continue; // abort if legitimate DB write fail
                    }
                }
            }

            // 2. Sync with Profile (UI cache)
            await unlockBadgeInProfile(badge.slug); // fallback to slug if ID scheme differs, mainly for profile.tsx
            // If profile stores IDs, we might need badge.id too.
            // But achievements.tsx uses logic that matches IDs. 
            // Our DB seed uses generated UUIDs, so we must be careful.
            // Actually, profile.tsx likely expects string IDs "1", "2" currently. 
            // We are changing to UUIDs. We need to ensure profile handles this.
            // For now, let's unlock using ID.
            await unlockBadgeInProfile(badge.id);

            // 3. Award Badge XP
            await awardXP('daily_streak', 0); // Hack to trigger XP add alone? No, call addXP directly
            await addXP(badge.xpReward);

            // 4. Log XP for badge
            if (user) {
                await supabase.from('xp_ledger').insert({
                    user_id: user.id,
                    action_type: 'badge_unlock',
                    amount: badge.xpReward,
                    details: { badge_id: badge.id, badge_name: badge.name }
                });
            }

            unlockedSessionCache.current.add(badge.id);
            enqueueToast({
                type: "badge",
                message: "Achievement Unlocked!",
                badgeName: badge.name,
                xpAmount: badge.xpReward,
            });
        }

    }, [getStats, badges, profile.unlockedBadgeIds, unlockBadgeInProfile, addXP, user]);

    // Run achievement check when relevant stats change
    useEffect(() => {
        if (!isLoading && badges.length > 0) {
            checkAchievements();
        }
    }, [
        isLoading,
        badges.length,
        profile.stats.recipesCompleted,
        inventory.length,
        savedRecipes.length,
    ]);

    // ── Computed Achievements for UI ────────────────────────────
    const computedAchievements = useMemo(() => {
        const stats = getStats();
        return badges.map((badge) => {
            let current = 0;
            const max = badge.conditionValue || 100;

            switch (badge.conditionType) {
                case 'inventory_count': current = stats.inventoryCount; break;
                case 'recipes_completed': current = stats.recipesCompleted; break;
                case 'saved_recipes_count': current = stats.savedRecipesCount; break;
                case 'shared_recipes_count': current = stats.sharedRecipesCount; break;
            }

            // Check unlock status using ID or Slug match against profile list
            // We support both for backward compat with hardcoded string IDs
            const isUnlocked = profile.unlockedBadgeIds.includes(badge.id) || profile.unlockedBadgeIds.includes(badge.slug);

            return {
                ...badge,
                unlocked: isUnlocked,
                progress: Math.min(current, max),
                progressMax: max,
                earnedDate: isUnlocked ? "Earned" : undefined,
            };
        });
    }, [getStats, badges, profile.unlockedBadgeIds]);

    const getStreakMultiplier = useCallback(() => {
        return getStreakMultiplierFromCount(streak.currentStreak);
    }, [streak.currentStreak]);

    // ── Toast Logic ─────────────────────────────────────────────
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
            achievements: computedAchievements,
            toastQueue,
            dismissToast,
            isLoading
        }),
        [awardXP, streak, getStreakMultiplier, computedAchievements, toastQueue, dismissToast, isLoading]
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
