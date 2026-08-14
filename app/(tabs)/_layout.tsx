import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { fonts, palette } from '@/constants/theme';
import { StepSyncProvider } from '@/hooks/useStepSync';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}

function TabsInner() {
  const ensureToday = useGameStore((s) => s.ensureToday);

  useEffect(() => {
    ensureToday();
  }, [ensureToday]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.wood,
        tabBarInactiveTintColor: palette.inkMuted,
        tabBarStyle: {
          backgroundColor: '#F8E7C9',
          borderTopColor: palette.woodLight,
          height: 62,
          paddingTop: 4,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyBold,
          fontSize: 10,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Town', tabBarIcon: () => <TabIcon emoji="🏡" /> }}
      />
      <Tabs.Screen
        name="steps"
        options={{ title: 'Steps', tabBarIcon: () => <TabIcon emoji="👟" /> }}
      />
      <Tabs.Screen
        name="shop"
        options={{ title: 'Shop', tabBarIcon: () => <TabIcon emoji="🛒" /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: () => <TabIcon emoji="📋" /> }}
      />
      <Tabs.Screen
        name="mine"
        options={{ title: 'Mine', tabBarIcon: () => <TabIcon emoji="⛏️" /> }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: () => <TabIcon emoji="☰" />,
        }}
      />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="friends" options={{ href: null }} />
      <Tabs.Screen name="achievements" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const onboarded = useGameStore((s) => s.player.onboarded);

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <StepSyncProvider>
      <TabsInner />
    </StepSyncProvider>
  );
}
