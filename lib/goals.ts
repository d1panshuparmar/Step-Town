import type { DailyGoal } from '@/lib/types';

export function createDailyGoals(): DailyGoal[] {
  return [
    {
      id: 'walk',
      type: 'walk_steps',
      label: 'Walk 2,000 steps',
      target: 2000,
      progress: 0,
      claimed: false,
      rewardCoins: 40,
      rewardGems: 1,
    },
    {
      id: 'harvest',
      type: 'harvest_crops',
      label: 'Harvest 3 crops',
      target: 3,
      progress: 0,
      claimed: false,
      rewardCoins: 30,
      rewardGems: 0,
    },
    {
      id: 'orders',
      type: 'complete_orders',
      label: 'Complete 1 town order',
      target: 1,
      progress: 0,
      claimed: false,
      rewardCoins: 50,
      rewardGems: 1,
    },
  ];
}
