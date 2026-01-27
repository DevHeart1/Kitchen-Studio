import { useEffect, useState, useCallback, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { recentCooks } from "@/mocks/sessions";

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

export interface UserProfile {
  name: string;
  title: string;
  level: number;
  avatar: string;
  stats: UserStats;
  sharedRecipes: SharedRecipe[];
  unlockedBadgeIds: string[];
  settings: UserSettings;
}

const STORAGE_KEY = "user_profile";

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

export const [UserProfileProvider, useUserProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingLevelUp, setPendingLevelUp] = useState<{ fromLevel: number; toLevel: number } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setProfile({ ...DEFAULT_PROFILE, ...parsed });
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PROFILE));
      }
    } catch (error) {
      console.log("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (updated: UserProfile) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.log("Profile saved successfully");
    } catch (error) {
      console.log("Error saving profile:", error);
    }
  };

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    await saveProfile(updated);
  }, [profile]);

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
    const newRecipe: SharedRecipe = {
      ...recipe,
      id: Date.now().toString(),
      likes: 0,
      createdAt: new Date().toISOString(),
    };
    
    const updatedRecipes = [newRecipe, ...profile.sharedRecipes];
    await updateProfile({ sharedRecipes: updatedRecipes });
    return newRecipe;
  }, [profile, updateProfile]);

  const removeSharedRecipe = useCallback(async (recipeId: string) => {
    const updatedRecipes = profile.sharedRecipes.filter((r) => r.id !== recipeId);
    await updateProfile({ sharedRecipes: updatedRecipes });
  }, [profile, updateProfile]);

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

  const computedStats = useMemo(() => {
    const completedCooks = recentCooks.filter((c) => c.progress === 100);
    const inProgressCooks = recentCooks.filter((c) => c.progress < 100);
    
    return {
      totalCooks: recentCooks.length,
      completedCooks: completedCooks.length,
      inProgressCooks: inProgressCooks.length,
      avgRating: completedCooks.reduce((acc, c) => acc + (c.rating || 0), 0) / (completedCooks.length || 1),
    };
  }, []);

  return useMemo(() => ({
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
    computedStats,
    pendingLevelUp,
    acknowledgeLevelUp,
    checkForLevelUp,
  }), [
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
    computedStats,
    pendingLevelUp,
    acknowledgeLevelUp,
    checkForLevelUp,
  ]);
});
