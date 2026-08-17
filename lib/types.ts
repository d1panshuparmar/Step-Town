export type ItemId =
  | 'wheat'
  | 'corn'
  | 'carrot'
  | 'tomato'
  | 'sugarcane'
  | 'potato'
  | 'cotton'
  | 'strawberry'
  | 'rice'
  | 'pumpkin'
  | 'apple'
  | 'bread'
  | 'feed'
  | 'egg'
  | 'milk'
  | 'sugar'
  | 'juice'
  | 'ore'
  | 'cheese'
  | 'butter'
  | 'cream'
  | 'cookies'
  | 'cake'
  | 'jam'
  | 'cloth'
  | 'wool'
  | 'honey'
  | 'fish'
  | 'wood'
  | 'clay'
  | 'iron'
  | 'coal';

export type CropId =
  | 'wheat'
  | 'corn'
  | 'carrot'
  | 'tomato'
  | 'sugarcane'
  | 'potato'
  | 'cotton'
  | 'strawberry'
  | 'rice'
  | 'pumpkin'
  | 'apple';

export type BuildingId =
  | 'house'
  | 'barn'
  | 'bakery'
  | 'feed_mill'
  | 'chicken_coop'
  | 'dairy'
  | 'sugar_mill'
  | 'juice_plant'
  | 'flower_bed'
  | 'well'
  | 'park'
  | 'statue'
  | 'apartment'
  | 'cafe'
  | 'school'
  | 'textile_mill'
  | 'pigsty'
  | 'sheep_pen'
  | 'beehive'
  | 'road'
  | 'fountain'
  | 'lamp'
  | 'fence'
  | 'market'
  | 'hospital';

export type PlotKind = 'empty' | 'crop' | 'building';

export type DailyGoalType = 'walk_steps' | 'harvest_crops' | 'complete_orders';

export type AchievementId =
  | 'first_harvest'
  | 'first_order'
  | 'streak_3'
  | 'expand_land'
  | 'bake_bread'
  | 'first_mine'
  | 'coop_eggs'
  | 'farmer_100'
  | 'builder_10'
  | 'entrepreneur'
  | 'industrialist'
  | 'socialite'
  | 'angler';

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

export interface FactoryRecipe {
  id: string;
  input: ItemId;
  inputQty: number;
  /** Optional second ingredient (e.g. cookies = wheat + sugar) */
  input2?: ItemId;
  input2Qty?: number;
  output: ItemId;
  outputQty: number;
  processMs: number;
}

export interface BuildingDef {
  id: BuildingId;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  unlockLevel: number;
  kind: 'home' | 'factory' | 'decor' | 'storage' | 'road' | 'service';
  unique?: boolean;
  population?: number;
  happiness?: number;
  storageBonus?: number;
  minPopulation?: number;
  /** Township-style production slots */
  queueSlots?: number;
  shelfSlots?: number;
  recipes?: FactoryRecipe[];
  /** @deprecated single recipe — prefer recipes[] */
  recipe?: {
    input: ItemId;
    inputQty: number;
    output: ItemId;
    outputQty: number;
    processMs: number;
  };
}

/** One job cooking in a factory */
export type FactoryJob = {
  recipeId: string;
  output: ItemId;
  outputQty: number;
  readyAt: number;
};

/** Finished goods waiting on the factory shelf */
export type FactoryShelfItem = {
  itemId: ItemId;
  qty: number;
};

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
  /** Legacy single-slot — migrated into factoryQueue */
  processing?: boolean;
  processReadyAt?: number;
  factoryQueue?: FactoryJob[];
  factoryShelf?: FactoryShelfItem[];
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
  /** Barn upgrade level (Township storage bottleneck) */
  barnLevel: number;
  /** Calendar date of last daily reward claim (YYYY-MM-DD) */
  lastDailyClaimDate: string | null;
  dailyClaimStreak: number;
  /** Epoch ms — used for offline welcome summary */
  lastSeenAt: number;
  fishCaught: number;
  eventTokens: number;
  eventProgress: number;
  eventId: string | null;
  eventClaimed: boolean;
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
  placeMode: 'none' | 'building' | 'crop' | 'expand' | 'move' | 'sell';
  /** Plot id when relocating a building */
  moveFromPlotId: string | null;
  materials: Record<string, number>;
  trains: import('@/lib/townshipExtras').TrainCar[];
  airport: import('@/lib/townshipExtras').AirportBoard | null;
  zooOwned: string[];
  /** Academy levels per factory building id */
  academyLevels: Record<string, number>;
  lastCoinToast: number;
  hydrated: boolean;
  dirtyAt: number;
  /** Informational lines shown once after returning from offline */
  offlineWelcome: string[] | null;
  quests: import('@/lib/quests').QuestProgress[];
  settings: import('@/lib/settings').GameSettings;
  club: import('@/lib/clubs').ClubState | null;
  tutorialDone: boolean;
  stats: {
    harvests: number;
    orders: number;
    produced: number;
    buildings: number;
    coinsEarned: number;
  };
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
  materials?: Record<string, number>;
  trains?: import('@/lib/townshipExtras').TrainCar[];
  airport?: import('@/lib/townshipExtras').AirportBoard | null;
  zooOwned?: string[];
  academyLevels?: Record<string, number>;
  /** Mirrored on player; kept for older clients / explicit cloud fields */
  lastDailyClaimDate?: string | null;
  dailyClaimStreak?: number;
  lastSeenAt?: number;
  fishCaught?: number;
  quests?: import('@/lib/quests').QuestProgress[];
  settings?: import('@/lib/settings').GameSettings;
  club?: import('@/lib/clubs').ClubState | null;
  tutorialDone?: boolean;
  stats?: GameState['stats'];
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
