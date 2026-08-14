import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export default function Index() {
  const authReady = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);
  const hydrated = useGameStore((s) => s.hydrated);
  const onboarded = useGameStore((s) => s.player.onboarded);

  if (!authReady || !hydrated) return null;
  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
