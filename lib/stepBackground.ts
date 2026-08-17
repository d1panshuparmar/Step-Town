import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { syncHardwareSteps } from '@/lib/steps';

export const STEP_BG_TASK = 'stepwize-step-sync-v2';

async function waitForGameHydration(timeoutMs = 8000): Promise<boolean> {
  const { useGameStore } = await import('@/store/gameStore');
  const api = useGameStore as typeof useGameStore & {
    persist?: {
      hasHydrated?: () => boolean;
      onFinishHydration?: (cb: () => void) => () => void;
      rehydrate?: () => Promise<void>;
    };
  };

  try {
    await api.persist?.rehydrate?.();
  } catch {
    /* ignore */
  }

  if (api.persist?.hasHydrated?.() || useGameStore.getState().hydrated) {
    return true;
  }

  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), timeoutMs);
    const unsub = api.persist?.onFinishHydration?.(() => {
      clearTimeout(t);
      unsub?.();
      resolve(true);
    });
    if (!unsub) {
      clearTimeout(t);
      resolve(useGameStore.getState().hydrated);
    }
  });
}

/**
 * Must be defined in the global scope (imported from app entry / root layout).
 * Periodically wakes the app to catch up pedometer totals while closed.
 */
TaskManager.defineTask(STEP_BG_TASK, async () => {
  try {
    await waitForGameHydration();
    const { useGameStore } = await import('@/store/gameStore');
    const seed = useGameStore.getState().player.todaySteps;
    const total = await syncHardwareSteps(seed);
    useGameStore.getState().syncSteps(total);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerStepBackgroundTask(): Promise<void> {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status === BackgroundTask.BackgroundTaskStatus.Restricted) return;

    // Re-register so interval / task name updates apply after upgrades
    const registered = await TaskManager.isTaskRegisteredAsync(STEP_BG_TASK);
    if (registered) {
      try {
        await BackgroundTask.unregisterTaskAsync(STEP_BG_TASK);
      } catch {
        /* ignore */
      }
    }

    await BackgroundTask.registerTaskAsync(STEP_BG_TASK, {
      minimumInterval: 15, // minutes (OS may run later)
    });
  } catch {
    /* background APIs unavailable in some environments */
  }
}
