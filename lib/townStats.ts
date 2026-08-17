import { BASE_WAREHOUSE, BARN_LEVEL_BONUS, BUILDINGS } from '@/constants/catalog';
import { ZOO_ANIMALS } from '@/lib/townshipExtras';
import type { ItemId, Plot } from '@/lib/types';

export function inventoryUsed(
  inventory: Partial<Record<ItemId, number>> | Record<string, number> | undefined
): number {
  if (!inventory) return 0;
  return Object.values(inventory).reduce(
    (a, b) => a + (typeof b === 'number' && Number.isFinite(b) ? b : 0),
    0
  );
}

export function warehouseCapacity(plots: Plot[], barnLevel = 0): number {
  let bonus = barnLevel * BARN_LEVEL_BONUS;
  for (const p of plots) {
    if (p.kind === 'building' && p.buildingId) {
      bonus += BUILDINGS[p.buildingId]?.storageBonus ?? 0;
    }
  }
  return BASE_WAREHOUSE + bonus;
}

export function townPopulation(plots: Plot[]): number {
  let pop = 0;
  for (const p of plots) {
    if (p.kind === 'building' && p.buildingId) {
      pop += BUILDINGS[p.buildingId]?.population ?? 0;
    }
  }
  return pop;
}

export function townHappiness(plots: Plot[], zooOwned: string[] = []): number {
  let happy = 0;
  for (const p of plots) {
    if (p.kind === 'building' && p.buildingId) {
      happy += BUILDINGS[p.buildingId]?.happiness ?? 0;
    }
  }
  for (const id of zooOwned) {
    const a = ZOO_ANIMALS.find((z) => z.id === id);
    happy += a?.happiness ?? 0;
  }
  return happy;
}

/** Soft order coin multiplier from happiness (1.0 – 1.25). */
export function happinessMultiplier(happiness: number): number {
  return Math.min(1.25, 1 + happiness * 0.02);
}

export function mineEnergyAvailable(todaySteps: number, spent: number): number {
  return Math.max(0, todaySteps - spent);
}
