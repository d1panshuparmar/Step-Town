import type { ItemId, OrderRequirement } from '@/lib/types';

export type MaterialId = 'hammer' | 'nail' | 'paint' | 'ingot';

export const MATERIAL_META: Record<
  MaterialId,
  { name: string; emoji: string }
> = {
  hammer: { name: 'Hammer', emoji: '🔨' },
  nail: { name: 'Nails', emoji: '🔩' },
  paint: { name: 'Paint', emoji: '🎨' },
  ingot: { name: 'Ingot', emoji: '🟫' },
};

export type TrainCar = {
  id: string;
  slot: number;
  requirements: OrderRequirement[];
  status: 'loading' | 'traveling' | 'ready';
  returnsAt?: number;
  rewards: Partial<Record<MaterialId, number>>;
};

export type AirportCrate = {
  id: string;
  row: number;
  col: number;
  requirement: OrderRequirement;
  filled: boolean;
  rewardCoins: number;
  rewardXp: number;
  rewardGems: number;
};

export type AirportBoard = {
  crates: AirportCrate[];
  expiresAt: number;
};

export type ZooAnimalDef = {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  unlockLevel: number;
  happiness: number;
};

export const ZOO_ANIMALS: ZooAnimalDef[] = [
  { id: 'bunny', name: 'Bunny', emoji: '🐰', cost: 80, unlockLevel: 2, happiness: 2 },
  { id: 'fox', name: 'Fox', emoji: '🦊', cost: 140, unlockLevel: 3, happiness: 3 },
  { id: 'deer', name: 'Deer', emoji: '🦌', cost: 200, unlockLevel: 4, happiness: 4 },
  { id: 'owl', name: 'Owl', emoji: '🦉', cost: 260, unlockLevel: 5, happiness: 4 },
  { id: 'bear', name: 'Bear', emoji: '🐻', cost: 350, unlockLevel: 6, happiness: 5 },
];

export const TRAIN_TRAVEL_MS = 3 * 60 * 1000; // 3 min for playability
export const AIRPORT_EXPIRE_MS = 4 * 60 * 60 * 1000;
export const GEM_SPEEDUP_COST = 1;
export const ACADEMY_INGOT_COST = 2;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const TRAIN_POOL: ItemId[] = [
  'wheat',
  'corn',
  'carrot',
  'bread',
  'feed',
  'egg',
  'milk',
  'tomato',
  'sugar',
  'juice',
];

export function emptyMaterials(): Record<MaterialId, number> {
  return { hammer: 0, nail: 0, paint: 0, ingot: 0 };
}

export function generateTrainCar(slot: number, level: number): TrainCar {
  const pool = TRAIN_POOL.filter((_, i) => i < 4 + level);
  const count = level >= 4 ? 2 : 1;
  const used = new Set<ItemId>();
  const requirements: OrderRequirement[] = [];
  for (let i = 0; i < count; i++) {
    const choices = pool.filter((p) => !used.has(p));
    if (!choices.length) break;
    const itemId = pick(choices);
    used.add(itemId);
    requirements.push({ itemId, qty: randInt(1, 2 + Math.min(2, level)) });
  }
  const materials: MaterialId[] = ['hammer', 'nail', 'paint', 'ingot'];
  const rewards: Partial<Record<MaterialId, number>> = {};
  const mat = pick(materials);
  rewards[mat] = randInt(1, 2);
  if (level >= 3 && Math.random() > 0.5) {
    const mat2 = pick(materials.filter((m) => m !== mat));
    rewards[mat2] = 1;
  }
  return {
    id: `train-${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    slot,
    requirements,
    status: 'loading',
    rewards,
  };
}

export function generateTrains(level: number): TrainCar[] {
  return [0, 1, 2].map((slot) => generateTrainCar(slot, level));
}

export function generateAirport(level: number): AirportBoard {
  const pool: ItemId[] = [
    'wheat',
    'corn',
    'bread',
    'egg',
    'milk',
    'carrot',
    'juice',
    'sugar',
  ].slice(0, 4 + Math.min(4, level)) as ItemId[];
  const crates: AirportCrate[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const itemId = pick(pool);
      crates.push({
        id: `air-${row}-${col}-${Date.now()}`,
        row,
        col,
        requirement: { itemId, qty: randInt(1, 2) },
        filled: false,
        rewardCoins: 20 + level * 5 + row * 8,
        rewardXp: 6 + row * 3,
        rewardGems: row === 2 && col === 1 ? 1 : 0,
      });
    }
  }
  return {
    crates,
    expiresAt: Date.now() + AIRPORT_EXPIRE_MS,
  };
}

export function barnMaterialCost(level: number): Partial<Record<MaterialId, number>> {
  if (level < 1) return {};
  if (level < 3) return { hammer: 1 };
  if (level < 5) return { hammer: 1, nail: 1 };
  return { hammer: 1, nail: 1, paint: 1 };
}

/** Academy: each level reduces factory time by 5%, max 10 */
export function factoryTimeMult(academyLevel: number): number {
  return Math.max(0.5, 1 - academyLevel * 0.05);
}
