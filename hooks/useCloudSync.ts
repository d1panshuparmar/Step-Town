import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import { pullCloudSave, pushCloudSave } from '@/lib/cloudSave';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export function useCloudSync() {
  const user = useAuthStore((s) => s.user);
  const dirtyAt = useGameStore((s) => s.dirtyAt);
  const pulling = useRef(false);
  const lastPush = useRef(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      pulling.current = true;
      try {
        const remote = await pullCloudSave(user.id);
        if (cancelled || !remote?.player?.onboarded) return;
        const local = useGameStore.getState();
        const localDirty = local.dirtyAt ?? 0;
        const remoteTime = remote.savedAt ?? 0;
        // Prefer remote when local town not started, or remote is newer and local is clean
        if (!local.player.onboarded || (remoteTime > localDirty && localDirty === 0)) {
          useGameStore.getState().applyCloudSave(remote);
        } else if (remoteTime > localDirty) {
          useGameStore.getState().applyCloudSave(remote);
        }
      } catch {
        /* offline ok */
      } finally {
        pulling.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || !dirtyAt || pulling.current) return;
    const t = setTimeout(async () => {
      try {
        const payload = useGameStore.getState().exportCloudSave();
        await pushCloudSave(user.id, payload);
        useGameStore.getState().markClean();
        lastPush.current = Date.now();
      } catch {
        /* retry later */
      }
    }, 10_000);
    return () => clearTimeout(t);
  }, [user?.id, dirtyAt]);

  useEffect(() => {
    if (!user) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'background' && state !== 'inactive') return;
      const payload = useGameStore.getState().exportCloudSave();
      if (!useGameStore.getState().dirtyAt) return;
      void pushCloudSave(user.id, payload).then(() => {
        useGameStore.getState().markClean();
      });
    });
    return () => sub.remove();
  }, [user?.id]);
}
