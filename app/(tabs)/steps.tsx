import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Body,
  Panel,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '@/components/ui';
import {
  FULL_RATE_STEP_CAP,
  STEPS_PER_COIN,
  WALK_GOAL_STEPS,
} from '@/constants/catalog';
import { fonts, palette, spacing } from '@/constants/theme';
import { formatNumber } from '@/lib/date';
import { streakMultiplier } from '@/lib/economy';
import { useStepSync } from '@/hooks/useStepSync';
import { useGameStore } from '@/store/gameStore';

export default function StepsScreen() {
  const player = useGameStore((s) => s.player);
  const ledger = useGameStore((s) => s.ledger);
  const simulateWalk = useGameStore((s) => s.simulateWalk);
  const { available, permission, error, refresh } = useStepSync();
  const [lastGain, setLastGain] = useState(0);

  const todayLedger = ledger.find((l) => l.date === player.todayDate);
  const mult = streakMultiplier(player.streak);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Steps</Title>
        <Subtitle>Walk → earn Step Coins</Subtitle>

        <Panel style={styles.hero}>
          <Text style={styles.bigNumber}>{formatNumber(player.todaySteps)}</Text>
          <Body muted>steps today</Body>
          <View style={styles.row}>
            <Stat label="Coins" value={formatNumber(player.coins)} />
            <Stat label="Streak" value={`${player.streak}d`} />
            <Stat label="Bonus" value={`${Math.round(mult * 100)}%`} />
          </View>
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.section}>How earning works</Text>
          <Body muted>
            {STEPS_PER_COIN} steps ≈ 1 coin. Full rate up to{' '}
            {formatNumber(FULL_RATE_STEP_CAP)} steps, then soft taper. Hit{' '}
            {formatNumber(WALK_GOAL_STEPS)} steps to keep your streak.
          </Body>
          {todayLedger && (
            <Body>
              Converted today: {formatNumber(todayLedger.convertedCoins)} coins
              {todayLedger.cappedFlag ? ' · taper active' : ''}
            </Body>
          )}
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.section}>Sync</Text>
          <Body muted>
            {available === false
              ? 'Pedometer not available — use simulate while testing.'
              : permission === false
                ? 'Motion permission denied. Enable it in system settings.'
                : error ?? 'Steps sync when you open the app or return from a walk.'}
          </Body>
          {lastGain > 0 && (
            <Body>Last sync credited +{lastGain} coins.</Body>
          )}
          <View style={styles.actions}>
            <PrimaryButton
              label="Sync steps now"
              onPress={async () => {
                const gained = await refresh();
                setLastGain(gained);
              }}
            />
            <SecondaryButton
              label="Simulate +500 steps"
              onPress={() => setLastGain(simulateWalk(500))}
            />
            <SecondaryButton
              label="Simulate +2,000 steps"
              onPress={() => setLastGain(simulateWalk(2000))}
            />
          </View>
        </Panel>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.cream,
  },
  bigNumber: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: palette.ink,
    letterSpacing: -2,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
  },
  stat: {
    alignItems: 'center',
    minWidth: 72,
  },
  statValue: {
    fontFamily: fonts.bodyExtra,
    fontSize: 18,
    color: palette.ink,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.inkMuted,
  },
  block: {
    gap: 10,
  },
  section: {
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    color: palette.ink,
  },
  actions: {
    gap: 8,
    marginTop: 4,
  },
});
