import { BUILDINGS, CROPS } from '@/constants/catalog';
import { formatDuration } from '@/lib/date';
import type { Plot } from '@/lib/types';

const MIN_OFFLINE_MS = 90_000;

/**
 * Informational summary of crops/factories that became ready while away.
 * Timestamps already advance progress — this does not mutate state.
 */
export function computeOfflineGains(
  plots: Plot[],
  lastSeenAt: number,
  now = Date.now()
): string[] {
  if (!lastSeenAt || now - lastSeenAt < MIN_OFFLINE_MS) return [];

  const awayMs = now - lastSeenAt;
  const lines: string[] = [
    `Welcome back! You were away ${formatDuration(awayMs)}.`,
  ];

  let cropsReady = 0;
  let factoryReady = 0;

  for (const plot of plots) {
    if (
      plot.kind === 'crop' &&
      plot.cropId &&
      plot.readyAt &&
      plot.readyAt > lastSeenAt &&
      plot.readyAt <= now
    ) {
      cropsReady += 1;
    }

    if (plot.kind === 'building' && plot.buildingId) {
      const def = BUILDINGS[plot.buildingId];
      if (def?.kind === 'factory') {
        const shelf = plot.factoryShelf ?? [];
        const queue = plot.factoryQueue ?? [];
        for (const job of queue) {
          if (job.readyAt > lastSeenAt && job.readyAt <= now) {
            factoryReady += 1;
          }
        }
        // Shelf goods already waiting when you left still count as ready loot
        if (shelf.length && lastSeenAt > 0) {
          factoryReady += shelf.length;
        }
      }
    }
  }

  if (cropsReady > 0) {
    lines.push(
      `${cropsReady} crop${cropsReady === 1 ? '' : 's'} finished growing.`
    );
  }
  if (factoryReady > 0) {
    lines.push(
      `${factoryReady} factory job${factoryReady === 1 ? '' : 's'} ready to collect.`
    );
  }

  // Growing crops still in progress
  const stillGrowing = plots.filter(
    (p) =>
      p.kind === 'crop' &&
      p.cropId &&
      p.readyAt &&
      p.readyAt > now
  ).length;
  if (stillGrowing > 0) {
    lines.push(`${stillGrowing} field${stillGrowing === 1 ? '' : 's'} still growing.`);
  }

  if (cropsReady === 0 && factoryReady === 0) {
    return [];
  }

  return lines;
}

export function cropGrowthStage(
  plantedAt: number | undefined,
  readyAt: number | undefined,
  now = Date.now()
): 1 | 2 | 3 {
  if (!plantedAt || !readyAt || readyAt <= plantedAt) return 3;
  if (now >= readyAt) return 3;
  const t = (now - plantedAt) / (readyAt - plantedAt);
  if (t < 0.34) return 1;
  if (t < 0.72) return 2;
  return 3;
}

export function cropLabel(cropId: string | undefined): string {
  if (!cropId) return 'Crop';
  return CROPS[cropId]?.name ?? cropId;
}
