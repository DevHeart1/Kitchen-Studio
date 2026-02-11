/*
  # Create Core Application Tables

  1. New Tables
    - `inventory_items` - User pantry/inventory items with status tracking
      - `id` (uuid, primary key)
      - `user_id` (text, not null)
      - `name` (text, not null)
      - `normalized_name` (text, not null)
      - `image` (text, nullable)
      - `category` (text, not null)
      - `added_date` (text, not null)
      - `status` (text, enum: good/low/expiring)
      - `stock_percentage` (integer, default 100)
      - `quantity` (real, default 1)
      - `unit` (text, default 'pcs')
      - `expires_in` (text, nullable)
    - `user_profiles` - User profile data including gamification stats
      - `id` (uuid, primary key)
      - `user_id` (text, unique, not null)
      - `name` (text, not null)
      - `title` (text, default 'Kitchen Novice')
      - `level` (integer, default 1)
      - `avatar` (text, nullable)
      - `cook_time` (text, default '0h')
      - `accuracy` (integer, default 0)
      - `recipes_completed` (integer, default 0)
      - `total_xp` (integer, default 0)
      - `unlocked_badge_ids` (text array)
      - `settings` (jsonb)
      - `cooking_level`, `dietary_preferences`, `primary_goal`, `cooking_interests` (onboarding fields)
      - `onboarding_completed` (boolean, default false)
    - `shared_recipes` - User-created recipe shares
    - `saved_recipes` - User bookmarked recipes with ingredients and instructions
    - `badges` - Badge/achievement definitions
    - `user_badges` - Tracks which user earned which badge
    - `xp_ledger` - XP earning history/audit trail

  2. Security
    - RLS enabled on all tables
    - Authenticated users can only access their own data
    - Badges table is publicly readable for all authenticated users

  3. Indexes
    - User ID indexes on all user-scoped tables for query performance
*/

-- inventory_items
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

-- user_profiles
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
  cooking_level TEXT CHECK (cooking_level IN ('beginner', 'intermediate', 'pro')) DEFAULT 'beginner',
  dietary_preferences TEXT[] DEFAULT '{}',
  primary_goal TEXT CHECK (primary_goal IN ('eat-healthy', 'save-money', 'learn-new')),
  cooking_interests TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- shared_recipes
CREATE TABLE IF NOT EXISTS shared_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  image TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- saved_recipes
CREATE TABLE IF NOT EXISTS saved_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  video_thumbnail TEXT,
  video_duration TEXT,
  ingredients JSONB DEFAULT '[]',
  instructions JSONB DEFAULT '[]',
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- badges (definitions)
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  xp_reward INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_badges (earned)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- xp_ledger (history)
CREATE TABLE IF NOT EXISTS xp_ledger (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_user ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_recipes_user ON shared_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_ledger_user ON xp_ledger(user_id);

-- RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;

-- inventory_items policies
CREATE POLICY "Users can view own inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own inventory"
  ON inventory_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own inventory"
  ON inventory_items FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own inventory"
  ON inventory_items FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- user_profiles policies
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- shared_recipes policies
CREATE POLICY "Users can view own shared recipes"
  ON shared_recipes FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert shared recipes"
  ON shared_recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own shared recipes"
  ON shared_recipes FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- saved_recipes policies
CREATE POLICY "Users can view own saved recipes"
  ON saved_recipes FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert saved recipes"
  ON saved_recipes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own saved recipes"
  ON saved_recipes FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own saved recipes"
  ON saved_recipes FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- badges: readable by all authenticated users
CREATE POLICY "Authenticated users can read badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- user_badges policies
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own badges"
  ON user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- xp_ledger policies
CREATE POLICY "Users can view own xp history"
  ON xp_ledger FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own xp entries"
  ON xp_ledger FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Also allow anon access for demo mode / unauthenticated usage
CREATE POLICY "Anon can read badges"
  ON badges FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon inventory access"
  ON inventory_items FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon profile access"
  ON user_profiles FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon shared recipes access"
  ON shared_recipes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon saved recipes access"
  ON saved_recipes FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon user badges access"
  ON user_badges FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon xp ledger access"
  ON xp_ledger FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
