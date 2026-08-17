import { BUILDINGS, CROPS, CUSTOMERS, ITEM_META, ORDER_EXPIRE_MS } from '@/constants/catalog';
import type { ItemId, OrderRequirement, TownOrder } from '@/lib/types';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

const ORDER_POOL: { itemId: ItemId; minLevel: number }[] = [
  { itemId: 'wheat', minLevel: 1 },
  { itemId: 'corn', minLevel: 2 },
  { itemId: 'carrot', minLevel: 3 },
  { itemId: 'tomato', minLevel: 4 },
  { itemId: 'sugarcane', minLevel: 5 },
  { itemId: 'potato', minLevel: 6 },
  { itemId: 'cotton', minLevel: 7 },
  { itemId: 'strawberry', minLevel: 7 },
  { itemId: 'bread', minLevel: 2 },
  { itemId: 'feed', minLevel: 2 },
  { itemId: 'egg', minLevel: 3 },
  { itemId: 'milk', minLevel: 4 },
  { itemId: 'sugar', minLevel: 5 },
  { itemId: 'juice', minLevel: 5 },
  { itemId: 'cookies', minLevel: 5 },
  { itemId: 'cheese', minLevel: 5 },
  { itemId: 'cloth', minLevel: 7 },
  { itemId: 'wool', minLevel: 6 },
  { itemId: 'honey', minLevel: 6 },
  { itemId: 'fish', minLevel: 3 },
  { itemId: 'ore', minLevel: 2 },
];

export function generateOrder(
  slot: number,
  level: number,
  bonus = false
): TownOrder {
  const available = ORDER_POOL.filter((p) => p.minLevel <= level);
  const count = level >= 4 ? randInt(1, 3) : level >= 3 ? randInt(1, 2) : 1;
  const used = new Set<ItemId>();
  const requirements: OrderRequirement[] = [];

  for (let i = 0; i < count; i++) {
    const choices = available.filter((a) => !used.has(a.itemId));
    if (!choices.length) break;
    const choice = pick(choices);
    used.add(choice.itemId);
    const qty =
      choice.itemId === 'bread' ||
      choice.itemId === 'milk' ||
      choice.itemId === 'juice' ||
      choice.itemId === 'sugar'
        ? randInt(1, 2)
        : randInt(1, 3 + Math.min(2, level));
    requirements.push({ itemId: choice.itemId, qty });
  }

  const rewardCoins = requirements.reduce((sum, r) => {
    const crop = CROPS[r.itemId];
    const sell = ITEM_META[r.itemId]?.sellPrice ?? 12;
    const base = crop ? crop.seedCost * 2.5 : sell * 2.2;
    return sum + Math.round(base * r.qty);
  }, 0);
  const rewardXp = 8 + requirements.reduce((s, r) => s + r.qty * 4, 0);
  const mult = bonus ? 1.5 : 1;

  return {
    id: `ord-${slot}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    slot,
    customer: pick(CUSTOMERS),
    requirements,
    rewardCoins: Math.max(15, Math.round(rewardCoins * mult)),
    rewardXp: Math.round(rewardXp * mult),
    expiresAt: Date.now() + ORDER_EXPIRE_MS,
    bonus,
  };
}

/** Township helicopter pad: 4 order slots */
export function generateOrders(level: number): TownOrder[] {
  return [0, 1, 2, 3].map((slot) => generateOrder(slot, level));
}

export function itemValueHint(itemId: ItemId): number {
  return ITEM_META[itemId]?.sellPrice ?? BUILDINGS.bakery.cost / 10;
}
