import { BASE_WAREHOUSE, BUILDINGS } from '@/constants/catalog';
import type { ItemId, Plot } from '@/lib/types';

export function inventoryUsed(inventory: Record<ItemId, number>): number {
  return (Object.values(inventory) as number[]).reduce((a, b) => a + b, 0);
}

export function warehouseCapacity(plots: Plot[]): number {
  let bonus = 0;
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

export function townHappiness(plots: Plot[]): number {
  let happy = 0;
  for (const p of plots) {
    if (p.kind === 'building' && p.buildingId) {
      happy += BUILDINGS[p.buildingId]?.happiness ?? 0;
    }
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
