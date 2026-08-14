import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { formatNumber } from '@/lib/date';
import { streakMultiplier } from '@/lib/economy';
import { useStepSync } from '@/hooks/useStepSync';
import { useGameStore } from '@/store/gameStore';

export default function StepsScreen() {
  const player = useGameStore((s) => s.player);
  const ledger = useGameStore((s) => s.ledger);
  const simulateWalk = useGameStore((s) => s.simulateWalk);
  const {
    available,
    permission,
    listening,
    historySupported,
    backgroundSync,
    message,
    error,
    refresh,
    platform,
    liveSteps,
  } = useStepSync();
  const [lastGain, setLastGain] = useState(0);

  const todayLedger = ledger.find((l) => l.date === player.todayDate);
  const mult = streakMultiplier(player.streak);
  const shownSteps = Math.max(player.todaySteps, liveSteps);
  const canSimulate = available === false || platform === 'web' || __DEV__;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Steps</Title>
        <Subtitle>Walk anytime — steps sync in the background</Subtitle>

        <LinearGradient
          colors={['#2E7D4F', '#1B5E3A']}
          style={styles.hero}>
          <View style={styles.liveRow}>
            <View
              style={[
                styles.liveDot,
                { backgroundColor: listening ? '#7CFFB2' : '#FF8A80' },
              ]}
            />
            <Text style={styles.liveText}>
              {listening
                ? backgroundSync
                  ? 'Tracking all day'
                  : 'Counting live'
                : 'Not counting'}
            </Text>
          </View>
          <Text style={styles.bigNumber}>{formatNumber(shownSteps)}</Text>
          <Text style={styles.heroSub}>steps today</Text>
          <View style={styles.row}>
            <Stat label="Coins" value={formatNumber(player.coins)} light />
            <Stat label="Streak" value={`${player.streak}d`} light />
            <Stat label="Bonus" value={`${Math.round(mult * 100)}%`} light />
          </View>
        </LinearGradient>

        <Panel style={styles.block}>
          <Text style={styles.section}>Pedometer</Text>
          <Body muted>
            {error ??
              message ??
              (listening
                ? 'Your phone keeps counting steps. Open Stepwize anytime to sync coins.'
                : 'Waiting for sensor…')}
          </Body>
          {listening && backgroundSync && (
            <Body muted>
              Background sync is on. Android may delay sync until you reopen the
              app or the system wakes Stepwize — steps are not lost.
            </Body>
          )}
          {listening && !historySupported && platform === 'android' && !backgroundSync && (
            <Body muted>
              Android counts while Step-Town is open. Keep the app in the
              foreground when walking.
            </Body>
          )}
          {permission === false && (
            <Body>
              Open system settings → Apps → Step-Town → Permissions → Physical
              activity → Allow.
            </Body>
          )}
          {lastGain > 0 && (
            <Body>Last credit +{lastGain} Step Coins.</Body>
          )}
          <View style={styles.actions}>
            <PrimaryButton
              label={
                permission === false
                  ? 'Request permission again'
                  : 'Restart step counter'
              }
              onPress={async () => {
                const gained = await refresh();
                setLastGain(gained);
              }}
            />
            {canSimulate && (
              <>
                <SecondaryButton
                  label="Simulate +500 steps"
                  onPress={() => setLastGain(simulateWalk(500))}
                />
                <SecondaryButton
                  label="Simulate +2,000 steps"
                  onPress={() => setLastGain(simulateWalk(2000))}
                />
              </>
            )}
          </View>
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.section}>Economy</Text>
          <Body muted>
            {STEPS_PER_COIN} steps ≈ 1 coin. Full rate to{' '}
            {formatNumber(FULL_RATE_STEP_CAP)} steps/day, then soft taper. Hit{' '}
            {formatNumber(WALK_GOAL_STEPS)} for streak bonus.
          </Body>
          {todayLedger && (
            <Body>
              Converted today: {formatNumber(todayLedger.convertedCoins)} coins
              {todayLedger.cappedFlag ? ' · taper active' : ''}
            </Body>
          )}
        </Panel>
      </ScrollView>
    </Screen>
  );
}

function Stat({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light?: boolean;
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, light && { color: '#FFF8E7' }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, light && { color: '#C8E6C9' }]}>
        {label}
      </Text>
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
    borderRadius: radii.lg,
    paddingVertical: 22,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#14532D',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 99,
  },
  liveText: {
    fontFamily: fonts.bodyBold,
    color: '#E8F5E9',
    fontSize: 13,
  },
  bigNumber: {
    fontFamily: fonts.display,
    fontSize: 64,
    color: '#FFFDE7',
    letterSpacing: -2,
  },
  heroSub: {
    fontFamily: fonts.body,
    color: '#C8E6C9',
    fontSize: 15,
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
