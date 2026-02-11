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
-- BADGES TABLE (Definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE, -- e.g. 'pantry-master'
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  condition_type TEXT NOT NULL, -- e.g. 'inventory_count', 'recipes_completed'
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USER BADGES TABLE (Earned)
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- ============================================
-- XP LEDGER TABLE (History)
-- ============================================
CREATE TABLE IF NOT EXISTS xp_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
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

DROP POLICY IF EXISTS "Allow all inventory operations" ON inventory_items;
CREATE POLICY "Allow all inventory operations" ON inventory_items FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all profile operations" ON user_profiles;
CREATE POLICY "Allow all profile operations" ON user_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all shared recipes operations" ON shared_recipes;
CREATE POLICY "Allow all shared recipes operations" ON shared_recipes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all saved recipes operations" ON saved_recipes;
CREATE POLICY "Allow all saved recipes operations" ON saved_recipes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read badges" ON badges;
CREATE POLICY "Allow read badges" ON badges FOR SELECT USING (true); -- Public read

DROP POLICY IF EXISTS "Allow all user_badges operations" ON user_badges;
CREATE POLICY "Allow all user_badges operations" ON user_badges FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all xp_ledger operations" ON xp_ledger;
CREATE POLICY "Allow all xp_ledger operations" ON xp_ledger FOR ALL USING (true) WITH CHECK (true);

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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_recipes' AND column_name = 'instructions') THEN
        ALTER TABLE saved_recipes ADD COLUMN instructions JSONB DEFAULT '[]';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'saved_recipes' AND column_name = 'instructions') THEN
        ALTER TABLE saved_recipes ADD COLUMN instructions JSONB DEFAULT '[]';
    END IF;
END $$;

-- ============================================
-- SEED DATA (Badges)
-- ============================================
INSERT INTO badges (slug, name, description, icon, color, xp_reward, condition_type, condition_value)
VALUES 
  ('pantry-master', 'Pantry Master', 'Stock your pantry to the max', 'package', '#f97316', 300, 'inventory_count', 50),
  ('knife-pro', 'Knife Pro', 'Perfect cuts streak', 'utensils-crossed', '#3b82f6', 350, 'recipes_completed', 10),
  ('sauce-boss', 'Sauce Boss', 'Master of flavors', 'soup', '#a855f7', 400, 'recipes_completed', 5),
  ('early-bird', 'Early Bird', 'Rise and cook', 'sun', '#eab308', 250, 'recipes_completed', 10),
  ('socialite', 'Socialite', 'Share the love', 'share-2', '#14b8a6', 300, 'shared_recipes_count', 10),
  ('speed-chef', 'Speed Chef', 'Cook with lightning speed', 'flame', '#ef4444', 600, 'recipes_completed', 20),
  ('master-baker', 'Master Baker', 'Baking perfection', 'cookie', '#d97706', 500, 'recipes_completed', 15),
  ('wine-master', 'Wine Master', 'Pair like a pro', 'wine', '#7c3aed', 500, 'recipes_completed', 25),
  ('efficiency-king', 'Efficiency King', 'Never waste a second', 'timer', '#06b6d4', 400, 'saved_recipes_count', 20)
ON CONFLICT (slug) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  xp_reward = EXCLUDED.xp_reward,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value;
