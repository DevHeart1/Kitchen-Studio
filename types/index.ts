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
}
