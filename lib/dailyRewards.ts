import { todayKey, yesterdayKey } from '@/lib/date';
import type { ItemId } from '@/lib/types';

export type DailyRewardGrant = {
  coins?: number;
  gems?: number;
  items?: Partial<Record<ItemId, number>>;
};

export type DailyRewardDay = {
  day: number;
  label: string;
  reward: DailyRewardGrant;
};

/** 7-day login cycle — day index is 1–7 */
export const DAILY_REWARD_CYCLE: DailyRewardDay[] = [
  { day: 1, label: 'Day 1', reward: { coins: 40 } },
  { day: 2, label: 'Day 2', reward: { coins: 60, items: { wheat: 2 } } },
  { day: 3, label: 'Day 3', reward: { gems: 1, coins: 30 } },
  { day: 4, label: 'Day 4', reward: { coins: 80, items: { corn: 2 } } },
  { day: 5, label: 'Day 5', reward: { coins: 100, items: { bread: 1 } } },
  { day: 6, label: 'Day 6', reward: { gems: 2, items: { egg: 2 } } },
  {
    day: 7,
    label: 'Day 7',
    reward: { coins: 150, gems: 3, items: { fish: 1, honey: 1 } },
  },
];

export function nextDailyStreak(
  lastClaimDate: string | null,
  currentStreak: number,
  today = todayKey()
): number {
  if (lastClaimDate === today) return currentStreak;
  if (lastClaimDate === yesterdayKey()) {
    return currentStreak >= 7 ? 1 : currentStreak + 1;
  }
  return 1;
}

export function rewardForStreak(streak: number): DailyRewardDay {
  const day = ((Math.max(1, streak) - 1) % 7) + 1;
  return DAILY_REWARD_CYCLE[day - 1]!;
}

export function canClaimDaily(
  lastClaimDate: string | null,
  today = todayKey()
): boolean {
  return lastClaimDate !== today;
}
