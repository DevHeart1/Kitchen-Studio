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
  | 'tip';

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
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  requirement: string;
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
}
