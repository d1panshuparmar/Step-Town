import { Redirect, Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Text } from 'react-native';

import { fonts, palette } from '@/constants/theme';
import { useStepSync } from '@/hooks/useStepSync';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 18 }}>{emoji}</Text>;
}

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  const onboarded = useGameStore((s) => s.player.onboarded);
  const ensureToday = useGameStore((s) => s.ensureToday);
  useStepSync();

  useEffect(() => {
    ensureToday();
  }, [ensureToday]);

  if (!user) return <Redirect href="/(auth)/welcome" />;
  if (!onboarded) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.wood,
        tabBarInactiveTintColor: palette.inkMuted,
        tabBarStyle: {
          backgroundColor: '#F8E7C9',
          borderTopColor: palette.woodLight,
          height: 64,
          paddingTop: 6,
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
        name="goals"
        options={{ title: 'Goals', tabBarIcon: () => <TabIcon emoji="🎁" /> }}
      />
      <Tabs.Screen
        name="achievements"
        options={{ title: 'Badges', tabBarIcon: () => <TabIcon emoji="🏆" /> }}
      />
    </Tabs>
  );
}
