export type ItemId =
  | 'wheat'
  | 'corn'
  | 'carrot'
  | 'bread'
  | 'feed'
  | 'egg'
  | 'milk'
  | 'ore';

export type CropId = 'wheat' | 'corn' | 'carrot';

export type BuildingId =
  | 'house'
  | 'barn'
  | 'bakery'
  | 'feed_mill'
  | 'chicken_coop'
  | 'dairy'
  | 'flower_bed'
  | 'well'
  | 'park';

export type PlotKind = 'empty' | 'crop' | 'building';

export type DailyGoalType = 'walk_steps' | 'harvest_crops' | 'complete_orders';

export type AchievementId =
  | 'first_harvest'
  | 'first_order'
  | 'streak_3'
  | 'expand_land'
  | 'bake_bread'
  | 'first_mine'
  | 'coop_eggs';

export interface CropDef {
  id: CropId;
  name: string;
  emoji: string;
  seedCost: number;
  growMs: number;
  yieldItem: ItemId;
  yieldQty: number;
  unlockLevel: number;
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  unlockLevel: number;
  kind: 'home' | 'factory' | 'decor' | 'storage';
  unique?: boolean;
  population?: number;
  happiness?: number;
  storageBonus?: number;
  recipe?: {
    input: ItemId;
    inputQty: number;
    output: ItemId;
    outputQty: number;
    processMs: number;
  };
}

export interface Plot {
  id: string;
  x: number;
  y: number;
  unlocked: boolean;
  unlockCost: number;
  unlockLevel: number;
  kind: PlotKind;
  cropId?: CropId;
  buildingId?: BuildingId;
  plantedAt?: number;
  readyAt?: number;
  processing?: boolean;
  processReadyAt?: number;
}

export interface OrderRequirement {
  itemId: ItemId;
  qty: number;
}

export interface TownOrder {
  id: string;
  slot: number;
  customer: string;
  requirements: OrderRequirement[];
  rewardCoins: number;
  rewardXp: number;
  expiresAt: number;
  bonus?: boolean;
}

export interface DailyGoal {
  id: string;
  type: DailyGoalType;
  label: string;
  target: number;
  progress: number;
  claimed: boolean;
  rewardCoins: number;
  rewardGems: number;
}

export interface StepLedgerDay {
  date: string;
  rawSteps: number;
  convertedCoins: number;
  cappedFlag: boolean;
}

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
  rewardCoins: number;
  claimed: boolean;
}

export interface VisitorEvent {
  id: string;
  name: string;
  message: string;
  orderId: string | null;
  expiresAt: number;
  active: boolean;
}

export interface Player {
  townName: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  streak: number;
  lastWalkGoalDate: string | null;
  onboarded: boolean;
  lastStepSyncAt: number | null;
  lastKnownSteps: number;
  todaySteps: number;
  todayDate: string;
  mineEnergySpent: number;
  lastMineAt: number | null;
}

export interface GameState {
  player: Player;
  plots: Plot[];
  inventory: Record<ItemId, number>;
  orders: TownOrder[];
  dailyGoals: DailyGoal[];
  ledger: StepLedgerDay[];
  achievements: Achievement[];
  visitor: VisitorEvent | null;
  selectedShopItem: BuildingId | CropId | null;
  placeMode: 'none' | 'building' | 'crop' | 'expand';
  lastCoinToast: number;
  hydrated: boolean;
  dirtyAt: number;
}

export type CloudSavePayload = {
  player: Player;
  plots: Plot[];
  inventory: Record<ItemId, number>;
  orders: TownOrder[];
  dailyGoals: DailyGoal[];
  ledger: StepLedgerDay[];
  achievements: Achievement[];
  visitor: VisitorEvent | null;
  savedAt: number;
};

/** Public slice friends can see — no coins, inventory, or private economy. */
export type FriendTownSnapshot = {
  userId: string;
  friendCode: string;
  email: string;
  townName: string;
  level: number;
  todaySteps: number;
  todayDate: string;
  streak: number;
  plots: Plot[];
  savedAt: number;
};

export type FriendshipStatus = 'pending' | 'accepted';

export type Friendship = {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatus;
  createdAt: number;
};

export type FriendProfile = {
  id: string;
  email: string;
  friendCode: string;
  townName: string;
  displayName: string;
};
