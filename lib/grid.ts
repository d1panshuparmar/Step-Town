import { GRID_SIZE } from '@/constants/catalog';
import type { BuildingId, Plot } from '@/lib/types';

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

/** ~4×4 unlocked center meadow (empty plots). */
export function createInitialPlots(): Plot[] {
  const plots: Plot[] = [];
  const cx = Math.floor(GRID_SIZE / 2) - 1; // 2 on 7×7
  const cy = Math.floor(GRID_SIZE / 2) - 1;

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      const inStarter =
        x >= cx - 1 && x <= cx + 2 && y >= cy - 1 && y <= cy + 2;
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

type StarterPlace = { x: number; y: number; buildingId: BuildingId };

/**
 * Populate a fresh town: house + barn + decor, leave 3 empty farm plots.
 * Layout assumes 7×7 with 4×4 unlock centered near (2..5, 2..5).
 */
export function applyStarterTown(plots: Plot[]): Plot[] {
  const places: StarterPlace[] = [
    { x: 3, y: 3, buildingId: 'house' },
    { x: 4, y: 2, buildingId: 'barn' },
    { x: 2, y: 2, buildingId: 'flower_bed' },
    { x: 1, y: 3, buildingId: 'park' },
    { x: 2, y: 4, buildingId: 'lamp' },
    { x: 4, y: 4, buildingId: 'road' },
  ];
  // Empty farm plots adjacent to house
  const farmKeys = new Set(['2,3', '3,4', '3,2']);

  return plots.map((p) => {
    const place = places.find((pl) => pl.x === p.x && pl.y === p.y);
    if (place) {
      return {
        ...p,
        unlocked: true,
        kind: 'building' as const,
        buildingId: place.buildingId,
      };
    }
    if (farmKeys.has(`${p.x},${p.y}`)) {
      return { ...p, unlocked: true, kind: 'empty' as const };
    }
    // Keep existing unlock from createInitialPlots 4×4
    return p;
  });
}

export function plotKey(x: number, y: number): string {
  return `p-${x}-${y}`;
}
