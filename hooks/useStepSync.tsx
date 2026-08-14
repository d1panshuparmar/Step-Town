import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';

import { registerStepBackgroundTask } from '@/lib/stepBackground';
import { startLiveStepTracking, syncHardwareSteps } from '@/lib/steps';
import { useGameStore } from '@/store/gameStore';

type StepSyncValue = {
  available: boolean | null;
  permission: boolean | null;
  listening: boolean;
  historySupported: boolean;
  backgroundSync: boolean;
  error: string | null;
  message: string | null;
  liveSteps: number;
  platform: typeof Platform.OS;
  refresh: () => Promise<number>;
};

const StepSyncContext = createContext<StepSyncValue | null>(null);

export function StepSyncProvider({ children }: { children: ReactNode }) {
  const syncSteps = useGameStore((s) => s.syncSteps);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [historySupported, setHistorySupported] = useState(false);
  const [backgroundSync, setBackgroundSync] = useState(false);
  const [message, setMessage] = useState<string | null>('Starting pedometer…');
  const [liveSteps, setLiveSteps] = useState(
    () => useGameStore.getState().player.todaySteps
  );
  const stopRef = useRef<(() => void) | null>(null);
  const lastGainRef = useRef(0);
  const startingRef = useRef(false);

  const start = useCallback(async () => {
    if (startingRef.current) return lastGainRef.current;
    startingRef.current = true;
    try {
      stopRef.current?.();
      stopRef.current = null;

      const seed = useGameStore.getState().player.todaySteps;
      // Catch up closed-app steps before (re)starting the live watcher
      const caughtUp = await syncHardwareSteps(seed);
      lastGainRef.current = syncSteps(caughtUp);
      setLiveSteps(caughtUp);

      const { stop, status } = await startLiveStepTracking((total) => {
        setLiveSteps(total);
        lastGainRef.current = syncSteps(total);
      }, caughtUp);
      stopRef.current = stop;
      setAvailable(status.available);
      setPermission(status.permission);
      setListening(status.listening);
      setHistorySupported(status.historySupported);
      setBackgroundSync(status.backgroundSync);
      setMessage(status.message);
      return lastGainRef.current;
    } finally {
      startingRef.current = false;
    }
  }, [syncSteps]);

  useEffect(() => {
    void registerStepBackgroundTask();
    void start();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void start();
      } else if (state === 'background' || state === 'inactive') {
        // Flush catch-up baseline while backgrounding
        void (async () => {
          const seed = useGameStore.getState().player.todaySteps;
          const total = await syncHardwareSteps(seed);
          syncSteps(total);
          setLiveSteps(total);
        })();
      }
    });
    return () => {
      sub.remove();
      stopRef.current?.();
      stopRef.current = null;
    };
  }, [start, syncSteps]);

  const value = useMemo<StepSyncValue>(
    () => ({
      available,
      permission,
      listening,
      historySupported,
      backgroundSync,
      error: listening ? null : message,
      message,
      liveSteps,
      platform: Platform.OS,
      refresh: start,
    }),
    [
      available,
      permission,
      listening,
      historySupported,
      backgroundSync,
      message,
      liveSteps,
      start,
    ]
  );

  return (
    <StepSyncContext.Provider value={value}>{children}</StepSyncContext.Provider>
  );
}

export function useStepSync() {
  const ctx = useContext(StepSyncContext);
  if (!ctx) {
    throw new Error('useStepSync must be used inside StepSyncProvider');
  }
  return ctx;
}
