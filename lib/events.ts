import { todayKey } from '@/lib/date';

export type EventId =
  | 'harvest_festival'
  | 'winter_lights'
  | 'beach_bash'
  | 'spooky_hunt'
  | 'fishing_derby';

export type TownEvent = {
  id: EventId;
  name: string;
  emoji: string;
  description: string;
  /** Event token name shown in UI */
  tokenName: string;
  /** Ends at end of this calendar day (YYYY-MM-DD) */
  endsOn: string;
  questLabel: string;
  questTarget: number;
  rewardCoins: number;
  rewardGems: number;
  rewardTokens: number;
};

const EVENT_ROTATION: Omit<TownEvent, 'endsOn'>[] = [
  {
    id: 'harvest_festival',
    name: 'Harvest Festival',
    emoji: '🎃',
    description: 'Harvest crops for festival tokens.',
    tokenName: 'Leaf Tokens',
    questLabel: 'Harvest 12 crops during the festival',
    questTarget: 12,
    rewardCoins: 150,
    rewardGems: 3,
    rewardTokens: 20,
  },
  {
    id: 'winter_lights',
    name: 'Winter Lights',
    emoji: '❄️',
    description: 'Complete orders to light the town.',
    tokenName: 'Snowflakes',
    questLabel: 'Complete 5 orders',
    questTarget: 5,
    rewardCoins: 180,
    rewardGems: 4,
    rewardTokens: 25,
  },
  {
    id: 'beach_bash',
    name: 'Beach Bash',
    emoji: '🏖️',
    description: 'Catch fish for the pier party.',
    tokenName: 'Shells',
    questLabel: 'Catch 6 fish',
    questTarget: 6,
    rewardCoins: 140,
    rewardGems: 3,
    rewardTokens: 18,
  },
  {
    id: 'spooky_hunt',
    name: 'Treasure Hunt',
    emoji: '🗺️',
    description: 'Dig the mine for buried prizes.',
    tokenName: 'Maps',
    questLabel: 'Dig the mine 8 times',
    questTarget: 8,
    rewardCoins: 160,
    rewardGems: 4,
    rewardTokens: 22,
  },
  {
    id: 'fishing_derby',
    name: 'Fishing Derby',
    emoji: '🎣',
    description: 'Compete for the biggest catch.',
    tokenName: 'Medals',
    questLabel: 'Catch 10 fish',
    questTarget: 10,
    rewardCoins: 200,
    rewardGems: 5,
    rewardTokens: 30,
  },
];

/** Pick a weekly rotating event ending in 2 days. */
export function activeTownEvent(date = new Date()): TownEvent {
  const day = Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  const idx = Math.floor(day / 2) % EVENT_ROTATION.length;
  const base = EVENT_ROTATION[idx];
  const end = new Date(date);
  end.setDate(end.getDate() + (day % 2 === 0 ? 1 : 0));
  return {
    ...base,
    endsOn: todayKey(end),
  };
}

export function eventStillActive(ev: TownEvent, date = new Date()): boolean {
  return todayKey(date) <= ev.endsOn;
}
