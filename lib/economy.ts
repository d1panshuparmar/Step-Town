import {
  FULL_RATE_STEP_CAP,
  STEPS_PER_COIN,
  WALK_GOAL_STEPS,
  xpForLevel,
} from '@/constants/catalog';
import { todayKey, yesterdayKey } from '@/lib/date';
import type { Player, StepLedgerDay } from '@/lib/types';

function coinsInRange(
  fromStep: number,
  toStep: number,
  streakMultiplier: number
): number {
  if (toStep <= fromStep) return 0;

  const fullEnd = Math.min(toStep, FULL_RATE_STEP_CAP);
  const fullStart = Math.min(fromStep, FULL_RATE_STEP_CAP);
  const fullSteps = Math.max(0, fullEnd - fullStart);

  const taperStart = Math.max(fromStep, FULL_RATE_STEP_CAP);
  const taperSteps = Math.max(0, toStep - taperStart);

  const raw =
    (fullSteps * 1 + taperSteps * 0.5) / STEPS_PER_COIN * streakMultiplier;
  return raw;
}

/** Convert newly observed steps into coins with a soft daily taper. */
export function coinsFromStepDelta(
  previousStepsAccounted: number,
  newTotalStepsToday: number,
  streakMult: number
): { coins: number; cappedFlag: boolean } {
  const raw = coinsInRange(
    previousStepsAccounted,
    newTotalStepsToday,
    streakMult
  );
  return {
    coins: Math.floor(raw),
    cappedFlag: newTotalStepsToday >= FULL_RATE_STEP_CAP,
  };
}

export function streakMultiplier(streak: number): number {
  if (streak <= 1) return 1;
  return Math.min(1.25, 1 + (streak - 1) * 0.05);
}

export function applyWalkStreak(
  player: Player,
  todaySteps: number,
  date = todayKey()
): Player {
  if (todaySteps < WALK_GOAL_STEPS) return player;
  if (player.lastWalkGoalDate === date) return player;

  const yesterday = yesterdayKey();
  const nextStreak =
    player.lastWalkGoalDate === yesterday ? player.streak + 1 : 1;

  return {
    ...player,
    streak: nextStreak,
    lastWalkGoalDate: date,
  };
}

export function addXp(player: Player, amount: number): Player {
  let { level, xp } = player;
  xp += amount;
  let need = xpForLevel(level);
  while (xp >= need) {
    xp -= need;
    level += 1;
    need = xpForLevel(level);
  }
  return { ...player, level, xp };
}

export function upsertLedger(
  ledger: StepLedgerDay[],
  day: StepLedgerDay
): StepLedgerDay[] {
  const idx = ledger.findIndex((l) => l.date === day.date);
  if (idx === -1) return [day, ...ledger].slice(0, 30);
  const next = [...ledger];
  next[idx] = day;
  return next;
}
