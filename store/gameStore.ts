import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  BUILDINGS,
  CROPS,
  MINE_COOLDOWN_MS,
  MINE_ENERGY_PER_DIG,
  createAchievements,
} from '@/constants/catalog';
import { todayKey } from '@/lib/date';
import {
  addXp,
  applyWalkStreak,
  coinsFromStepDelta,
  streakMultiplier,
  upsertLedger,
} from '@/lib/economy';
import { createDailyGoals } from '@/lib/goals';
import { createInitialPlots } from '@/lib/grid';
import { generateOrder, generateOrders } from '@/lib/orders';
import {
  happinessMultiplier,
  inventoryUsed,
  mineEnergyAvailable,
  warehouseCapacity,
} from '@/lib/townStats';
import type {
  AchievementId,
  BuildingId,
  CloudSavePayload,
  CropId,
  DailyGoal,
  GameState,
  ItemId,
  Player,
  Plot,
  TownOrder,
  VisitorEvent,
} from '@/lib/types';

type PlaceMode = GameState['placeMode'];

interface GameActions {
  hydrateDone: () => void;
  ensureToday: () => void;
  completeOnboarding: (townName: string) => void;
  syncSteps: (todaySteps: number) => number;
  simulateWalk: (steps: number) => number;
  setPlaceMode: (mode: PlaceMode, item?: BuildingId | CropId | null) => void;
  unlockPlot: (plotId: string) => { ok: boolean; message?: string };
  placeBuilding: (
    plotId: string,
    buildingId: BuildingId
  ) => { ok: boolean; message?: string };
  plantCrop: (plotId: string, cropId: CropId) => { ok: boolean; message?: string };
  harvestPlot: (plotId: string) => { ok: boolean; message?: string; gained?: number };
  startFactory: (plotId: string) => { ok: boolean; message?: string };
  collectFactory: (plotId: string) => { ok: boolean; message?: string };
  /** @deprecated use startFactory */
  startBakery: (plotId: string) => { ok: boolean; message?: string };
  /** @deprecated use collectFactory */
  collectBakery: (plotId: string) => { ok: boolean; message?: string };
  fulfillOrder: (orderId: string) => { ok: boolean; message?: string };
  refreshExpiredOrders: () => void;
  claimDailyGoal: (goalId: string) => { ok: boolean; message?: string };
  digMine: () => { ok: boolean; message?: string; reward?: string };
  claimAchievement: (id: AchievementId) => { ok: boolean; message?: string };
  maybeSpawnVisitor: () => void;
  acceptVisitorOrder: () => { ok: boolean; message?: string };
  dismissVisitor: () => void;
  applyCloudSave: (payload: CloudSavePayload) => void;
  exportCloudSave: () => CloudSavePayload;
  markClean: () => void;
  clearCoinToast: () => void;
  getPlot: (plotId: string) => Plot | undefined;
}

export type GameStore = GameState & GameActions;

const emptyInventory = (): Record<ItemId, number> => ({
  wheat: 0,
  corn: 0,
  carrot: 0,
  bread: 0,
  feed: 0,
  egg: 0,
  milk: 0,
  ore: 0,
});

function createPlayer(): Player {
  return {
    townName: '',
    level: 1,
    xp: 0,
    coins: 50,
    gems: 0,
    streak: 0,
    lastWalkGoalDate: null,
    onboarded: false,
    lastStepSyncAt: null,
    lastKnownSteps: 0,
    todaySteps: 0,
    todayDate: todayKey(),
    mineEnergySpent: 0,
    lastMineAt: null,
  };
}

function bumpGoal(
  goals: DailyGoal[],
  type: DailyGoal['type'],
  amount: number
): DailyGoal[] {
  return goals.map((g) =>
    g.type === type && !g.claimed
      ? { ...g, progress: Math.min(g.target, g.progress + amount) }
      : g
  );
}

function setGoalProgress(
  goals: DailyGoal[],
  type: DailyGoal['type'],
  progress: number
): DailyGoal[] {
  return goals.map((g) =>
    g.type === type && !g.claimed
      ? { ...g, progress: Math.min(g.target, progress) }
      : g
  );
}

function unlockAchievement(
  achievements: GameState['achievements'],
  id: AchievementId
) {
  return achievements.map((a) =>
    a.id === id && !a.unlocked
      ? { ...a, unlocked: true, unlockedAt: Date.now() }
      : a
  );
}

function canFit(
  inventory: Record<ItemId, number>,
  plots: Plot[],
  addQty: number
): boolean {
  return inventoryUsed(inventory) + addQty <= warehouseCapacity(plots);
}

function ensureDayRollover(state: GameState): Partial<GameState> {
  const date = todayKey();
  if (state.player.todayDate === date) return {};
  return {
    player: {
      ...state.player,
      todayDate: date,
      todaySteps: 0,
      lastKnownSteps: 0,
      mineEnergySpent: 0,
    },
    dailyGoals: createDailyGoals(),
  };
}

function touch(partial: Partial<GameState>): Partial<GameState> {
  return { ...partial, dirtyAt: Date.now() };
}

function normalizeInventory(
  inv: Partial<Record<ItemId, number>> | undefined
): Record<ItemId, number> {
  const base = emptyInventory();
  if (!inv) return base;
  for (const key of Object.keys(base) as ItemId[]) {
    base[key] = inv[key] ?? 0;
  }
  return base;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      player: createPlayer(),
      plots: createInitialPlots(),
      inventory: emptyInventory(),
      orders: generateOrders(1),
      dailyGoals: createDailyGoals(),
      ledger: [],
      achievements: createAchievements(),
      visitor: null,
      selectedShopItem: null,
      placeMode: 'none',
      lastCoinToast: 0,
      hydrated: false,
      dirtyAt: 0,

      hydrateDone: () => set({ hydrated: true }),

      ensureToday: () => {
        const rolled = ensureDayRollover(get());
        if (Object.keys(rolled).length) set(touch(rolled));
      },

      completeOnboarding: (townName) => {
        const plots = createInitialPlots().map((p) => {
          if (p.x === 2 && p.y === 2) {
            return {
              ...p,
              unlocked: true,
              kind: 'building' as const,
              buildingId: 'house' as BuildingId,
            };
          }
          return p;
        });

        set(
          touch({
            player: {
              ...createPlayer(),
              townName: townName.trim() || 'Stepford',
              onboarded: true,
              coins: 80,
            },
            plots,
            inventory: emptyInventory(),
            orders: generateOrders(1),
            dailyGoals: createDailyGoals(),
            ledger: [],
            achievements: createAchievements(),
            visitor: null,
            placeMode: 'none',
            selectedShopItem: null,
            lastCoinToast: 0,
          })
        );
      },

      syncSteps: (todaySteps) => {
        const rolled = ensureDayRollover(get());
        if (Object.keys(rolled).length) set(rolled);

        const state = get();
        const date = todayKey();
        const prevLedger = state.ledger.find((l) => l.date === date);
        const accountedSteps = prevLedger?.rawSteps ?? 0;
        // Never allow a sensor glitch to reduce today's total mid-day
        const safeTotal = Math.max(
          todaySteps,
          state.player.todayDate === date ? state.player.todaySteps : 0,
          accountedSteps
        );
        const mult = streakMultiplier(state.player.streak);
        const { coins, cappedFlag } = coinsFromStepDelta(
          accountedSteps,
          safeTotal,
          mult
        );

        let player: Player = {
          ...state.player,
          todaySteps: safeTotal,
          todayDate: date,
          lastStepSyncAt: Date.now(),
          lastKnownSteps: safeTotal,
          coins: state.player.coins + coins,
        };
        player = applyWalkStreak(player, safeTotal, date);

        let achievements = state.achievements;
        if (player.streak >= 3) {
          achievements = unlockAchievement(achievements, 'streak_3');
        }

        set(
          touch({
            player,
            ledger: upsertLedger(state.ledger, {
              date,
              rawSteps: safeTotal,
              convertedCoins: (prevLedger?.convertedCoins ?? 0) + coins,
              cappedFlag,
            }),
            dailyGoals: setGoalProgress(
              state.dailyGoals,
              'walk_steps',
              safeTotal
            ),
            achievements,
            lastCoinToast: coins > 0 ? coins : state.lastCoinToast,
          })
        );

        return coins;
      },

      simulateWalk: (steps) => {
        const rolled = ensureDayRollover(get());
        if (Object.keys(rolled).length) set(rolled);
        return get().syncSteps(get().player.todaySteps + steps);
      },

      setPlaceMode: (mode, item = null) =>
        set({ placeMode: mode, selectedShopItem: item }),

      unlockPlot: (plotId) => {
        const { player, plots, achievements } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot) return { ok: false, message: 'Plot not found' };
        if (plot.unlocked) return { ok: false, message: 'Already unlocked' };
        if (player.level < plot.unlockLevel) {
          return { ok: false, message: `Reach town level ${plot.unlockLevel}` };
        }
        if (player.coins < plot.unlockCost) {
          return { ok: false, message: 'Not enough Step Coins' };
        }

        set(
          touch({
            player: { ...player, coins: player.coins - plot.unlockCost },
            plots: plots.map((p) =>
              p.id === plotId ? { ...p, unlocked: true } : p
            ),
            achievements: unlockAchievement(achievements, 'expand_land'),
            placeMode: 'none',
            selectedShopItem: null,
          })
        );
        return { ok: true };
      },

      placeBuilding: (plotId, buildingId) => {
        const { player, plots } = get();
        const def = BUILDINGS[buildingId];
        const plot = plots.find((p) => p.id === plotId);
        if (!def || !plot) return { ok: false, message: 'Invalid placement' };
        if (!plot.unlocked) return { ok: false, message: 'Unlock this land first' };
        if (plot.kind !== 'empty') return { ok: false, message: 'Plot is occupied' };
        if (player.level < def.unlockLevel) {
          return { ok: false, message: `Unlocks at level ${def.unlockLevel}` };
        }
        if (player.coins < def.cost) {
          return { ok: false, message: 'Not enough Step Coins' };
        }
        if (def.unique && plots.some((p) => p.buildingId === buildingId)) {
          return { ok: false, message: `You already have a ${def.name}` };
        }

        const gainedXp = buildingId === 'house' ? 0 : 12;
        set(
          touch({
            player: addXp(
              { ...player, coins: player.coins - def.cost },
              gainedXp
            ),
            plots: plots.map((p) =>
              p.id === plotId
                ? {
                    ...p,
                    kind: 'building',
                    buildingId,
                    cropId: undefined,
                    plantedAt: undefined,
                    readyAt: undefined,
                  }
                : p
            ),
            placeMode: 'none',
            selectedShopItem: null,
          })
        );
        return { ok: true };
      },

      plantCrop: (plotId, cropId) => {
        const { player, plots } = get();
        const def = CROPS[cropId];
        const plot = plots.find((p) => p.id === plotId);
        if (!def || !plot) return { ok: false, message: 'Invalid crop' };
        if (!plot.unlocked || plot.kind !== 'empty') {
          return { ok: false, message: 'Need an empty unlocked plot' };
        }
        if (player.level < def.unlockLevel) {
          return { ok: false, message: `Unlocks at level ${def.unlockLevel}` };
        }
        if (player.coins < def.seedCost) {
          return { ok: false, message: 'Not enough Step Coins' };
        }

        const now = Date.now();
        set(
          touch({
            player: { ...player, coins: player.coins - def.seedCost },
            plots: plots.map((p) =>
              p.id === plotId
                ? {
                    ...p,
                    kind: 'crop',
                    cropId,
                    plantedAt: now,
                    readyAt: now + def.growMs,
                    buildingId: undefined,
                  }
                : p
            ),
            placeMode: 'none',
            selectedShopItem: null,
          })
        );
        return { ok: true };
      },

      harvestPlot: (plotId) => {
        const { plots, inventory, dailyGoals, achievements } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot || plot.kind !== 'crop' || !plot.cropId || !plot.readyAt) {
          return { ok: false, message: 'Nothing to harvest' };
        }
        if (Date.now() < plot.readyAt) {
          return { ok: false, message: 'Still growing' };
        }

        const def = CROPS[plot.cropId];
        if (!canFit(inventory, plots, def.yieldQty)) {
          return { ok: false, message: 'Warehouse full — build a barn' };
        }

        set(
          touch({
            inventory: {
              ...inventory,
              [def.yieldItem]: inventory[def.yieldItem] + def.yieldQty,
            },
            plots: plots.map((p) =>
              p.id === plotId
                ? {
                    ...p,
                    kind: 'empty',
                    cropId: undefined,
                    plantedAt: undefined,
                    readyAt: undefined,
                  }
                : p
            ),
            dailyGoals: bumpGoal(dailyGoals, 'harvest_crops', 1),
            achievements: unlockAchievement(achievements, 'first_harvest'),
          })
        );
        return { ok: true, gained: def.yieldQty };
      },

      startFactory: (plotId) => {
        const { plots, inventory } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot?.buildingId) return { ok: false, message: 'Not a factory' };
        const def = BUILDINGS[plot.buildingId];
        const recipe = def?.recipe;
        if (!recipe) return { ok: false, message: 'Nothing to process here' };
        if (plot.processing) return { ok: false, message: 'Already working' };
        if (inventory[recipe.input] < recipe.inputQty) {
          return {
            ok: false,
            message: `Need ${recipe.inputQty} ${recipe.input}`,
          };
        }

        set(
          touch({
            inventory: {
              ...inventory,
              [recipe.input]: inventory[recipe.input] - recipe.inputQty,
            },
            plots: plots.map((p) =>
              p.id === plotId
                ? {
                    ...p,
                    processing: true,
                    processReadyAt: Date.now() + recipe.processMs,
                  }
                : p
            ),
          })
        );
        return { ok: true };
      },

      collectFactory: (plotId) => {
        const { plots, inventory, achievements } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot?.buildingId || !plot.processing) {
          return { ok: false, message: 'Nothing to collect' };
        }
        const def = BUILDINGS[plot.buildingId];
        const recipe = def?.recipe;
        if (!recipe || !plot.processReadyAt || Date.now() < plot.processReadyAt) {
          return { ok: false, message: 'Still processing' };
        }
        if (!canFit(inventory, plots, recipe.outputQty)) {
          return { ok: false, message: 'Warehouse full — build a barn' };
        }

        let nextAchievements = achievements;
        if (recipe.output === 'bread') {
          nextAchievements = unlockAchievement(nextAchievements, 'bake_bread');
        }
        if (recipe.output === 'egg') {
          nextAchievements = unlockAchievement(nextAchievements, 'coop_eggs');
        }

        set(
          touch({
            inventory: {
              ...inventory,
              [recipe.output]: inventory[recipe.output] + recipe.outputQty,
            },
            plots: plots.map((p) =>
              p.id === plotId
                ? { ...p, processing: false, processReadyAt: undefined }
                : p
            ),
            achievements: nextAchievements,
          })
        );
        return { ok: true };
      },

      startBakery: (plotId) => get().startFactory(plotId),
      collectBakery: (plotId) => get().collectFactory(plotId),

      fulfillOrder: (orderId) => {
        const { orders, inventory, player, dailyGoals, achievements, plots } =
          get();
        const order = orders.find((o) => o.id === orderId);
        if (!order) return { ok: false, message: 'Order gone' };
        if (Date.now() > order.expiresAt) {
          get().refreshExpiredOrders();
          return { ok: false, message: 'Order expired' };
        }

        for (const req of order.requirements) {
          if (inventory[req.itemId] < req.qty) {
            return { ok: false, message: 'Missing goods' };
          }
        }

        const nextInv = { ...inventory };
        for (const req of order.requirements) {
          nextInv[req.itemId] -= req.qty;
        }

        const happy = happinessMultiplier(
          plots.reduce((n, p) => {
            if (p.kind === 'building' && p.buildingId) {
              return n + (BUILDINGS[p.buildingId]?.happiness ?? 0);
            }
            return n;
          }, 0)
        );
        const coins = Math.round(order.rewardCoins * happy);

        const nextOrders: TownOrder[] = orders.map((o) =>
          o.id === orderId ? generateOrder(o.slot, player.level) : o
        );

        const visitor = get().visitor;
        const clearVisitor =
          visitor?.orderId === orderId
            ? ({ ...visitor, active: false } as VisitorEvent)
            : visitor;

        set(
          touch({
            inventory: nextInv,
            orders: nextOrders,
            player: addXp({ ...player, coins: player.coins + coins }, order.rewardXp),
            dailyGoals: bumpGoal(dailyGoals, 'complete_orders', 1),
            achievements: unlockAchievement(achievements, 'first_order'),
            visitor: clearVisitor,
            lastCoinToast: coins,
          })
        );
        return { ok: true };
      },

      refreshExpiredOrders: () => {
        const { orders, player } = get();
        const now = Date.now();
        set(
          touch({
            orders: orders.map((o) =>
              now > o.expiresAt ? generateOrder(o.slot, player.level) : o
            ),
          })
        );
      },

      claimDailyGoal: (goalId) => {
        const { dailyGoals, player } = get();
        const goal = dailyGoals.find((g) => g.id === goalId);
        if (!goal) return { ok: false, message: 'Goal not found' };
        if (goal.claimed) return { ok: false, message: 'Already claimed' };
        if (goal.progress < goal.target) {
          return { ok: false, message: 'Not finished yet' };
        }

        set(
          touch({
            dailyGoals: dailyGoals.map((g) =>
              g.id === goalId ? { ...g, claimed: true } : g
            ),
            player: {
              ...player,
              coins: player.coins + goal.rewardCoins,
              gems: player.gems + goal.rewardGems,
            },
            lastCoinToast: goal.rewardCoins,
          })
        );
        return { ok: true };
      },

      digMine: () => {
        const { player, inventory, plots, achievements } = get();
        const energy = mineEnergyAvailable(
          player.todaySteps,
          player.mineEnergySpent
        );
        if (energy < MINE_ENERGY_PER_DIG) {
          return {
            ok: false,
            message: `Need ${MINE_ENERGY_PER_DIG} walk energy (have ${energy})`,
          };
        }
        if (player.lastMineAt && Date.now() - player.lastMineAt < MINE_COOLDOWN_MS) {
          return { ok: false, message: 'Miners need a short rest' };
        }
        if (!canFit(inventory, plots, 1)) {
          return { ok: false, message: 'Warehouse full' };
        }

        const roll = Math.random();
        let reward = 'ore';
        let nextInv = { ...inventory, ore: inventory.ore + 1 };
        let gems = player.gems;
        let coins = player.coins;
        if (roll > 0.85) {
          gems += 1;
          reward = 'gem';
        } else if (roll > 0.55) {
          coins += 25;
          reward = 'coins';
        }

        set(
          touch({
            player: {
              ...player,
              mineEnergySpent: player.mineEnergySpent + MINE_ENERGY_PER_DIG,
              lastMineAt: Date.now(),
              gems,
              coins,
            },
            inventory: nextInv,
            achievements: unlockAchievement(achievements, 'first_mine'),
            lastCoinToast: reward === 'coins' ? 25 : 0,
          })
        );
        return { ok: true, reward };
      },

      claimAchievement: (id) => {
        const { achievements, player } = get();
        const a = achievements.find((x) => x.id === id);
        if (!a) return { ok: false, message: 'Missing achievement' };
        if (!a.unlocked) return { ok: false, message: 'Not unlocked yet' };
        if (a.claimed) return { ok: false, message: 'Already claimed' };

        set(
          touch({
            achievements: achievements.map((x) =>
              x.id === id ? { ...x, claimed: true } : x
            ),
            player: { ...player, coins: player.coins + a.rewardCoins },
            lastCoinToast: a.rewardCoins,
          })
        );
        return { ok: true };
      },

      maybeSpawnVisitor: () => {
        const { visitor, player, orders } = get();
        if (visitor?.active && visitor.expiresAt > Date.now()) return;
        if (Math.random() > 0.35) return;
        const bonus = generateOrder(99, player.level, true);
        const event: VisitorEvent = {
          id: `vis-${Date.now()}`,
          name: bonus.customer,
          message: `${bonus.customer} is visiting with a premium order!`,
          orderId: bonus.id,
          expiresAt: Date.now() + 20 * 60 * 1000,
          active: true,
        };
        set(
          touch({
            visitor: event,
            orders: [...orders.filter((o) => !o.bonus), bonus],
          })
        );
      },

      acceptVisitorOrder: () => {
        const { visitor } = get();
        if (!visitor?.active) return { ok: false, message: 'No visitor' };
        return { ok: true };
      },

      dismissVisitor: () => {
        const { visitor, orders } = get();
        if (!visitor) return;
        set(
          touch({
            visitor: { ...visitor, active: false },
            orders: orders.filter((o) => o.id !== visitor.orderId),
          })
        );
      },

      applyCloudSave: (payload) => {
        set({
          player: {
            ...createPlayer(),
            ...payload.player,
            mineEnergySpent: payload.player.mineEnergySpent ?? 0,
            lastMineAt: payload.player.lastMineAt ?? null,
          },
          plots: payload.plots?.length ? payload.plots : createInitialPlots(),
          inventory: normalizeInventory(payload.inventory),
          orders: payload.orders?.length
            ? payload.orders
            : generateOrders(payload.player.level || 1),
          dailyGoals: payload.dailyGoals?.length
            ? payload.dailyGoals
            : createDailyGoals(),
          ledger: payload.ledger ?? [],
          achievements: payload.achievements?.length
            ? payload.achievements
            : createAchievements(),
          visitor: payload.visitor ?? null,
          dirtyAt: 0,
        });
      },

      exportCloudSave: () => {
        const s = get();
        return {
          player: s.player,
          plots: s.plots,
          inventory: s.inventory,
          orders: s.orders,
          dailyGoals: s.dailyGoals,
          ledger: s.ledger,
          achievements: s.achievements,
          visitor: s.visitor,
          savedAt: Date.now(),
        };
      },

      markClean: () => set({ dirtyAt: 0 }),

      clearCoinToast: () => set({ lastCoinToast: 0 }),

      getPlot: (plotId) => get().plots.find((p) => p.id === plotId),
    }),
    {
      name: 'stepwize-game-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        player: state.player,
        plots: state.plots,
        inventory: state.inventory,
        orders: state.orders,
        dailyGoals: state.dailyGoals,
        ledger: state.ledger,
        achievements: state.achievements,
        visitor: state.visitor,
        dirtyAt: state.dirtyAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.inventory = normalizeInventory(state.inventory);
        if (!state.achievements?.length) {
          state.achievements = createAchievements();
        }
        state.hydrateDone();
      },
    }
  )
);
