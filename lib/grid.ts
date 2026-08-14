import { GRID_SIZE } from '@/constants/catalog';
import type { Plot } from '@/lib/types';

function unlockCostFor(x: number, y: number): number {
  const cx = (GRID_SIZE - 1) / 2;
  const cy = (GRID_SIZE - 1) / 2;
  const dist = Math.abs(x - cx) + Math.abs(y - cy);
  return 30 + dist * 25;
}

function unlockLevelFor(x: number, y: number): number {
  const cx = (GRID_SIZE - 1) / 2;
  const cy = (GRID_SIZE - 1) / 2;
  const dist = Math.abs(x - cx) + Math.abs(y - cy);
  if (dist <= 1) return 1;
  if (dist <= 2) return 2;
  return 3;
}

export function createInitialPlots(): Plot[] {
  const plots: Plot[] = [];
  const cx = Math.floor(GRID_SIZE / 2) - 1;
  const cy = Math.floor(GRID_SIZE / 2) - 1;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const inStarter = x >= cx && x <= cx + 1 && y >= cy && y <= cy + 1;
      plots.push({
        id: `p-${x}-${y}`,
        x,
        y,
        unlocked: inStarter,
        unlockCost: unlockCostFor(x, y),
        unlockLevel: unlockLevelFor(x, y),
        kind: 'empty',
      });
    }
  }
  return plots;
}

export function plotKey(x: number, y: number): string {
  return `p-${x}-${y}`;
}
