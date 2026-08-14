import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Body,
  Panel,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '@/components/ui';
import { fonts, palette, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export default function AchievementsScreen() {
  const achievements = useGameStore((s) => s.achievements);
  const claimAchievement = useGameStore((s) => s.claimAchievement);
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const mode = useAuthStore((s) => s.mode);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Badges</Title>
        <Subtitle>Milestone rewards for your town</Subtitle>

        {achievements.map((a) => (
          <Panel key={a.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.emoji}>{a.unlocked ? '🏆' : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.title}</Text>
                <Body muted>{a.description}</Body>
                <Body muted>+{a.rewardCoins} coins</Body>
              </View>
            </View>
            <PrimaryButton
              label={
                a.claimed
                  ? 'Claimed'
                  : a.unlocked
                    ? 'Claim'
                    : 'Locked'
              }
              disabled={!a.unlocked || a.claimed}
              onPress={() => {
                const res = claimAchievement(a.id);
                if (!res.ok) Alert.alert('Badge', res.message);
              }}
            />
          </Panel>
        ))}

        <Panel style={styles.card}>
          <Text style={styles.name}>Account</Text>
          <Body muted>
            {user?.email} · {mode === 'supabase' ? 'Cloud sync on' : 'Device save'}
          </Body>
          <SecondaryButton
            label="Sign out"
            onPress={async () => {
              await signOut();
            }}
          />
        </Panel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  card: { gap: 10 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  emoji: { fontSize: 28 },
  name: {
    fontFamily: fonts.bodyExtra,
    fontSize: 16,
    color: palette.ink,
  },
});
