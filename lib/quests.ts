import type { ItemId } from '@/lib/types';

export type QuestId =
  | 'welcome_plant'
  | 'welcome_harvest'
  | 'welcome_bakery'
  | 'welcome_bread'
  | 'welcome_order'
  | 'welcome_house'
  | 'grow_town'
  | 'industrialist'
  | 'trader'
  | 'explorer';

export type QuestKind =
  | 'plant_crop'
  | 'harvest_crops'
  | 'build'
  | 'produce'
  | 'complete_orders'
  | 'unlock_plots'
  | 'earn_coins'
  | 'reach_level';

export type QuestDef = {
  id: QuestId;
  title: string;
  description: string;
  kind: QuestKind;
  target: number;
  /** Optional filter (crop/building/item id) */
  targetId?: string;
  rewardCoins: number;
  rewardXp: number;
  rewardGems: number;
  unlockLevel: number;
  /** Previous quest that must be claimed first (chain) */
  requires?: QuestId;
};

export type QuestProgress = {
  id: QuestId;
  progress: number;
  claimed: boolean;
};

export const QUEST_DEFS: QuestDef[] = [
  {
    id: 'welcome_plant',
    title: 'First Seeds',
    description: 'Plant wheat on any farm plot.',
    kind: 'plant_crop',
    target: 1,
    targetId: 'wheat',
    rewardCoins: 20,
    rewardXp: 15,
    rewardGems: 0,
    unlockLevel: 1,
  },
  {
    id: 'welcome_harvest',
    title: 'Golden Fields',
    description: 'Harvest 2 crops.',
    kind: 'harvest_crops',
    target: 2,
    rewardCoins: 30,
    rewardXp: 20,
    rewardGems: 0,
    unlockLevel: 1,
    requires: 'welcome_plant',
  },
  {
    id: 'welcome_bakery',
    title: 'Sweet Smell',
    description: 'Build a Bakery.',
    kind: 'build',
    target: 1,
    targetId: 'bakery',
    rewardCoins: 40,
    rewardXp: 30,
    rewardGems: 1,
    unlockLevel: 1,
    requires: 'welcome_harvest',
  },
  {
    id: 'welcome_bread',
    title: 'Fresh Loaf',
    description: 'Produce bread once.',
    kind: 'produce',
    target: 1,
    targetId: 'bread',
    rewardCoins: 35,
    rewardXp: 25,
    rewardGems: 0,
    unlockLevel: 1,
    requires: 'welcome_bakery',
  },
  {
    id: 'welcome_order',
    title: 'Happy Customer',
    description: 'Complete 1 helicopter order.',
    kind: 'complete_orders',
    target: 1,
    rewardCoins: 50,
    rewardXp: 40,
    rewardGems: 1,
    unlockLevel: 1,
    requires: 'welcome_bread',
  },
  {
    id: 'welcome_house',
    title: 'New Neighbors',
    description: 'Build a second house.',
    kind: 'build',
    target: 2,
    targetId: 'house',
    rewardCoins: 60,
    rewardXp: 45,
    rewardGems: 1,
    unlockLevel: 2,
    requires: 'welcome_order',
  },
  {
    id: 'grow_town',
    title: 'City Limits',
    description: 'Unlock 4 land plots.',
    kind: 'unlock_plots',
    target: 4,
    rewardCoins: 80,
    rewardXp: 60,
    rewardGems: 2,
    unlockLevel: 3,
    requires: 'welcome_house',
  },
  {
    id: 'industrialist',
    title: 'Busy Factory',
    description: 'Produce 10 factory goods.',
    kind: 'produce',
    target: 10,
    rewardCoins: 100,
    rewardXp: 80,
    rewardGems: 2,
    unlockLevel: 4,
    requires: 'grow_town',
  },
  {
    id: 'trader',
    title: 'Market Mogul',
    description: 'Complete 8 orders.',
    kind: 'complete_orders',
    target: 8,
    rewardCoins: 120,
    rewardXp: 90,
    rewardGems: 3,
    unlockLevel: 5,
    requires: 'industrialist',
  },
  {
    id: 'explorer',
    title: 'Town Mayor',
    description: 'Reach town level 8.',
    kind: 'reach_level',
    target: 8,
    rewardCoins: 200,
    rewardXp: 100,
    rewardGems: 5,
    unlockLevel: 6,
    requires: 'trader',
  },
];

export function createQuestProgress(): QuestProgress[] {
  return QUEST_DEFS.map((q) => ({
    id: q.id,
    progress: 0,
    claimed: false,
  }));
}

export function questDef(id: QuestId): QuestDef | undefined {
  return QUEST_DEFS.find((q) => q.id === id);
}

export function isQuestActive(
  q: QuestProgress,
  all: QuestProgress[],
  level: number
): boolean {
  const def = questDef(q.id);
  if (!def || q.claimed) return false;
  if (level < def.unlockLevel) return false;
  if (!def.requires) return true;
  const prev = all.find((x) => x.id === def.requires);
  return !!prev?.claimed;
}

export function bumpQuest(
  quests: QuestProgress[],
  kind: QuestKind,
  amount: number,
  targetId?: string | ItemId
): QuestProgress[] {
  return quests.map((q) => {
    const def = questDef(q.id);
    if (!def || q.claimed || def.kind !== kind) return q;
    if (def.targetId && def.targetId !== targetId) return q;
    return {
      ...q,
      progress: Math.min(def.target, q.progress + amount),
    };
  });
}

export function setQuestProgress(
  quests: QuestProgress[],
  kind: QuestKind,
  progress: number,
  targetId?: string
): QuestProgress[] {
  return quests.map((q) => {
    const def = questDef(q.id);
    if (!def || q.claimed || def.kind !== kind) return q;
    if (def.targetId && targetId && def.targetId !== targetId) return q;
    if (def.targetId && !targetId && def.kind !== 'reach_level') return q;
    return { ...q, progress: Math.min(def.target, progress) };
  });
}
