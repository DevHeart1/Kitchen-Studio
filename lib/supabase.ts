import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        'Supabase credentials not found. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_ANON_KEY in .env'
    );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Database types for type safety
export interface DbInventoryItem {
    id: string;
    user_id: string;
    name: string;
    normalized_name: string;
    image: string | null;
    category: string;
    added_date: string;
    status: 'good' | 'low' | 'expiring';
    stock_percentage: number;
    quantity?: number;
    unit?: string;
    expires_in: string | null;
    created_at: string;
    updated_at: string;
}

export interface DbUserProfile {
    id: string;
    user_id: string;
    name: string;
    title: string;
    level: number;
    avatar: string | null;
    cook_time: string;
    accuracy: number;
    recipes_completed: number;
    total_xp: number;
    unlocked_badge_ids: string[];
    settings: {
        notifications: boolean;
        darkMode: boolean;
        arTips: boolean;
        emailNotifications?: boolean;
        pushNotifications?: boolean;
        dataSharing?: boolean;
        analytics?: boolean;
    };
    // User onboarding preferences
    cooking_level?: 'beginner' | 'intermediate' | 'pro';
    dietary_preferences?: ('vegetarian' | 'vegan' | 'keto' | 'halal' | 'gluten-free' | 'dairy-free' | 'nut-free')[];
    primary_goal?: 'eat-healthy' | 'save-money' | 'learn-new';
    cooking_interests?: string[];
    onboarding_completed?: boolean;
    created_at: string;
    updated_at: string;
}

export interface DbSharedRecipe {
    id: string;
    user_id: string;
    title: string;
    image: string | null;
    likes: number;
    created_at: string;
}

export interface DbSavedRecipe {
    id: string;
    user_id: string;
    title: string;
    video_thumbnail: string | null;
    video_duration: string | null;
    ingredients: {
        id: string;
        name: string;
        amount: string;
        image: string;
        substituteSuggestion?: string;
    }[];
    saved_at: string;
}
