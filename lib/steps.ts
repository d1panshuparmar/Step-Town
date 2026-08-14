import { Pedometer } from 'expo-sensors';
import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { todayKey } from '@/lib/date';

const WATCH_STORE = 'stepwize-pedometer-watch-v2';

type WatchPersist = {
  date: string;
  watchedToday: number;
  /** Absolute TYPE_STEP_COUNTER reading (since boot). Used to catch up while app was closed. */
  lastSensorTotal: number | null;
};

export type StepEngineStatus = {
  available: boolean;
  permission: boolean;
  listening: boolean;
  platform: typeof Platform.OS;
  historySupported: boolean;
  backgroundSync: boolean;
  message: string | null;
};

async function loadWatchPersist(): Promise<WatchPersist> {
  const date = todayKey();
  try {
    const raw = await AsyncStorage.getItem(WATCH_STORE);
    if (!raw) return { date, watchedToday: 0, lastSensorTotal: null };
    const parsed = JSON.parse(raw) as WatchPersist;
    if (parsed.date !== date) {
      return {
        date,
        watchedToday: 0,
        // Keep sensor absolute across midnight so overnight/morning walks still catch up
        lastSensorTotal: parsed.lastSensorTotal ?? null,
      };
    }
    return {
      date: parsed.date,
      watchedToday: parsed.watchedToday ?? 0,
      lastSensorTotal: parsed.lastSensorTotal ?? null,
    };
  } catch {
    return { date, watchedToday: 0, lastSensorTotal: null };
  }
}

async function saveWatchPersist(data: WatchPersist) {
  await AsyncStorage.setItem(WATCH_STORE, JSON.stringify(data));
}

export async function isPedometerAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function requestMotionPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Step counting',
          message:
            'Stepwize needs activity access to count steps even when the app is closed.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not now',
        }
      );
    }

    const res = await Pedometer.requestPermissionsAsync();
    if (Platform.OS === 'android') {
      const checked = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION
      );
      return checked || res.granted;
    }
    return res.granted;
  } catch {
    return false;
  }
}

export async function readTodayStepsFromHistory(): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  const available = await isPedometerAvailable();
  if (!available) return null;

  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  try {
    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps ?? 0;
  } catch {
    return null;
  }
}

/** One hardware sample of the absolute step counter (Android) / session counter. */
export async function readAbsoluteSensorOnce(
  timeoutMs = 2500
): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  try {
    const available = await isPedometerAvailable();
    if (!available) return null;
  } catch {
    return null;
  }

  return new Promise((resolve) => {
    let done = false;
    let sub: { remove: () => void } | null = null;
    const finish = (value: number | null) => {
      if (done) return;
      done = true;
      try {
        sub?.remove();
      } catch {
        /* ignore */
      }
      resolve(value);
    };

    try {
      sub = Pedometer.watchStepCount((update) => {
        finish(Math.max(0, Math.floor(update.steps ?? 0)));
      });
    } catch {
      finish(null);
      return;
    }

    setTimeout(() => finish(null), timeoutMs);
  });
}

/**
 * Apply an absolute sensor reading: credit steps taken since the last saved
 * sensor total (covers time the app was closed / backgrounded).
 */
export async function applyAbsoluteSensorCatchUp(
  reading: number,
  seedTotal = 0,
  opts?: { maxCatchUp?: number }
): Promise<number> {
  const maxCatchUp = opts?.maxCatchUp ?? 40_000;
  const persist = await loadWatchPersist();
  const history = await readTodayStepsFromHistory();

  let todayTotal = Math.max(history ?? 0, persist.watchedToday, seedTotal);

  if (persist.lastSensorTotal != null && reading >= persist.lastSensorTotal) {
    const gap = reading - persist.lastSensorTotal;
    if (gap > 0) {
      todayTotal += Math.min(gap, maxCatchUp);
    }
  }

  await saveWatchPersist({
    date: todayKey(),
    watchedToday: todayTotal,
    lastSensorTotal: reading,
  });

  return todayTotal;
}

/** Sync hardware → today's step total (for background tasks / resume). */
export async function syncHardwareSteps(seedTotal = 0): Promise<number> {
  const history = await readTodayStepsFromHistory();
  if (history != null) {
    const persist = await loadWatchPersist();
    const todayTotal = Math.max(history, persist.watchedToday, seedTotal);
    await saveWatchPersist({
      date: todayKey(),
      watchedToday: todayTotal,
      lastSensorTotal: persist.lastSensorTotal,
    });
    // Still refresh absolute sensor so catch-up stays accurate
    const abs = await readAbsoluteSensorOnce(1800);
    if (abs != null) {
      await saveWatchPersist({
        date: todayKey(),
        watchedToday: todayTotal,
        lastSensorTotal: abs,
      });
    }
    return todayTotal;
  }

  const abs = await readAbsoluteSensorOnce();
  if (abs == null) {
    const persist = await loadWatchPersist();
    return Math.max(persist.watchedToday, seedTotal);
  }
  return applyAbsoluteSensorCatchUp(abs, seedTotal);
}

/** @deprecated */
export async function readTodaySteps(): Promise<number | null> {
  return readTodayStepsFromHistory();
}

export async function startLiveStepTracking(
  onSteps: (todayTotal: number) => void,
  seedTotal = 0
): Promise<{
  stop: () => void;
  status: StepEngineStatus;
}> {
  if (Platform.OS === 'web') {
    return {
      stop: () => {},
      status: {
        available: false,
        permission: false,
        listening: false,
        platform: 'web',
        historySupported: false,
        backgroundSync: false,
        message:
          'Browser cannot count hardware steps. Open Stepwize on your phone.',
      },
    };
  }

  const available = await isPedometerAvailable();
  if (!available) {
    return {
      stop: () => {},
      status: {
        available: false,
        permission: false,
        listening: false,
        platform: Platform.OS,
        historySupported: false,
        backgroundSync: false,
        message: 'No pedometer sensor on this device.',
      },
    };
  }

  const permission = await requestMotionPermission();
  if (!permission) {
    return {
      stop: () => {},
      status: {
        available: true,
        permission: false,
        listening: false,
        platform: Platform.OS,
        historySupported: Platform.OS === 'ios',
        backgroundSync: false,
        message: 'Allow Physical activity / Motion so walking can earn coins.',
      },
    };
  }

  // Catch up any steps taken while the app was closed, then keep listening live.
  let todayTotal = await syncHardwareSteps(seedTotal);
  onSteps(todayTotal);

  const history = await readTodayStepsFromHistory();
  const historySupported = history != null;

  let lastWatchReading: number | null = null;
  let stopped = false;
  let primed = false;

  const persistNow = async (sensor: number | null) => {
    const prev = await loadWatchPersist();
    await saveWatchPersist({
      date: todayKey(),
      watchedToday: todayTotal,
      lastSensorTotal: sensor ?? prev.lastSensorTotal,
    });
  };

  const subscription = Pedometer.watchStepCount((update) => {
    if (stopped) return;
    const reading = Math.max(0, Math.floor(update.steps ?? 0));

    if (!primed) {
      primed = true;
      // First live event: catch-up already applied in syncHardwareSteps;
      // just lock the baseline for incremental updates.
      lastWatchReading = reading;
      void persistNow(reading);
      return;
    }

    if (lastWatchReading == null) {
      lastWatchReading = reading;
      return;
    }

    if (reading < lastWatchReading) {
      // Reboot / counter reset
      lastWatchReading = reading;
      void persistNow(reading);
      return;
    }

    const delta = reading - lastWatchReading;
    lastWatchReading = reading;
    if (delta <= 0) return;

    // Live ticks should be small; catch-up already handled closed-app gaps.
    const safeDelta = Math.min(delta, 400);
    todayTotal += safeDelta;
    void persistNow(reading);
    onSteps(todayTotal);
  });

  const pollId = setInterval(() => {
    void (async () => {
      if (stopped) return;
      if (Platform.OS === 'ios') {
        const h = await readTodayStepsFromHistory();
        if (h != null && h > todayTotal) {
          todayTotal = h;
          await persistNow(lastWatchReading);
          onSteps(todayTotal);
        }
      } else {
        // Periodic absolute refresh while app is open (covers sensor quirks)
        const abs = await readAbsoluteSensorOnce(1200);
        if (abs == null || lastWatchReading == null) return;
        if (abs > lastWatchReading) {
          const gap = Math.min(abs - lastWatchReading, 2000);
          if (gap > 0) {
            todayTotal += gap;
            lastWatchReading = abs;
            await persistNow(abs);
            onSteps(todayTotal);
          }
        }
      }
    })();
  }, Platform.OS === 'ios' ? 8000 : 20_000);

  return {
    stop: () => {
      stopped = true;
      subscription?.remove();
      clearInterval(pollId);
      // Freeze last sensor total so next launch can catch up
      void persistNow(lastWatchReading);
    },
    status: {
      available: true,
      permission: true,
      listening: true,
      platform: Platform.OS,
      historySupported,
      backgroundSync: true,
      message: historySupported
        ? 'Steps sync from your phone all day — open Stepwize anytime to credit coins.'
        : 'Steps keep counting in the background. Open Stepwize periodically to sync coins (Android).',
    },
  };
}
