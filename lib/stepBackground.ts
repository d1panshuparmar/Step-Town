import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import { syncHardwareSteps } from '@/lib/steps';

export const STEP_BG_TASK = 'stepwize-step-sync-v1';

/**
 * Must be defined in the global scope (imported from app entry / root layout).
 * Periodically wakes the app to catch up pedometer totals while closed.
 */
TaskManager.defineTask(STEP_BG_TASK, async () => {
  try {
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

    const registered = await TaskManager.isTaskRegisteredAsync(STEP_BG_TASK);
    if (registered) return;

    await BackgroundTask.registerTaskAsync(STEP_BG_TASK, {
      minimumInterval: 15, // minutes (OS may run later)
    });
  } catch {
    /* background APIs unavailable in some environments */
  }
}
