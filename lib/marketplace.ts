import { ITEM_META } from '@/constants/catalog';
import type { ItemId } from '@/lib/types';

/** Soft supply/demand swing ±20% based on hour + item. */
export function marketMultiplier(itemId: ItemId, date = new Date()): number {
  const hour = date.getHours();
  const seed = itemId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const wave = Math.sin((hour + seed) * 0.7) * 0.2;
  return Math.max(0.75, Math.min(1.25, 1 + wave));
}

export function sellPrice(itemId: ItemId, date = new Date()): number {
  const base = ITEM_META[itemId]?.sellPrice ?? 1;
  return Math.max(1, Math.round(base * marketMultiplier(itemId, date)));
}

export function buyPrice(itemId: ItemId, date = new Date()): number {
  const base = ITEM_META[itemId]?.sellPrice ?? 1;
  return Math.max(2, Math.round(base * 2.2 * marketMultiplier(itemId, date)));
}

export const MARKET_ITEMS: ItemId[] = [
  'wheat',
  'corn',
  'carrot',
  'bread',
  'egg',
  'milk',
  'sugar',
  'cloth',
  'wood',
  'iron',
  'fish',
  'honey',
];
