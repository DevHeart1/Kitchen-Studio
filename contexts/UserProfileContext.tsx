import { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, DbUserProfile, DbSharedRecipe } from "@/lib/supabase";

export interface SharedRecipe {
  id: string;
  title: string;
  image: string;
  likes: number;
  createdAt: string;
}

export interface UserStats {
  cookTime: string;
  accuracy: number;
  recipesCompleted: number;
  totalXP: number;
}

export interface UserSettings {
  notifications: boolean;
  darkMode: boolean;
  arTips: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dataSharing: boolean;
  analytics: boolean;
}

export type CookingLevel = "beginner" | "intermediate" | "pro";
export type DietaryPreference = "vegetarian" | "vegan" | "keto" | "halal" | "gluten-free" | "dairy-free" | "nut-free";
export type CookingGoal = "eat-healthy" | "save-money" | "learn-new";

export interface UserProfile {
  name: string;
  title: string;
  level: number;
  avatar: string;
  stats: UserStats;
  sharedRecipes: SharedRecipe[];
  unlockedBadgeIds: string[];
  settings: UserSettings;
  cookingLevel?: CookingLevel;
  dietaryPreferences?: DietaryPreference[];
  primaryGoal?: CookingGoal;
  cookingInterests?: string[];
}

const STORAGE_KEY = "user_profile";
const DEMO_USER_ID = "demo-user-00000000-0000-0000-0000-000000000000";

const DEFAULT_SHARED_RECIPES: SharedRecipe[] = [
  {
    id: "1",
    title: "Fluffy Pancakes",
    image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=300&fit=crop",
    likes: 128,
    createdAt: "2023-10-15",
  },
  {
    id: "2",
    title: "Miso Glazed Salmon",
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=300&fit=crop",
    likes: 84,
    createdAt: "2023-10-20",
  },
  {
    id: "3",
    title: "Spicy Shoyu Ramen",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=300&fit=crop",
    likes: 312,
    createdAt: "2023-11-01",
  },
];

const DEFAULT_SETTINGS: UserSettings = {
  notifications: true,
  darkMode: true,
  arTips: true,
  emailNotifications: true,
  pushNotifications: true,
  dataSharing: false,
  analytics: true,
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Alex Ramsey",
  title: "Sous Chef",
  level: 5,
  avatar: "https://images.unsplash.com/photo-1566753323558-f4e0952af115?w=300&h=300&fit=crop&crop=face",
  stats: {
    cookTime: "48h",
    accuracy: 92,
    recipesCompleted: 12,
    totalXP: 2450,
  },
  sharedRecipes: DEFAULT_SHARED_RECIPES,
  unlockedBadgeIds: ["1", "2", "3", "4", "5"],
  settings: DEFAULT_SETTINGS,
};

const LEVEL_THRESHOLDS = [0, 500, 1200, 2000, 3000, 4500, 6500, 9000, 12000, 16000];
const TITLES = [
  "Kitchen Novice",
  "Line Cook",
  "Prep Chef",
  "Station Chef",
  "Sous Chef",
  "Head Chef",
  "Executive Chef",
  "Master Chef",
  "Culinary Artist",
  "Legendary Chef",
];

// Check if Supabase is configured
const isSupabaseConfigured = (): boolean => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  return !!url && !url.includes("your-project");
};

// Convert DB profile to frontend profile
const dbToFrontend = (
  dbProfile: DbUserProfile,
  sharedRecipes: DbSharedRecipe[]
): UserProfile => ({
  name: dbProfile.name,
  title: dbProfile.title,
  level: dbProfile.level,
  avatar: dbProfile.avatar || DEFAULT_PROFILE.avatar,
  stats: {
    cookTime: dbProfile.cook_time,
    accuracy: dbProfile.accuracy,
    recipesCompleted: dbProfile.recipes_completed,
    totalXP: dbProfile.total_xp,
  },
  sharedRecipes: sharedRecipes.map((r) => ({
    id: r.id,
    title: r.title,
    image: r.image || "",
    likes: r.likes,
    createdAt: r.created_at,
  })),
  unlockedBadgeIds: dbProfile.unlocked_badge_ids,
  settings: {
    ...DEFAULT_SETTINGS,
    ...dbProfile.settings,
  },
  cookingLevel: dbProfile.cooking_level,
  dietaryPreferences: dbProfile.dietary_preferences,
  primaryGoal: dbProfile.primary_goal,
  cookingInterests: dbProfile.cooking_interests,
});

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLevelUp, setPendingLevelUp] = useState<{ fromLevel: number; toLevel: number } | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const { user, isLoading: authLoading, isDemoMode } = useAuth();
  const useSupabase = isSupabaseConfigured() && !isDemoMode;

  const currentUserId = useMemo(() => {
    if (isDemoMode) return DEMO_USER_ID;
    return user?.id || null;
  }, [isDemoMode, user]);

  useEffect(() => {
    if (!authLoading) {
      loadProfile();
    }
  }, [authLoading, user, isDemoMode, currentUserId]);

  const loadProfile = async () => {
    try {
      if (useSupabase && currentUserId) {
        // Load profile from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", currentUserId)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("[Profile] Supabase error:", profileError.message);
          // Don't fall back to async storage if auth error, just log it.
          // Or maybe we should if network fails?
          // For now, let's assume if authenticated, we want DB data.
          // If we fail to load from DB, maybe we shouldn't overwrite with default?
        }

        // Load shared recipes
        const { data: recipesData } = await supabase
          .from("shared_recipes")
          .select("*")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false });

        if (profileData) {
          setProfile(dbToFrontend(profileData, recipesData || []));
          const dbOnboardingCompleted = profileData.onboarding_completed === true;
          setHasCompletedOnboarding(prev => prev === true ? true : dbOnboardingCompleted);
        } else {
          // No profile in Supabase, create one
          if (currentUserId && user) {
            const newProfile = {
              user_id: currentUserId,
              name: user.user_metadata?.name || user.email?.split('@')[0] || "Chef",
              title: "Kitchen Novice",
              level: 1,
              cook_time: "0h",
              accuracy: 0,
              recipes_completed: 0,
              total_xp: 0,
              unlocked_badge_ids: [],
              settings: DEFAULT_SETTINGS,
              cooking_level: 'beginner',
              dietary_preferences: [],
              cooking_interests: [],
              onboarding_completed: false
            };

            // Insert the new profile
            const { data: newProfileData, error: createError } = await supabase
              .from("user_profiles")
              .insert(newProfile)
              .select()
              .single();

            if (createError) {
              console.error("[Profile] Error creating profile:", JSON.stringify(createError, null, 2));
              setProfile(DEFAULT_PROFILE);
            } else if (newProfileData) {
              setProfile(dbToFrontend(newProfileData, []));
              setHasCompletedOnboarding(prev => prev === true ? true : false);
            }
          } else {
            setProfile(DEFAULT_PROFILE);
            setHasCompletedOnboarding(false);
          }
        }
      } else {
        await loadFromAsyncStorage();
      }
    } catch (error) {
      console.log("Error loading profile:", error);
      await loadFromAsyncStorage();
    } finally {
      console.log("[Profile] loadProfile finished");
      setIsLoading(false);
    }
  };

  const loadFromAsyncStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
        const storedCompleted = parsed.onboardingCompleted === true;
        setHasCompletedOnboarding(prev => prev === true ? true : storedCompleted);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
        setHasCompletedOnboarding(prev => prev === true ? true : false);
      }
    } catch (error) {
      console.log("Error loading from AsyncStorage:", error);
      setHasCompletedOnboarding(false);
    }
  };

  const saveProfile = async (updated: UserProfile) => {
    try {
      if (useSupabase && currentUserId) {
        const { error } = await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: currentUserId,
              name: updated.name,
              title: updated.title,
              level: updated.level,
              avatar: updated.avatar,
              cook_time: updated.stats.cookTime,
              accuracy: updated.stats.accuracy,
              recipes_completed: updated.stats.recipesCompleted,
              total_xp: updated.stats.totalXP,
              unlocked_badge_ids: updated.unlockedBadgeIds,
              settings: updated.settings,
              cooking_level: updated.cookingLevel || 'beginner',
              dietary_preferences: updated.dietaryPreferences || [],
              primary_goal: updated.primaryGoal,
              cooking_interests: updated.cookingInterests || [],
            },
            { onConflict: 'user_id' }
          );

        if (error) {
          console.error("[Profile] Save error:", error.message);
        } else {
          console.log("Profile saved to Supabase");
        }
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        console.log("Profile saved to AsyncStorage");
      }
    } catch (error) {
      console.log("Error saving profile:", error);
    }
  };

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await saveProfile(updated);
  }, [profile, useSupabase, currentUserId]);

  const updateName = useCallback(async (name: string) => {
    await updateProfile({ name });
  }, [updateProfile]);

  const updateAvatar = useCallback(async (avatar: string) => {
    await updateProfile({ avatar });
  }, [updateProfile]);

  const addXP = useCallback(async (amount: number) => {
    const newXP = profile.stats.totalXP + amount;
    let newLevel = profile.level;
    const previousLevel = profile.level;

    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (newXP >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }

    const newTitle = TITLES[Math.min(newLevel - 1, TITLES.length - 1)];

    await updateProfile({
      stats: { ...profile.stats, totalXP: newXP },
      level: newLevel,
      title: newTitle,
    });

    if (newLevel > previousLevel) {
      setPendingLevelUp({ fromLevel: previousLevel, toLevel: newLevel });
      console.log(`LEVEL UP! From ${previousLevel} to ${newLevel}`);
    }

    console.log(`Added ${amount} XP. New total: ${newXP}, Level: ${newLevel}`);

    return { leveledUp: newLevel > previousLevel, newLevel, previousLevel };
  }, [profile, updateProfile]);

  const incrementRecipesCompleted = useCallback(async () => {
    const newCount = profile.stats.recipesCompleted + 1;
    await updateProfile({
      stats: { ...profile.stats, recipesCompleted: newCount },
    });
  }, [profile, updateProfile]);

  const updateAccuracy = useCallback(async (newAccuracy: number) => {
    const currentAccuracy = profile.stats.accuracy;
    const avgAccuracy = Math.round((currentAccuracy + newAccuracy) / 2);
    await updateProfile({
      stats: { ...profile.stats, accuracy: avgAccuracy },
    });
  }, [profile, updateProfile]);

  const addCookTime = useCallback(async (minutes: number) => {
    const currentHours = parseInt(profile.stats.cookTime) || 0;
    const totalMinutes = currentHours * 60 + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    await updateProfile({
      stats: { ...profile.stats, cookTime: `${newHours}h` },
    });
  }, [profile, updateProfile]);

  const shareRecipe = useCallback(async (recipe: Omit<SharedRecipe, "id" | "createdAt" | "likes">) => {
    try {
      if (useSupabase && currentUserId) {
        const { data, error } = await supabase
          .from("shared_recipes")
          .insert({
            user_id: currentUserId,
            title: recipe.title,
            image: recipe.image,
          })
          .select()
          .single();

        if (error) {
          console.error("[Profile] Share recipe error:", error.message);
          return null;
        }

        const newRecipe: SharedRecipe = {
          id: data.id,
          title: data.title,
          image: data.image || "",
          likes: data.likes,
          createdAt: data.created_at,
        };

        setProfile((prev) => ({
          ...prev,
          sharedRecipes: [newRecipe, ...prev.sharedRecipes],
        }));

        return newRecipe;
      } else {
        const newRecipe: SharedRecipe = {
          ...recipe,
          id: Date.now().toString(),
          likes: 0,
          createdAt: new Date().toISOString(),
        };

        const updatedRecipes = [newRecipe, ...profile.sharedRecipes];
        await updateProfile({ sharedRecipes: updatedRecipes });
        return newRecipe;
      }
    } catch (error) {
      console.log("Error sharing recipe:", error);
      return null;
    }
  }, [profile, updateProfile, useSupabase, currentUserId]);

  const removeSharedRecipe = useCallback(async (recipeId: string) => {
    try {
      if (useSupabase && currentUserId) {
        const { error } = await supabase
          .from("shared_recipes")
          .delete()
          .eq("id", recipeId);

        if (error) {
          console.error("[Profile] Delete recipe error:", error.message);
          return;
        }
      }

      const updatedRecipes = profile.sharedRecipes.filter((r) => r.id !== recipeId);
      setProfile((prev) => ({ ...prev, sharedRecipes: updatedRecipes }));

      if (!useSupabase) {
        await saveProfile({ ...profile, sharedRecipes: updatedRecipes });
      }
    } catch (error) {
      console.log("Error removing recipe:", error);
    }
  }, [profile, useSupabase, currentUserId]);

  const unlockBadge = useCallback(async (badgeId: string) => {
    if (!profile.unlockedBadgeIds.includes(badgeId)) {
      const updated = [...profile.unlockedBadgeIds, badgeId];
      await updateProfile({ unlockedBadgeIds: updated });
      console.log(`Badge ${badgeId} unlocked!`);
    }
  }, [profile, updateProfile]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const newSettings = { ...profile.settings, ...updates };
    await updateProfile({ settings: newSettings });
    console.log("Settings updated:", updates);
  }, [profile, updateProfile]);

  const getXPProgress = useCallback(() => {
    const currentLevelXP = LEVEL_THRESHOLDS[profile.level - 1] || 0;
    const nextLevelXP = LEVEL_THRESHOLDS[profile.level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const progressXP = profile.stats.totalXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    return {
      current: progressXP,
      needed: neededXP,
      percent: Math.min((progressXP / neededXP) * 100, 100),
    };
  }, [profile]);

  const acknowledgeLevelUp = useCallback(() => {
    setPendingLevelUp(null);
    console.log("Level up acknowledged");
  }, []);

  const checkForLevelUp = useCallback(() => {
    return pendingLevelUp;
  }, [pendingLevelUp]);

  const completeOnboarding = useCallback(async () => {
    console.log("[Profile] completeOnboarding called");
    setHasCompletedOnboarding(true);
    try {
      if (useSupabase && currentUserId) {
        // Try strict update first
        const { error, data } = await supabase
          .from("user_profiles")
          .update({ onboarding_completed: true })
          .eq("user_id", currentUserId)
          .select();

        // If error or no rows updated (profile missing), try full upsert
        if (error || !data || data.length === 0) {
          console.log("[Profile] Update failed or no row, trying full upsert with onboarding_completed=true");
          const { error: upsertError } = await supabase
            .from("user_profiles")
            .upsert(
              {
                user_id: currentUserId,
                name: profile.name,
                title: profile.title,
                level: profile.level,
                avatar: profile.avatar,
                cook_time: profile.stats.cookTime,
                accuracy: profile.stats.accuracy,
                recipes_completed: profile.stats.recipesCompleted,
                total_xp: profile.stats.totalXP,
                unlocked_badge_ids: profile.unlockedBadgeIds,
                settings: profile.settings,
                cooking_level: profile.cookingLevel || 'beginner',
                dietary_preferences: profile.dietaryPreferences || [],
                primary_goal: profile.primaryGoal,
                cooking_interests: profile.cookingInterests || [],
                onboarding_completed: true,
              },
              { onConflict: 'user_id' }
            );

          if (upsertError) {
            console.error("[Profile] Full upsert failed:", upsertError.message);
          }
        }
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : DEFAULT_PROFILE;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, onboardingCompleted: true }));
      }
      console.log("[Profile] Onboarding marked as complete successfully");
    } catch (error) {
      console.error("[Profile] Error completing onboarding:", error);
    }
  }, [useSupabase, currentUserId]);

  const checkOnboardingStatus = useCallback(async (): Promise<boolean> => {
    if (hasCompletedOnboarding !== null) {
      return hasCompletedOnboarding;
    }

    try {
      if (useSupabase && currentUserId) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("user_id", currentUserId)
          .single();

        if (error && error.code === "PGRST116") {
          // No profile found, so onboarding not completed
          setHasCompletedOnboarding(false);
          return false;
        }

        const completed = data?.onboarding_completed === true;
        setHasCompletedOnboarding(completed);
        return completed;
      } else {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const completed = parsed.onboardingCompleted === true;
          setHasCompletedOnboarding(completed);
          return completed;
        }
        setHasCompletedOnboarding(false);
        return false;
      }
    } catch (error) {
      console.error("[Profile] Error checking onboarding status:", error);
      return false;
    }
  }, [useSupabase, hasCompletedOnboarding, currentUserId]);

  return {
    profile,
    isLoading,
    updateProfile,
    updateName,
    updateAvatar,
    addXP,
    incrementRecipesCompleted,
    updateAccuracy,
    addCookTime,
    shareRecipe,
    removeSharedRecipe,
    unlockBadge,
    updateSettings,
    getXPProgress,
    pendingLevelUp,
    acknowledgeLevelUp,
    checkForLevelUp,
    hasCompletedOnboarding,
    completeOnboarding,
    checkOnboardingStatus,
  };
});
