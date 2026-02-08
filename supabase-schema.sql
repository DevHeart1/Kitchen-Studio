-- Kitchen Studio Database Schema for Supabase
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ============================================
-- INVENTORY ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  added_date TEXT NOT NULL,
  status TEXT CHECK (status IN ('good', 'low', 'expiring')) DEFAULT 'good',
  stock_percentage INTEGER DEFAULT 100,
  quantity REAL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  expires_in TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  title TEXT DEFAULT 'Kitchen Novice',
  level INTEGER DEFAULT 1,
  avatar TEXT,
  cook_time TEXT DEFAULT '0h',
  accuracy INTEGER DEFAULT 0,
  recipes_completed INTEGER DEFAULT 0,
  total_xp INTEGER DEFAULT 0,
  unlocked_badge_ids TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{"notifications": true, "darkMode": true, "arTips": true, "emailNotifications": true, "pushNotifications": true, "dataSharing": false, "analytics": true}',
  -- User onboarding preferences
  cooking_level TEXT CHECK (cooking_level IN ('beginner', 'intermediate', 'pro')) DEFAULT 'beginner',
  dietary_preferences TEXT[] DEFAULT '{}',
  primary_goal TEXT CHECK (primary_goal IN ('eat-healthy', 'save-money', 'learn-new')),
  cooking_interests TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SHARED RECIPES TABLE (user creations)
-- ============================================
CREATE TABLE IF NOT EXISTS shared_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  image TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SAVED RECIPES TABLE (bookmarks)
-- ============================================
CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  video_thumbnail TEXT,
  video_duration TEXT,
  ingredients JSONB DEFAULT '[]',
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR BETTER QUERY PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_recipes_user ON shared_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user ON saved_recipes(user_id);

-- ============================================
-- ROW LEVEL SECURITY (Optional - Enable if using Supabase Auth)
-- ============================================
-- Uncomment these if you want to enable RLS with Supabase Auth

-- ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE shared_recipes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view own inventory" ON inventory_items FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert own inventory" ON inventory_items FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can update own inventory" ON inventory_items FOR UPDATE USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can delete own inventory" ON inventory_items FOR DELETE USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can view own shared recipes" ON shared_recipes FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert shared recipes" ON shared_recipes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can delete own shared recipes" ON shared_recipes FOR DELETE USING (auth.uid()::text = user_id);

-- CREATE POLICY "Users can view own saved recipes" ON saved_recipes FOR SELECT USING (auth.uid()::text = user_id);
-- CREATE POLICY "Users can insert saved recipes" ON saved_recipes FOR INSERT WITH CHECK (auth.uid()::text = user_id);
-- CREATE POLICY "Users can delete own saved recipes" ON saved_recipes FOR DELETE USING (auth.uid()::text = user_id);

-- ============================================
-- DEMO MODE: Allow all operations (for development)
-- ============================================
-- For demo mode without authentication, we allow all operations
-- Remove these and enable RLS policies above for production with auth

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all inventory operations" ON inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all profile operations" ON user_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all shared recipes operations" ON shared_recipes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all saved recipes operations" ON saved_recipes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Kitchen Studio database schema created successfully!' AS message;

-- ============================================
-- MIGRATIONS (Run these if table already exists)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'quantity') THEN
        ALTER TABLE inventory_items ADD COLUMN quantity REAL DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_items' AND column_name = 'unit') THEN
        ALTER TABLE inventory_items ADD COLUMN unit TEXT DEFAULT 'pcs';
    END IF;
END $$;
