import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Body,
  Panel,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

export default function GoalsScreen() {
  const goals = useGameStore((s) => s.dailyGoals);
  const player = useGameStore((s) => s.player);
  const claimDailyGoal = useGameStore((s) => s.claimDailyGoal);
  const allClaimed = goals.every((g) => g.claimed);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Daily goals</Title>
        <Subtitle>Chest rewards reset each day</Subtitle>

        <Panel style={styles.streak}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>{player.streak}-day streak</Text>
            <Body muted>
              Walk enough each day to keep the coin bonus climbing.
            </Body>
          </View>
        </Panel>

        {goals.map((goal) => {
          const pct = Math.min(1, goal.progress / goal.target);
          const done = goal.progress >= goal.target;
          return (
            <Panel key={goal.id} style={styles.card}>
              <Text style={styles.name}>{goal.label}</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${pct * 100}%` }]} />
              </View>
              <Body muted>
                {Math.min(goal.progress, goal.target)} / {goal.target}
                {' · '}
                {goal.rewardCoins} coins
                {goal.rewardGems ? ` · ${goal.rewardGems} gem` : ''}
              </Body>
              <PrimaryButton
                label={
                  goal.claimed ? 'Claimed' : done ? 'Claim reward' : 'In progress'
                }
                disabled={!done || goal.claimed}
                onPress={() => {
                  const res = claimDailyGoal(goal.id);
                  if (!res.ok) Alert.alert('Goals', res.message);
                }}
              />
            </Panel>
          );
        })}

        {allClaimed && (
          <Panel>
            <Text style={styles.name}>Town chest cleared</Text>
            <Body muted>Come back tomorrow for a fresh set of goals.</Body>
          </Panel>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  streak: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 36,
  },
  streakTitle: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    color: palette.ink,
  },
  card: {
    gap: 10,
  },
  name: {
    fontFamily: fonts.bodyExtra,
    fontSize: 17,
    color: palette.ink,
  },
  track: {
    height: 10,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: palette.gem,
  },
});
