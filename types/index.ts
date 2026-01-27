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
