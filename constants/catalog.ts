import type {
  Achievement,
  AchievementId,
  BuildingDef,
  CropDef,
  ItemId,
} from '@/lib/types';

export const GRID_SIZE = 6;

export const STEPS_PER_COIN = 10;
export const FULL_RATE_STEP_CAP = 12_000;
export const WALK_GOAL_STEPS = 1_000;
export const ORDER_EXPIRE_MS = 6 * 60 * 60 * 1000;
export const BASE_WAREHOUSE = 40;
export const MINE_ENERGY_PER_DIG = 400;
export const MINE_COOLDOWN_MS = 8_000;

export function xpForLevel(level: number): number {
  return 40 + (level - 1) * 25;
}

export const ITEM_META: Record<ItemId, { name: string; emoji: string }> = {
  wheat: { name: 'Wheat', emoji: '🌾' },
  corn: { name: 'Corn', emoji: '🌽' },
  carrot: { name: 'Carrot', emoji: '🥕' },
  bread: { name: 'Bread', emoji: '🍞' },
  feed: { name: 'Feed', emoji: '🥣' },
  egg: { name: 'Egg', emoji: '🥚' },
  milk: { name: 'Milk', emoji: '🥛' },
  ore: { name: 'Ore', emoji: '🪨' },
};

export const CROPS: Record<string, CropDef> = {
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    emoji: '🌾',
    seedCost: 5,
    growMs: 20_000,
    yieldItem: 'wheat',
    yieldQty: 2,
    unlockLevel: 1,
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    emoji: '🌽',
    seedCost: 10,
    growMs: 40_000,
    yieldItem: 'corn',
    yieldQty: 2,
    unlockLevel: 2,
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    emoji: '🥕',
    seedCost: 15,
    growMs: 60_000,
    yieldItem: 'carrot',
    yieldQty: 2,
    unlockLevel: 3,
  },
};

export const BUILDINGS: Record<string, BuildingDef> = {
  house: {
    id: 'house',
    name: 'Cottage',
    emoji: '🏠',
    description: 'Homes raise town population.',
    cost: 100,
    unlockLevel: 1,
    kind: 'home',
    population: 2,
    happiness: 1,
  },
  barn: {
    id: 'barn',
    name: 'Barn',
    emoji: '🏚️',
    description: '+20 warehouse capacity.',
    cost: 80,
    unlockLevel: 1,
    kind: 'storage',
    storageBonus: 20,
    happiness: 1,
  },
  bakery: {
    id: 'bakery',
    name: 'Bakery',
    emoji: '🥖',
    description: 'Bake wheat into bread.',
    cost: 120,
    unlockLevel: 2,
    kind: 'factory',
    unique: true,
    recipe: {
      input: 'wheat',
      inputQty: 2,
      output: 'bread',
      outputQty: 1,
      processMs: 25_000,
    },
  },
  feed_mill: {
    id: 'feed_mill',
    name: 'Feed Mill',
    emoji: '🏭',
    description: 'Grind corn into chicken feed.',
    cost: 140,
    unlockLevel: 2,
    kind: 'factory',
    unique: true,
    recipe: {
      input: 'corn',
      inputQty: 2,
      output: 'feed',
      outputQty: 2,
      processMs: 22_000,
    },
  },
  chicken_coop: {
    id: 'chicken_coop',
    name: 'Chicken Coop',
    emoji: '🐔',
    description: 'Feed hens to collect eggs.',
    cost: 160,
    unlockLevel: 3,
    kind: 'factory',
    unique: true,
    recipe: {
      input: 'feed',
      inputQty: 1,
      output: 'egg',
      outputQty: 2,
      processMs: 30_000,
    },
  },
  dairy: {
    id: 'dairy',
    name: 'Dairy',
    emoji: '🐄',
    description: 'Turn corn into fresh milk.',
    cost: 200,
    unlockLevel: 4,
    kind: 'factory',
    unique: true,
    recipe: {
      input: 'corn',
      inputQty: 3,
      output: 'milk',
      outputQty: 1,
      processMs: 35_000,
    },
  },
  flower_bed: {
    id: 'flower_bed',
    name: 'Flower Bed',
    emoji: '🌸',
    description: 'Pretty blooms for happiness.',
    cost: 40,
    unlockLevel: 1,
    kind: 'decor',
    happiness: 2,
  },
  well: {
    id: 'well',
    name: 'Town Well',
    emoji: '🪣',
    description: 'A landmark for the square.',
    cost: 150,
    unlockLevel: 3,
    kind: 'decor',
    happiness: 3,
  },
  park: {
    id: 'park',
    name: 'Town Park',
    emoji: '🌳',
    description: 'A green square for townsfolk.',
    cost: 180,
    unlockLevel: 3,
    kind: 'decor',
    happiness: 4,
    population: 1,
  },
};

export const CUSTOMERS = [
  'Mira',
  'Theo',
  'Jun',
  'Asha',
  'Leo',
  'Nora',
  'Sam',
  'Ivy',
  'Kai',
  'Rue',
];

export const ACHIEVEMENT_DEFS: Record<
  AchievementId,
  { title: string; description: string; rewardCoins: number }
> = {
  first_harvest: {
    title: 'First Harvest',
    description: 'Harvest any crop.',
    rewardCoins: 25,
  },
  first_order: {
    title: 'Open for Business',
    description: 'Complete your first town order.',
    rewardCoins: 40,
  },
  streak_3: {
    title: 'Steady Walker',
    description: 'Reach a 3-day walk streak.',
    rewardCoins: 60,
  },
  expand_land: {
    title: 'City Limits',
    description: 'Unlock a new plot of land.',
    rewardCoins: 35,
  },
  bake_bread: {
    title: 'Fresh Loaf',
    description: 'Collect bread from the bakery.',
    rewardCoins: 45,
  },
  first_mine: {
    title: 'Deep Steps',
    description: 'Dig in the mine once.',
    rewardCoins: 50,
  },
  coop_eggs: {
    title: 'Egg Basket',
    description: 'Collect eggs from the coop.',
    rewardCoins: 45,
  },
};

export function createAchievements(): Achievement[] {
  return (Object.keys(ACHIEVEMENT_DEFS) as AchievementId[]).map((id) => ({
    id,
    title: ACHIEVEMENT_DEFS[id].title,
    description: ACHIEVEMENT_DEFS[id].description,
    unlocked: false,
    rewardCoins: ACHIEVEMENT_DEFS[id].rewardCoins,
    claimed: false,
  }));
}
