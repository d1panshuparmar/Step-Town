import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  Nunito_500Medium,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { LoadingGate } from '@/components/ui';
import { palette } from '@/constants/theme';
import { useCloudSync } from '@/hooks/useCloudSync';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const hydrated = useGameStore((s) => s.hydrated);
  const authReady = useAuthStore((s) => s.ready);
  const initAuth = useAuthStore((s) => s.init);
  useCloudSync();

  const [loaded, error] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Nunito_500Medium,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && hydrated && authReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, hydrated, authReady]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!useGameStore.getState().hydrated) {
        useGameStore.getState().hydrateDone();
      }
    }, 800);
    return () => clearTimeout(t);
  }, []);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: palette.skyBottom }}>
      <StatusBar style="dark" />
      <LoadingGate ready={hydrated && authReady} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: palette.skyBottom },
        }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
