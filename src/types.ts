export interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  isImpulse: boolean;
  resisted: boolean; // True if the user wanted to buy but resisted
  willpowerEarned: number;
}

export interface RoastResponse {
  roastText: string;
  severity: "mild" | "savage" | "nuclear"; // 毒舌等級
  memeTitle: string; // 推薦的梗圖/稱號
}

export interface CollectibleCard {
  id: string;
  title: string;
  description: string;
  imagePrompt: string; // The prompt we'd use to generate card art
  bgColor: string; // Tailwind bg color class
  textColor: string; // Tailwind text color class
  rarity: "N" | "R" | "SR" | "SSR";
  unlockedAt?: string;
}

export interface MicroTask {
  id: string;
  title: string;
  sponsor: string;
  rewardType: "willpower" | "cash";
  rewardAmount: number;
  description: string;
  completed: boolean;
  actionLabel: string;
}
