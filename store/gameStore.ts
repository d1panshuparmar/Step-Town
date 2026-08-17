import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  BUILDINGS,
  CROPS,
  ITEM_META,
  MINE_COOLDOWN_MS,
  MINE_ENERGY_PER_DIG,
  barnUpgradeCost,
  createAchievements,
  factoryRecipes,
} from '@/constants/catalog';
import {
  canClaimDaily,
  nextDailyStreak,
  rewardForStreak,
  type DailyRewardGrant,
} from '@/lib/dailyRewards';
import { todayKey } from '@/lib/date';
import {
  addXp,
  applyWalkStreak,
  coinsFromStepDelta,
  streakMultiplier,
  upsertLedger,
} from '@/lib/economy';
import { createDailyGoals } from '@/lib/goals';
import { applyStarterTown, createInitialPlots } from '@/lib/grid';
import { buyPrice, sellPrice } from '@/lib/marketplace';
import { computeOfflineGains } from '@/lib/offline';
import { generateOrder, generateOrders } from '@/lib/orders';
import {
  bumpQuest,
  createQuestProgress,
  questDef,
  setQuestProgress,
  type QuestProgress,
} from '@/lib/quests';
import { DEFAULT_SETTINGS, type GameSettings } from '@/lib/settings';
import { activeTownEvent, eventStillActive } from '@/lib/events';
import type { ClubState } from '@/lib/clubs';
import {
  ACADEMY_INGOT_COST,
  GEM_SPEEDUP_COST,
  TRAIN_TRAVEL_MS,
  ZOO_ANIMALS,
  barnMaterialCost,
  emptyMaterials,
  factoryTimeMult,
  generateAirport,
  generateTrainCar,
  generateTrains,
  type MaterialId,
} from '@/lib/townshipExtras';
import {
  happinessMultiplier,
  inventoryUsed,
  mineEnergyAvailable,
  townHappiness,
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
  startFactory: (
    plotId: string,
    recipeId?: string
  ) => { ok: boolean; message?: string };
  collectFactory: (plotId: string) => { ok: boolean; message?: string };
  sellFromBarn: (
    itemId: ItemId,
    qty: number
  ) => { ok: boolean; message?: string; coins?: number };
  upgradeBarn: () => { ok: boolean; message?: string };
  sellBuilding: (plotId: string) => { ok: boolean; message?: string };
  beginMoveBuilding: (plotId: string) => { ok: boolean; message?: string };
  completeMoveBuilding: (toPlotId: string) => { ok: boolean; message?: string };
  gemSpeedUpCrop: (plotId: string) => { ok: boolean; message?: string };
  gemSpeedUpFactory: (plotId: string) => { ok: boolean; message?: string };
  loadTrainCar: (slot: number) => { ok: boolean; message?: string };
  collectTrainCar: (slot: number) => { ok: boolean; message?: string };
  refreshTrains: () => void;
  fillAirportCrate: (crateId: string) => { ok: boolean; message?: string };
  refreshAirport: () => void;
  buyZooAnimal: (animalId: string) => { ok: boolean; message?: string };
  upgradeAcademy: (buildingId: BuildingId) => { ok: boolean; message?: string };
  /** @deprecated use startFactory */
  startBakery: (plotId: string) => { ok: boolean; message?: string };
  /** @deprecated use collectFactory */
  collectBakery: (plotId: string) => { ok: boolean; message?: string };
  fulfillOrder: (orderId: string) => { ok: boolean; message?: string };
  refreshExpiredOrders: () => void;
  claimDailyGoal: (goalId: string) => { ok: boolean; message?: string };
  claimDailyReward: () => {
    ok: boolean;
    message?: string;
    rewards?: DailyRewardGrant;
  };
  castFishingRod: () => { ok: boolean; message?: string; caught?: boolean };
  placeRoad: (plotId: string) => { ok: boolean; message?: string };
  noteReturnFromOffline: () => string[];
  clearOfflineWelcome: () => void;
  digMine: () => { ok: boolean; message?: string; reward?: string };
  claimAchievement: (id: AchievementId) => { ok: boolean; message?: string };
  maybeSpawnVisitor: () => void;
  acceptVisitorOrder: () => { ok: boolean; message?: string };
  dismissVisitor: () => void;
  claimQuest: (questId: string) => { ok: boolean; message?: string };
  buyFromMarket: (
    itemId: ItemId,
    qty: number
  ) => { ok: boolean; message?: string };
  sellToMarket: (
    itemId: ItemId,
    qty: number
  ) => { ok: boolean; message?: string; coins?: number };
  joinClub: (club: ClubState) => { ok: boolean; message?: string };
  leaveClub: () => void;
  donateToClub: (qty: number) => { ok: boolean; message?: string };
  claimClubTask: () => { ok: boolean; message?: string };
  syncEvent: () => void;
  claimEventReward: () => { ok: boolean; message?: string };
  updateSettings: (partial: Partial<GameSettings>) => void;
  awardMiniGame: (coins: number, gems: number) => void;
  markTutorialDone: () => void;
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
  tomato: 0,
  sugarcane: 0,
  potato: 0,
  cotton: 0,
  strawberry: 0,
  rice: 0,
  pumpkin: 0,
  apple: 0,
  bread: 0,
  feed: 0,
  egg: 0,
  milk: 0,
  sugar: 0,
  juice: 0,
  ore: 0,
  cheese: 0,
  butter: 0,
  cream: 0,
  cookies: 0,
  cake: 0,
  jam: 0,
  cloth: 0,
  wool: 0,
  honey: 0,
  fish: 0,
  wood: 0,
  clay: 0,
  iron: 0,
  coal: 0,
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
    barnLevel: 0,
    lastDailyClaimDate: null,
    dailyClaimStreak: 0,
    lastSeenAt: 0,
    fishCaught: 0,
    eventTokens: 0,
    eventProgress: 0,
    eventId: null,
    eventClaimed: false,
  };
}

function emptyStats(): GameState['stats'] {
  return {
    harvests: 0,
    orders: 0,
    produced: 0,
    buildings: 0,
    coinsEarned: 0,
  };
}

function mergeAchievements(
  existing: GameState['achievements'] | undefined
): GameState['achievements'] {
  const base = createAchievements();
  if (!existing?.length) return base;
  return base.map((a) => {
    const prev = existing.find((x) => x.id === a.id);
    return prev ? { ...a, ...prev, id: a.id } : a;
  });
}

function mergeQuests(
  existing: QuestProgress[] | undefined
): QuestProgress[] {
  const base = createQuestProgress();
  if (!existing?.length) return base;
  return base.map((q) => {
    const prev = existing.find((x) => x.id === q.id);
    return prev ? { ...q, ...prev, id: q.id } : q;
  });
}

/** Session guard so offline welcome only fires once per app open */
let offlineNotedThisSession = false;

/** Migrate legacy single-slot factories into Township queues/shelves. */
function normalizePlot(plot: Plot): Plot {
  const queue = [...(plot.factoryQueue ?? [])];
  const shelf = [...(plot.factoryShelf ?? [])];
  if (plot.processing && plot.processReadyAt && plot.buildingId) {
    const def = BUILDINGS[plot.buildingId];
    const recipes = def ? factoryRecipes(def) : [];
    const r = recipes[0];
    if (r) {
      queue.push({
        recipeId: r.id,
        output: r.output,
        outputQty: r.outputQty,
        readyAt: plot.processReadyAt,
      });
    }
  }
  return {
    ...plot,
    factoryQueue: queue,
    factoryShelf: shelf,
    processing: false,
    processReadyAt: undefined,
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
  addQty: number,
  barnLevel = 0
): boolean {
  return (
    inventoryUsed(inventory) + addQty <= warehouseCapacity(plots, barnLevel)
  );
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
      moveFromPlotId: null,
      materials: emptyMaterials(),
      trains: generateTrains(1),
      airport: generateAirport(1),
      zooOwned: [],
      academyLevels: {},
      lastCoinToast: 0,
      hydrated: false,
      dirtyAt: 0,
      offlineWelcome: null,
      quests: createQuestProgress(),
      settings: { ...DEFAULT_SETTINGS },
      club: null,
      tutorialDone: false,
      stats: emptyStats(),

      hydrateDone: () => {
        get().noteReturnFromOffline();
        set({ hydrated: true });
      },

      ensureToday: () => {
        const rolled = ensureDayRollover(get());
        if (Object.keys(rolled).length) set(touch(rolled));
        get().noteReturnFromOffline();
        get().syncEvent();
        const { quests, player } = get();
        set({
          quests: setQuestProgress(quests, 'reach_level', player.level),
        });
      },

      completeOnboarding: (townName) => {
        const plots = applyStarterTown(createInitialPlots());

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
            quests: createQuestProgress(),
            settings: { ...DEFAULT_SETTINGS },
            club: null,
            tutorialDone: false,
            stats: emptyStats(),
            materials: emptyMaterials(),
            trains: generateTrains(1),
            airport: generateAirport(1),
            zooOwned: [],
            academyLevels: {},
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
        set({
          placeMode: mode,
          selectedShopItem: item,
          ...(mode !== 'move' ? { moveFromPlotId: null } : {}),
        }),

      unlockPlot: (plotId) => {
        const { player, plots, achievements, quests } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot) return { ok: false, message: 'Plot not found' };
        if (plot.unlocked) return { ok: false, message: 'Already unlocked' };
        if (player.level < plot.unlockLevel) {
          return { ok: false, message: `Reach town level ${plot.unlockLevel}` };
        }
        if (player.coins < plot.unlockCost) {
          return { ok: false, message: 'Not enough Step Coins' };
        }

        const unlockedCount =
          plots.filter((p) => p.unlocked).length + 1;

        set(
          touch({
            player: { ...player, coins: player.coins - plot.unlockCost },
            plots: plots.map((p) =>
              p.id === plotId ? { ...p, unlocked: true } : p
            ),
            achievements: unlockAchievement(achievements, 'expand_land'),
            quests: setQuestProgress(quests, 'unlock_plots', unlockedCount),
            placeMode: 'none',
            selectedShopItem: null,
          })
        );
        return { ok: true };
      },

      placeBuilding: (plotId, buildingId) => {
        const { player, plots, quests, stats, achievements } = get();
        const def = BUILDINGS[buildingId];
        const plot = plots.find((p) => p.id === plotId);
        if (!def || !plot) return { ok: false, message: 'Invalid placement' };
        if (!plot.unlocked) return { ok: false, message: 'Unlock this land first' };
        if (plot.kind !== 'empty') return { ok: false, message: 'Plot is occupied' };
        if (player.level < def.unlockLevel) {
          return { ok: false, message: `Unlocks at level ${def.unlockLevel}` };
        }
        const pop = plots.reduce((n, p) => {
          if (p.kind === 'building' && p.buildingId) {
            return n + (BUILDINGS[p.buildingId]?.population ?? 0);
          }
          return n;
        }, 0);
        if ((def.minPopulation ?? 0) > pop) {
          return {
            ok: false,
            message: `Need ${def.minPopulation} population (build more homes)`,
          };
        }
        if (player.coins < def.cost) {
          return { ok: false, message: 'Not enough Step Coins' };
        }
        if (def.unique && plots.some((p) => p.buildingId === buildingId)) {
          return { ok: false, message: `You already have a ${def.name}` };
        }

        const nextPlots = plots.map((p) =>
          p.id === plotId
            ? {
                ...p,
                kind: 'building' as const,
                buildingId,
                cropId: undefined,
                plantedAt: undefined,
                readyAt: undefined,
                factoryQueue: [],
                factoryShelf: [],
                processing: false,
                processReadyAt: undefined,
              }
            : p
        );
        const buildingCount =
          nextPlots.filter((p) => p.kind === 'building' && p.buildingId).length;
        const sameCount = nextPlots.filter(
          (p) => p.buildingId === buildingId
        ).length;
        let nextQuests = bumpQuest(quests, 'build', 1, buildingId);
        nextQuests = setQuestProgress(
          nextQuests,
          'build',
          sameCount,
          buildingId
        );
        let nextAchievements = achievements;
        if (buildingCount >= 10) {
          nextAchievements = unlockAchievement(nextAchievements, 'builder_10');
        }

        const gainedXp =
          buildingId === 'house' || buildingId === 'apartment' ? 0 : 12;
        set(
          touch({
            player: addXp(
              { ...player, coins: player.coins - def.cost },
              gainedXp
            ),
            plots: nextPlots,
            quests: nextQuests,
            achievements: nextAchievements,
            stats: { ...stats, buildings: buildingCount },
            placeMode: 'none',
            selectedShopItem: null,
          })
        );
        return { ok: true };
      },

      plantCrop: (plotId, cropId) => {
        const { player, plots, quests } = get();
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
            quests: bumpQuest(quests, 'plant_crop', 1, cropId),
            placeMode: 'none',
            selectedShopItem: null,
          })
        );
        return { ok: true };
      },

      harvestPlot: (plotId) => {
        const {
          plots,
          inventory,
          dailyGoals,
          achievements,
          player,
          quests,
          stats,
        } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot || plot.kind !== 'crop' || !plot.cropId || !plot.readyAt) {
          return { ok: false, message: 'Nothing to harvest' };
        }
        if (Date.now() < plot.readyAt) {
          return { ok: false, message: 'Still growing' };
        }

        const def = CROPS[plot.cropId];
        if (!canFit(inventory, plots, def.yieldQty, player.barnLevel ?? 0)) {
          return { ok: false, message: 'Barn is full! Sell goods or upgrade.' };
        }

        const harvests = stats.harvests + 1;
        let nextAchievements = unlockAchievement(achievements, 'first_harvest');
        if (harvests >= 100) {
          nextAchievements = unlockAchievement(nextAchievements, 'farmer_100');
        }

        const ev = activeTownEvent();
        let nextPlayer = { ...player };
        if (
          ev.id === 'harvest_festival' &&
          eventStillActive(ev) &&
          player.eventId === ev.id
        ) {
          nextPlayer = {
            ...nextPlayer,
            eventProgress: nextPlayer.eventProgress + 1,
          };
        }

        set(
          touch({
            player: nextPlayer,
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
            achievements: nextAchievements,
            quests: bumpQuest(quests, 'harvest_crops', 1),
            stats: { ...stats, harvests },
          })
        );
        return { ok: true, gained: def.yieldQty };
      },

      startFactory: (plotId, recipeId) => {
        const { plots, inventory, academyLevels } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot?.buildingId) return { ok: false, message: 'Not a factory' };
        const def = BUILDINGS[plot.buildingId];
        if (!def || def.kind !== 'factory') {
          return { ok: false, message: 'Nothing to process here' };
        }
        const recipes = factoryRecipes(def);
        const recipe =
          recipes.find((r) => r.id === recipeId) ?? recipes[0];
        if (!recipe) return { ok: false, message: 'No recipe' };

        const queue = [...(plot.factoryQueue ?? [])];
        const shelf = [...(plot.factoryShelf ?? [])];
        const now = Date.now();
        const stillWorking: typeof queue = [];
        for (const job of queue) {
          if (job.readyAt <= now && shelf.length < (def.shelfSlots ?? 2)) {
            shelf.push({ itemId: job.output, qty: job.outputQty });
          } else {
            stillWorking.push(job);
          }
        }
        const slots = def.queueSlots ?? 2;
        if (stillWorking.length >= slots) {
          return { ok: false, message: 'Factory queue is full' };
        }
        if (inventory[recipe.input] < recipe.inputQty) {
          return {
            ok: false,
            message: `Need ${recipe.inputQty} ${recipe.input}`,
          };
        }
        if (
          recipe.input2 &&
          recipe.input2Qty &&
          (inventory[recipe.input2] ?? 0) < recipe.input2Qty
        ) {
          return {
            ok: false,
            message: `Need ${recipe.input2Qty} ${recipe.input2}`,
          };
        }

        const acad = academyLevels[plot.buildingId] ?? 0;
        const processMs = Math.round(
          recipe.processMs * factoryTimeMult(acad)
        );

        stillWorking.push({
          recipeId: recipe.id,
          output: recipe.output,
          outputQty: recipe.outputQty,
          readyAt: now + processMs,
        });

        const nextInv = {
          ...inventory,
          [recipe.input]: inventory[recipe.input] - recipe.inputQty,
        };
        if (recipe.input2 && recipe.input2Qty) {
          nextInv[recipe.input2] =
            (nextInv[recipe.input2] ?? 0) - recipe.input2Qty;
        }

        set(
          touch({
            inventory: nextInv,
            plots: plots.map((p) =>
              p.id === plotId
                ? { ...p, factoryQueue: stillWorking, factoryShelf: shelf }
                : p
            ),
          })
        );
        return { ok: true };
      },

      collectFactory: (plotId) => {
        const { plots, inventory, achievements, player, quests, stats } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot?.buildingId) {
          return { ok: false, message: 'Nothing to collect' };
        }
        const def = BUILDINGS[plot.buildingId];
        if (!def) return { ok: false, message: 'Nothing to collect' };

        const now = Date.now();
        let queue = [...(plot.factoryQueue ?? [])];
        let shelf = [...(plot.factoryShelf ?? [])];

        // Move finished queue jobs onto shelf
        const remaining: typeof queue = [];
        for (const job of queue) {
          if (job.readyAt <= now && shelf.length < (def.shelfSlots ?? 2)) {
            shelf.push({ itemId: job.output, qty: job.outputQty });
          } else {
            remaining.push(job);
          }
        }
        queue = remaining;

        if (!shelf.length) {
          return { ok: false, message: 'Nothing ready yet' };
        }

        const totalQty = shelf.reduce((s, i) => s + i.qty, 0);
        if (!canFit(inventory, plots, totalQty, player.barnLevel ?? 0)) {
          return { ok: false, message: 'Barn is full! Sell goods or upgrade.' };
        }

        const nextInv = { ...inventory };
        let nextAchievements = achievements;
        let nextQuests = quests;
        let produced = stats.produced;
        for (const item of shelf) {
          nextInv[item.itemId] = (nextInv[item.itemId] ?? 0) + item.qty;
          produced += item.qty;
          nextQuests = bumpQuest(nextQuests, 'produce', item.qty, item.itemId);
          if (item.itemId === 'bread') {
            nextAchievements = unlockAchievement(nextAchievements, 'bake_bread');
          }
          if (item.itemId === 'egg') {
            nextAchievements = unlockAchievement(nextAchievements, 'coop_eggs');
          }
        }
        if (produced >= 100) {
          nextAchievements = unlockAchievement(
            nextAchievements,
            'industrialist'
          );
        }

        set(
          touch({
            inventory: nextInv,
            achievements: nextAchievements,
            quests: nextQuests,
            stats: { ...stats, produced },
            player: addXp(player, Math.min(20, totalQty * 2)),
            plots: plots.map((p) =>
              p.id === plotId
                ? { ...p, factoryQueue: queue, factoryShelf: [] }
                : p
            ),
          })
        );
        return { ok: true };
      },

      sellFromBarn: (itemId, qty) => {
        const { inventory, player } = get();
        const have = inventory[itemId] ?? 0;
        if (qty <= 0 || have < qty) {
          return { ok: false, message: 'Not enough in barn' };
        }
        const price = Math.max(1, (ITEM_META[itemId]?.sellPrice ?? 2) * qty);
        set(
          touch({
            inventory: { ...inventory, [itemId]: have - qty },
            player: {
              ...player,
              coins: player.coins + price,
            },
            lastCoinToast: price,
          })
        );
        return { ok: true, coins: price };
      },

      upgradeBarn: () => {
        const { player, materials } = get();
        const level = player.barnLevel ?? 0;
        const cost = barnUpgradeCost(level);
        const need = barnMaterialCost(level);
        if (player.coins < cost) {
          return { ok: false, message: `Need ${cost} coins` };
        }
        for (const [mat, qty] of Object.entries(need)) {
          if ((materials[mat] ?? 0) < (qty ?? 0)) {
            return {
              ok: false,
              message: `Need materials from trains (missing ${mat})`,
            };
          }
        }
        const nextMats = { ...materials };
        for (const [mat, qty] of Object.entries(need)) {
          nextMats[mat] = (nextMats[mat] ?? 0) - (qty ?? 0);
        }
        set(
          touch({
            player: {
              ...player,
              coins: player.coins - cost,
              barnLevel: level + 1,
            },
            materials: nextMats,
          })
        );
        return { ok: true };
      },

      sellBuilding: (plotId) => {
        const { plots, player } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot?.buildingId || plot.kind !== 'building') {
          return { ok: false, message: 'No building here' };
        }
        const def = BUILDINGS[plot.buildingId];
        const refund = Math.floor((def?.cost ?? 0) * 0.4);
        set(
          touch({
            player: { ...player, coins: player.coins + refund },
            plots: plots.map((p) =>
              p.id === plotId
                ? {
                    ...p,
                    kind: 'empty' as const,
                    buildingId: undefined,
                    factoryQueue: [],
                    factoryShelf: [],
                  }
                : p
            ),
            placeMode: 'none',
            lastCoinToast: refund,
          })
        );
        return { ok: true };
      },

      beginMoveBuilding: (plotId) => {
        const { plots } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot?.buildingId || plot.kind !== 'building') {
          return { ok: false, message: 'No building to move' };
        }
        set({ placeMode: 'move', moveFromPlotId: plotId, selectedShopItem: null });
        return { ok: true };
      },

      completeMoveBuilding: (toPlotId) => {
        const { plots, moveFromPlotId } = get();
        if (!moveFromPlotId) return { ok: false, message: 'Pick a building first' };
        const from = plots.find((p) => p.id === moveFromPlotId);
        const to = plots.find((p) => p.id === toPlotId);
        if (!from?.buildingId || !to) return { ok: false, message: 'Invalid move' };
        if (!to.unlocked || to.kind !== 'empty') {
          return { ok: false, message: 'Need an empty unlocked plot' };
        }
        set(
          touch({
            plots: plots.map((p) => {
              if (p.id === from.id) {
                return {
                  ...p,
                  kind: 'empty' as const,
                  buildingId: undefined,
                  factoryQueue: [],
                  factoryShelf: [],
                };
              }
              if (p.id === to.id) {
                return {
                  ...p,
                  kind: 'building' as const,
                  buildingId: from.buildingId,
                  factoryQueue: from.factoryQueue ?? [],
                  factoryShelf: from.factoryShelf ?? [],
                };
              }
              return p;
            }),
            placeMode: 'none',
            moveFromPlotId: null,
          })
        );
        return { ok: true };
      },

      gemSpeedUpCrop: (plotId) => {
        const { plots, player } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot || plot.kind !== 'crop' || !plot.readyAt) {
          return { ok: false, message: 'Nothing to speed up' };
        }
        if (Date.now() >= plot.readyAt) {
          return { ok: false, message: 'Already ready' };
        }
        if (player.gems < GEM_SPEEDUP_COST) {
          return { ok: false, message: `Need ${GEM_SPEEDUP_COST} gem` };
        }
        set(
          touch({
            player: { ...player, gems: player.gems - GEM_SPEEDUP_COST },
            plots: plots.map((p) =>
              p.id === plotId ? { ...p, readyAt: Date.now() } : p
            ),
          })
        );
        return { ok: true };
      },

      gemSpeedUpFactory: (plotId) => {
        const { plots, player } = get();
        const plot = plots.find((p) => p.id === plotId);
        if (!plot?.buildingId) return { ok: false, message: 'Not a factory' };
        const queue = plot.factoryQueue ?? [];
        if (!queue.length) return { ok: false, message: 'Queue empty' };
        if (player.gems < GEM_SPEEDUP_COST) {
          return { ok: false, message: `Need ${GEM_SPEEDUP_COST} gem` };
        }
        const now = Date.now();
        set(
          touch({
            player: { ...player, gems: player.gems - GEM_SPEEDUP_COST },
            plots: plots.map((p) =>
              p.id === plotId
                ? {
                    ...p,
                    factoryQueue: (p.factoryQueue ?? []).map((j) => ({
                      ...j,
                      readyAt: Math.min(j.readyAt, now),
                    })),
                  }
                : p
            ),
          })
        );
        return { ok: true };
      },

      refreshTrains: () => {
        const { trains, player } = get();
        const now = Date.now();
        set(
          touch({
            trains: trains.map((t) => {
              if (
                t.status === 'traveling' &&
                t.returnsAt &&
                now >= t.returnsAt
              ) {
                return { ...t, status: 'ready' as const };
              }
              return t;
            }),
          })
        );
        // refill missing slots
        const cur = get().trains;
        if (cur.length < 3) {
          const slots = new Set(cur.map((t) => t.slot));
          const next = [...cur];
          for (let s = 0; s < 3; s++) {
            if (!slots.has(s)) next.push(generateTrainCar(s, player.level));
          }
          set(touch({ trains: next }));
        }
      },

      loadTrainCar: (slot) => {
        get().refreshTrains();
        const { trains, inventory, player } = get();
        const car = trains.find((t) => t.slot === slot);
        if (!car || car.status !== 'loading') {
          return { ok: false, message: 'Train not ready to load' };
        }
        for (const req of car.requirements) {
          if ((inventory[req.itemId] ?? 0) < req.qty) {
            return { ok: false, message: 'Missing goods for this car' };
          }
        }
        const nextInv = { ...inventory };
        for (const req of car.requirements) {
          nextInv[req.itemId] -= req.qty;
        }
        set(
          touch({
            inventory: nextInv,
            trains: trains.map((t) =>
              t.slot === slot
                ? {
                    ...t,
                    status: 'traveling' as const,
                    returnsAt: Date.now() + TRAIN_TRAVEL_MS,
                  }
                : t
            ),
            player: addXp(player, 4),
          })
        );
        return { ok: true };
      },

      collectTrainCar: (slot) => {
        get().refreshTrains();
        const { trains, materials, player } = get();
        const car = trains.find((t) => t.slot === slot);
        if (!car || car.status !== 'ready') {
          return { ok: false, message: 'Train still traveling' };
        }
        const nextMats = { ...materials };
        for (const [mat, qty] of Object.entries(car.rewards)) {
          nextMats[mat] = (nextMats[mat] ?? 0) + (qty ?? 0);
        }
        set(
          touch({
            materials: nextMats,
            trains: trains.map((t) =>
              t.slot === slot
                ? generateTrainCar(slot, player.level)
                : t
            ),
          })
        );
        return { ok: true };
      },

      refreshAirport: () => {
        const { airport, player } = get();
        if (!airport || Date.now() > airport.expiresAt) {
          set(touch({ airport: generateAirport(player.level) }));
          return;
        }
        if (airport.crates.every((c) => c.filled)) {
          set(touch({ airport: generateAirport(player.level) }));
        }
      },

      fillAirportCrate: (crateId) => {
        get().refreshAirport();
        const { airport, inventory, player } = get();
        if (!airport) return { ok: false, message: 'No plane orders' };
        const crate = airport.crates.find((c) => c.id === crateId);
        if (!crate || crate.filled) {
          return { ok: false, message: 'Crate already filled' };
        }
        if (Date.now() > airport.expiresAt) {
          get().refreshAirport();
          return { ok: false, message: 'Plane left — new board ready' };
        }
        const req = crate.requirement;
        if ((inventory[req.itemId] ?? 0) < req.qty) {
          return { ok: false, message: 'Missing goods' };
        }
        const nextInv = {
          ...inventory,
          [req.itemId]: inventory[req.itemId] - req.qty,
        };
        const crates = airport.crates.map((c) =>
          c.id === crateId ? { ...c, filled: true } : c
        );
        set(
          touch({
            inventory: nextInv,
            airport: { ...airport, crates },
            player: addXp(
              {
                ...player,
                coins: player.coins + crate.rewardCoins,
                gems: player.gems + (crate.rewardGems ?? 0),
              },
              crate.rewardXp
            ),
            lastCoinToast: crate.rewardCoins,
          })
        );
        if (crates.every((c) => c.filled)) {
          setTimeout(() => get().refreshAirport(), 400);
        }
        return { ok: true };
      },

      buyZooAnimal: (animalId) => {
        const { player, zooOwned } = get();
        const def = ZOO_ANIMALS.find((a) => a.id === animalId);
        if (!def) return { ok: false, message: 'Unknown animal' };
        if (zooOwned.includes(animalId)) {
          return { ok: false, message: 'Already in your zoo' };
        }
        if (player.level < def.unlockLevel) {
          return { ok: false, message: `Unlocks at level ${def.unlockLevel}` };
        }
        if (player.coins < def.cost) {
          return { ok: false, message: 'Not enough coins' };
        }
        set(
          touch({
            player: { ...player, coins: player.coins - def.cost },
            zooOwned: [...zooOwned, animalId],
          })
        );
        return { ok: true };
      },

      upgradeAcademy: (buildingId) => {
        const { academyLevels, materials, player } = get();
        const def = BUILDINGS[buildingId];
        if (!def || def.kind !== 'factory') {
          return { ok: false, message: 'Only factories' };
        }
        const level = academyLevels[buildingId] ?? 0;
        if (level >= 10) return { ok: false, message: 'Max academy level' };
        if ((materials.ingot ?? 0) < ACADEMY_INGOT_COST) {
          return {
            ok: false,
            message: `Need ${ACADEMY_INGOT_COST} ingots from trains`,
          };
        }
        set(
          touch({
            materials: {
              ...materials,
              ingot: (materials.ingot ?? 0) - ACADEMY_INGOT_COST,
            },
            academyLevels: {
              ...academyLevels,
              [buildingId]: level + 1,
            },
            player: addXp(player, 5),
          })
        );
        return { ok: true };
      },

      startBakery: (plotId) => get().startFactory(plotId),
      collectBakery: (plotId) => get().collectFactory(plotId),

      fulfillOrder: (orderId) => {
        const {
          orders,
          inventory,
          player,
          dailyGoals,
          achievements,
          plots,
          quests,
          stats,
        } = get();
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
          townHappiness(plots, get().zooOwned ?? [])
        );
        const coins = Math.round(order.rewardCoins * happy);
        const orderCount = stats.orders + 1;

        const nextOrders: TownOrder[] = orders.map((o) =>
          o.id === orderId ? generateOrder(o.slot, player.level) : o
        );

        const visitor = get().visitor;
        const clearVisitor =
          visitor?.orderId === orderId
            ? ({ ...visitor, active: false } as VisitorEvent)
            : visitor;

        const ev = activeTownEvent();
        let nextPlayer = addXp(
          { ...player, coins: player.coins + coins },
          order.rewardXp
        );
        if (
          (ev.id === 'winter_lights' || ev.id === 'harvest_festival') &&
          eventStillActive(ev) &&
          player.eventId === ev.id
        ) {
          nextPlayer = {
            ...nextPlayer,
            eventProgress: nextPlayer.eventProgress + 1,
          };
        }

        let nextAchievements = unlockAchievement(achievements, 'first_order');
        if (stats.coinsEarned + coins >= 10000) {
          nextAchievements = unlockAchievement(
            nextAchievements,
            'entrepreneur'
          );
        }

        set(
          touch({
            inventory: nextInv,
            orders: nextOrders,
            player: nextPlayer,
            dailyGoals: bumpGoal(dailyGoals, 'complete_orders', 1),
            achievements: nextAchievements,
            quests: bumpQuest(quests, 'complete_orders', 1),
            stats: {
              ...stats,
              orders: orderCount,
              coinsEarned: stats.coinsEarned + coins,
            },
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

      claimDailyReward: () => {
        const { player, inventory, plots } = get();
        const today = todayKey();
        if (!canClaimDaily(player.lastDailyClaimDate, today)) {
          return { ok: false, message: 'Already claimed today — come back tomorrow!' };
        }

        const streak = nextDailyStreak(
          player.lastDailyClaimDate,
          player.dailyClaimStreak ?? 0,
          today
        );
        const day = rewardForStreak(streak);
        const reward = day.reward;

        let nextInv = { ...inventory };
        let addQty = 0;
        if (reward.items) {
          for (const [id, qty] of Object.entries(reward.items)) {
            const n = qty ?? 0;
            if (n <= 0) continue;
            addQty += n;
            const itemId = id as ItemId;
            nextInv[itemId] = (nextInv[itemId] ?? 0) + n;
          }
        }
        if (addQty > 0 && !canFit(inventory, plots, addQty, player.barnLevel ?? 0)) {
          return { ok: false, message: 'Barn is full! Sell goods or upgrade first.' };
        }

        set(
          touch({
            player: {
              ...player,
              coins: player.coins + (reward.coins ?? 0),
              gems: player.gems + (reward.gems ?? 0),
              lastDailyClaimDate: today,
              dailyClaimStreak: streak,
            },
            inventory: nextInv,
            lastCoinToast: reward.coins ?? 0,
          })
        );
        return { ok: true, rewards: reward };
      },

      castFishingRod: () => {
        const { player, inventory, plots, achievements } = get();
        const hasCorn = (inventory.corn ?? 0) >= 1;
        const canPayCoins = player.coins >= 5;
        if (!hasCorn && !canPayCoins) {
          return { ok: false, message: 'Need 5 coins or 1 corn for bait' };
        }
        if (!canFit(inventory, plots, 1, player.barnLevel ?? 0)) {
          return { ok: false, message: 'Barn is full!' };
        }

        let nextInv = { ...inventory };
        let coins = player.coins;
        if (hasCorn) {
          nextInv.corn = nextInv.corn - 1;
        } else {
          coins -= 5;
        }

        const caught = Math.random() < 0.55;
        const fishCaught = (player.fishCaught ?? 0) + (caught ? 1 : 0);
        let nextAchievements = achievements;
        if (fishCaught >= 20) {
          nextAchievements = unlockAchievement(nextAchievements, 'angler');
        }

        const ev = activeTownEvent();
        let eventProgress = player.eventProgress;
        if (
          caught &&
          (ev.id === 'beach_bash' || ev.id === 'fishing_derby') &&
          eventStillActive(ev) &&
          player.eventId === ev.id
        ) {
          eventProgress += 1;
        }

        if (caught) {
          nextInv.fish = (nextInv.fish ?? 0) + 1;
        }

        set(
          touch({
            player: {
              ...player,
              coins,
              fishCaught,
              eventProgress,
            },
            inventory: nextInv,
            achievements: nextAchievements,
          })
        );

        if (caught) {
          return { ok: true, caught: true, message: 'You caught a fish!' };
        }
        return { ok: true, caught: false, message: 'Nothing bit — try again!' };
      },

      placeRoad: (plotId) => get().placeBuilding(plotId, 'road'),

      noteReturnFromOffline: () => {
        if (offlineNotedThisSession) {
          return get().offlineWelcome ?? [];
        }
        offlineNotedThisSession = true;
        const state = get();
        const lastSeen = state.player.lastSeenAt ?? 0;
        const now = Date.now();
        const lines = computeOfflineGains(state.plots, lastSeen, now);
        set(
          touch({
            player: { ...state.player, lastSeenAt: now },
            offlineWelcome: lines.length ? lines : null,
          })
        );
        return lines;
      },

      clearOfflineWelcome: () => set({ offlineWelcome: null }),

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
        if (!canFit(inventory, plots, 1, player.barnLevel ?? 0)) {
          return { ok: false, message: 'Warehouse full' };
        }

        const roll = Math.random();
        let reward = 'ore';
        let nextInv = { ...inventory };
        let gems = player.gems;
        let coins = player.coins;

        if (roll > 0.92) {
          gems += 1;
          reward = 'gem';
        } else if (roll > 0.78) {
          coins += 25;
          reward = 'coins';
        } else if (roll > 0.62) {
          nextInv.iron = (nextInv.iron ?? 0) + 1;
          reward = 'iron';
        } else if (roll > 0.48) {
          nextInv.coal = (nextInv.coal ?? 0) + 1;
          reward = 'coal';
        } else if (roll > 0.34) {
          nextInv.clay = (nextInv.clay ?? 0) + 1;
          reward = 'clay';
        } else if (roll > 0.2) {
          nextInv.wood = (nextInv.wood ?? 0) + 1;
          reward = 'wood';
        } else {
          nextInv.ore = (nextInv.ore ?? 0) + 1;
          reward = 'ore';
        }

        const ev = activeTownEvent();
        let eventProgress = player.eventProgress;
        if (
          ev.id === 'spooky_hunt' &&
          eventStillActive(ev) &&
          player.eventId === ev.id
        ) {
          eventProgress += 1;
        }

        set(
          touch({
            player: {
              ...player,
              mineEnergySpent: player.mineEnergySpent + MINE_ENERGY_PER_DIG,
              lastMineAt: Date.now(),
              gems,
              coins,
              eventProgress,
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

      claimQuest: (questId) => {
        const { quests, player } = get();
        const q = quests.find((x) => x.id === questId);
        const def = questDef(questId as never);
        if (!q || !def) return { ok: false, message: 'Quest not found' };
        if (q.claimed) return { ok: false, message: 'Already claimed' };
        if (q.progress < def.target) {
          return { ok: false, message: 'Not finished yet' };
        }
        const nextPlayer = addXp(
          {
            ...player,
            coins: player.coins + def.rewardCoins,
            gems: player.gems + def.rewardGems,
          },
          def.rewardXp
        );
        let nextQuests = quests.map((x) =>
          x.id === questId ? { ...x, claimed: true } : x
        );
        nextQuests = setQuestProgress(
          nextQuests,
          'reach_level',
          nextPlayer.level
        );
        const allTutorialDone = [
          'welcome_plant',
          'welcome_harvest',
          'welcome_bakery',
          'welcome_bread',
          'welcome_order',
          'welcome_house',
        ].every((id) => nextQuests.find((x) => x.id === id)?.claimed);

        set(
          touch({
            player: nextPlayer,
            quests: nextQuests,
            tutorialDone: allTutorialDone || get().tutorialDone,
            lastCoinToast: def.rewardCoins,
          })
        );
        return { ok: true };
      },

      buyFromMarket: (itemId, qty) => {
        const { player, inventory, plots } = get();
        if (qty <= 0) return { ok: false, message: 'Invalid amount' };
        const cost = buyPrice(itemId) * qty;
        if (player.coins < cost) {
          return { ok: false, message: 'Not enough coins' };
        }
        if (!canFit(inventory, plots, qty, player.barnLevel ?? 0)) {
          return { ok: false, message: 'Barn is full!' };
        }
        set(
          touch({
            player: { ...player, coins: player.coins - cost },
            inventory: {
              ...inventory,
              [itemId]: (inventory[itemId] ?? 0) + qty,
            },
          })
        );
        return { ok: true };
      },

      sellToMarket: (itemId, qty) => {
        const { player, inventory, stats } = get();
        const have = inventory[itemId] ?? 0;
        if (qty <= 0 || have < qty) {
          return { ok: false, message: 'Not enough in barn' };
        }
        const coins = sellPrice(itemId) * qty;
        let achievements = get().achievements;
        if (stats.coinsEarned + coins >= 10000) {
          achievements = unlockAchievement(achievements, 'entrepreneur');
        }
        set(
          touch({
            inventory: { ...inventory, [itemId]: have - qty },
            player: { ...player, coins: player.coins + coins },
            stats: { ...stats, coinsEarned: stats.coinsEarned + coins },
            achievements,
            lastCoinToast: coins,
          })
        );
        return { ok: true, coins };
      },

      joinClub: (club) => {
        const { club: current, achievements } = get();
        if (current?.joined) {
          return { ok: false, message: 'Leave your club first' };
        }
        set(
          touch({
            club: {
              ...club,
              joined: true,
              donatedTotal: 0,
              members: [
                ...club.members,
                {
                  id: 'you',
                  name: get().player.townName || 'You',
                  role: 'member',
                  donated: 0,
                },
              ],
            },
            achievements: unlockAchievement(achievements, 'socialite'),
          })
        );
        return { ok: true };
      },

      leaveClub: () => set(touch({ club: null })),

      donateToClub: (qty) => {
        const { club, inventory } = get();
        if (!club?.joined) return { ok: false, message: 'Join a club first' };
        if ((inventory.wheat ?? 0) < qty) {
          return { ok: false, message: 'Need wheat to donate' };
        }
        set(
          touch({
            inventory: { ...inventory, wheat: inventory.wheat - qty },
            club: {
              ...club,
              donatedTotal: club.donatedTotal + qty,
              taskProgress: Math.min(
                club.taskTarget,
                club.taskProgress + qty
              ),
              members: club.members.map((m) =>
                m.id === 'you' ? { ...m, donated: m.donated + qty } : m
              ),
            },
          })
        );
        return { ok: true };
      },

      claimClubTask: () => {
        const { club, player } = get();
        if (!club?.joined) return { ok: false, message: 'No club' };
        if (club.taskProgress < club.taskTarget) {
          return { ok: false, message: 'Task not finished' };
        }
        set(
          touch({
            player: {
              ...player,
              coins: player.coins + club.taskRewardCoins,
            },
            club: {
              ...club,
              taskProgress: 0,
              taskTarget: club.taskTarget + 10,
              taskRewardCoins: club.taskRewardCoins + 50,
              taskLabel: `Club drive — donate ${club.taskTarget + 10} wheat`,
            },
            lastCoinToast: club.taskRewardCoins,
          })
        );
        return { ok: true };
      },

      syncEvent: () => {
        const ev = activeTownEvent();
        const { player } = get();
        if (player.eventId === ev.id && eventStillActive(ev)) return;
        set(
          touch({
            player: {
              ...player,
              eventId: ev.id,
              eventProgress: 0,
              eventClaimed: false,
              eventTokens: player.eventTokens ?? 0,
            },
          })
        );
      },

      claimEventReward: () => {
        const { player } = get();
        const ev = activeTownEvent();
        if (player.eventId !== ev.id || !eventStillActive(ev)) {
          return { ok: false, message: 'Event ended' };
        }
        if (player.eventClaimed) {
          return { ok: false, message: 'Already claimed' };
        }
        if (player.eventProgress < ev.questTarget) {
          return { ok: false, message: 'Keep going!' };
        }
        set(
          touch({
            player: {
              ...player,
              coins: player.coins + ev.rewardCoins,
              gems: player.gems + ev.rewardGems,
              eventTokens: player.eventTokens + ev.rewardTokens,
              eventClaimed: true,
            },
            lastCoinToast: ev.rewardCoins,
          })
        );
        return { ok: true };
      },

      updateSettings: (partial) => {
        set(
          touch({
            settings: { ...get().settings, ...partial },
          })
        );
      },

      awardMiniGame: (coins, gems) => {
        const { player, stats } = get();
        const c = Math.max(0, Math.min(40, Math.floor(coins)));
        const g = Math.max(0, Math.min(2, Math.floor(gems)));
        set(
          touch({
            player: {
              ...player,
              coins: player.coins + c,
              gems: player.gems + g,
            },
            stats: { ...stats, coinsEarned: stats.coinsEarned + c },
            lastCoinToast: c,
          })
        );
      },

      markTutorialDone: () => set(touch({ tutorialDone: true })),

      applyCloudSave: (payload) => {
        set({
          player: {
            ...createPlayer(),
            ...payload.player,
            mineEnergySpent: payload.player.mineEnergySpent ?? 0,
            lastMineAt: payload.player.lastMineAt ?? null,
            barnLevel: payload.player.barnLevel ?? 0,
            lastDailyClaimDate:
              payload.player.lastDailyClaimDate ??
              payload.lastDailyClaimDate ??
              null,
            dailyClaimStreak:
              payload.player.dailyClaimStreak ??
              payload.dailyClaimStreak ??
              0,
            lastSeenAt:
              payload.player.lastSeenAt ?? payload.lastSeenAt ?? 0,
            fishCaught: payload.player.fishCaught ?? payload.fishCaught ?? 0,
            eventTokens: payload.player.eventTokens ?? 0,
            eventProgress: payload.player.eventProgress ?? 0,
            eventId: payload.player.eventId ?? null,
            eventClaimed: payload.player.eventClaimed ?? false,
          },
          plots: (payload.plots?.length ? payload.plots : createInitialPlots()).map(
            normalizePlot
          ),
          inventory: normalizeInventory(payload.inventory),
          orders: payload.orders?.length
            ? payload.orders
            : generateOrders(payload.player.level || 1),
          dailyGoals: payload.dailyGoals?.length
            ? payload.dailyGoals
            : createDailyGoals(),
          ledger: payload.ledger ?? [],
          achievements: mergeAchievements(payload.achievements),
          visitor: payload.visitor ?? null,
          materials: { ...emptyMaterials(), ...(payload.materials ?? {}) },
          trains: payload.trains?.length
            ? payload.trains
            : generateTrains(payload.player.level || 1),
          airport: payload.airport ?? generateAirport(payload.player.level || 1),
          zooOwned: payload.zooOwned ?? [],
          academyLevels: payload.academyLevels ?? {},
          quests: mergeQuests(payload.quests),
          settings: { ...DEFAULT_SETTINGS, ...(payload.settings ?? {}) },
          club: payload.club ?? null,
          tutorialDone: payload.tutorialDone ?? false,
          stats: { ...emptyStats(), ...(payload.stats ?? {}) },
          offlineWelcome: null,
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
          materials: s.materials,
          trains: s.trains,
          airport: s.airport,
          zooOwned: s.zooOwned,
          academyLevels: s.academyLevels,
          lastDailyClaimDate: s.player.lastDailyClaimDate,
          dailyClaimStreak: s.player.dailyClaimStreak,
          lastSeenAt: s.player.lastSeenAt,
          fishCaught: s.player.fishCaught,
          quests: s.quests,
          settings: s.settings,
          club: s.club,
          tutorialDone: s.tutorialDone,
          stats: s.stats,
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
        materials: state.materials,
        trains: state.trains,
        airport: state.airport,
        zooOwned: state.zooOwned,
        academyLevels: state.academyLevels,
        quests: state.quests,
        settings: state.settings,
        club: state.club,
        tutorialDone: state.tutorialDone,
        stats: state.stats,
        dirtyAt: state.dirtyAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.inventory = normalizeInventory(state.inventory);
        state.player = {
          ...createPlayer(),
          ...state.player,
          barnLevel: state.player?.barnLevel ?? 0,
          lastDailyClaimDate: state.player?.lastDailyClaimDate ?? null,
          dailyClaimStreak: state.player?.dailyClaimStreak ?? 0,
          lastSeenAt: state.player?.lastSeenAt ?? 0,
          fishCaught: state.player?.fishCaught ?? 0,
          eventTokens: state.player?.eventTokens ?? 0,
          eventProgress: state.player?.eventProgress ?? 0,
          eventId: state.player?.eventId ?? null,
          eventClaimed: state.player?.eventClaimed ?? false,
        };
        if (state.plots?.length) {
          state.plots = state.plots.map(normalizePlot);
        }
        if (!state.orders?.length || state.orders.length < 4) {
          state.orders = generateOrders(state.player.level || 1);
        }
        state.materials = { ...emptyMaterials(), ...(state.materials ?? {}) };
        if (!state.trains?.length) {
          state.trains = generateTrains(state.player.level || 1);
        }
        if (!state.airport) {
          state.airport = generateAirport(state.player.level || 1);
        }
        state.zooOwned = state.zooOwned ?? [];
        state.academyLevels = state.academyLevels ?? {};
        state.quests = mergeQuests(state.quests);
        state.settings = { ...DEFAULT_SETTINGS, ...(state.settings ?? {}) };
        state.club = state.club ?? null;
        state.tutorialDone = state.tutorialDone ?? false;
        state.stats = { ...emptyStats(), ...(state.stats ?? {}) };
        state.offlineWelcome = null;
        state.moveFromPlotId = null;
        state.achievements = mergeAchievements(state.achievements);
        // Soft-migrate sparse saves → open land around buildings (no forced barn)
        if (state.plots?.length) {
          const unlocked = state.plots.filter((p) => p.unlocked).length;
          if (unlocked > 0 && unlocked < 16) {
            const hubs = state.plots.filter(
              (p) => p.unlocked && (p.kind === 'building' || p.kind === 'empty')
            );
            const buildingHubs = hubs.filter((p) => p.kind === 'building');
            const anchors = buildingHubs.length ? buildingHubs : hubs;
            state.plots = state.plots.map((p) => {
              if (p.unlocked) return p;
              const near = anchors.some(
                (h) => Math.abs(h.x - p.x) <= 2 && Math.abs(h.y - p.y) <= 2
              );
              return near ? { ...p, unlocked: true } : p;
            });
          }
        }
        state.hydrateDone();
      },
    }
  )
);
