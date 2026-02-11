/*
  # Seed Badge Definitions

  Populates the badges table with 9 achievement definitions used by the gamification system.
  Each badge has a condition type and value that determines when it gets unlocked.

  Uses ON CONFLICT to safely handle re-runs without duplicating data.
*/

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
