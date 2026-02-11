export interface Session {
  id: string;
  title: string;
  image: string;
  chefName: string;
  chefAvatar: string;
  price: string;
  isArReady: boolean;
}

export interface RecentCook {
  id: string;
  title: string;
  image: string;
  progress: number;
  completedDate?: string;
  currentStep?: number;
  totalSteps?: number;
  startedAt: string;
  duration?: string;
  chefName?: string;
  chefAvatar?: string;
  steps?: CookingStep[];
  rating?: number;
  notes?: string;
  recipeId?: string;
}

export interface CookingStep {
  id: string;
  title: string;
  description: string;
  duration?: string;
  image?: string;
  completed: boolean;
  tip?: string;
}

export type NotificationType =
  | 'recipe_suggestion'
  | 'cooking_reminder'
  | 'ingredient_alert'
  | 'achievement'
  | 'chef_update'
  | 'tip'
  | 'expiry_warning'
  | 'expiry_urgent'
  | 'smart_recommendation'
  | 'storage_tip'
  | 'waste_reduction';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  image?: string;
  actionLabel?: string;
  actionRoute?: string;
  actionParams?: Record<string, string>;
  priority?: 'high' | 'medium' | 'low';
  relatedItems?: string[];
  aiGenerated?: boolean;
  dismissed?: boolean;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  requirement: string; // derived from condition_type/value for UI
  icon: string;
  color: string;
  gradientFrom: string;
  gradientTo: string;
  unlocked: boolean;
  earnedDate?: string;
  xpReward: number;
  reward?: string;
  rewardType?: 'skin' | 'recipe' | 'tool' | 'title';
  progress?: number;
  progressMax?: number;
  conditionType?: string;
  conditionValue?: number;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
}

export interface XPActionLog {
  id: string;
  userId: string;
  actionType: string;
  amount: number;
  details?: any;
  createdAt: string;
}
export interface RecipeIngredient {
  id: string;
  name: string;
  amount: string;
  image: string;
  substituteSuggestion?: string;
}

export interface SavedRecipe {
  id: string;
  title: string;
  videoThumbnail: string;
  videoDuration: string;
  ingredients: RecipeIngredient[];
  instructions?: { step: number; text: string; time?: number }[];
  savedAt: string;
}

export interface GeneratedRecipe {
  title: string;
  description: string;
  ingredients: {
    name: string;
    amount: string;
    inPantry: boolean;
  }[];
  instructions: {
    step: number;
    text: string;
  }[];
  prepTime: string;
  cookTime: string;
  difficulty: "Easy" | "Medium" | "Hard";
  calories: string;
}
