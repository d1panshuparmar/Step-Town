import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';

import {
  isPedometerAvailable,
  readTodaySteps,
  requestMotionPermission,
} from '@/lib/steps';
import { useGameStore } from '@/store/gameStore';

export function useStepSync() {
  const syncSteps = useGameStore((s) => s.syncSteps);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (Platform.OS === 'web') {
      setAvailable(false);
      setPermission(false);
      return 0;
    }

    const ok = await isPedometerAvailable();
    setAvailable(ok);
    if (!ok) {
      setError('Pedometer unavailable on this device');
      return 0;
    }

    const granted = await requestMotionPermission();
    setPermission(granted);
    if (!granted) {
      setError('Motion permission needed to earn coins from walking');
      return 0;
    }

    const steps = await readTodaySteps();
    if (steps == null) {
      setError('Could not read steps');
      return 0;
    }

    setError(null);
    return syncSteps(steps);
  }, [syncSteps]);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  return { available, permission, error, refresh };
}
