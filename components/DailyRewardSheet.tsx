import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, PrimaryButton, SecondaryButton } from '@/components/ui';
import { ITEM_META } from '@/constants/catalog';
import { fonts, palette, radii } from '@/constants/theme';
import {
  DAILY_REWARD_CYCLE,
  canClaimDaily,
  nextDailyStreak,
  rewardForStreak,
} from '@/lib/dailyRewards';
import { todayKey } from '@/lib/date';
import type { ItemId } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

function formatReward(day: (typeof DAILY_REWARD_CYCLE)[number]): string {
  const parts: string[] = [];
  const r = day.reward;
  if (r.coins) parts.push(`${r.coins}🪙`);
  if (r.gems) parts.push(`${r.gems}💎`);
  if (r.items) {
    for (const [id, qty] of Object.entries(r.items)) {
      if (!qty) continue;
      parts.push(`${ITEM_META[id as ItemId]?.emoji ?? id}×${qty}`);
    }
  }
  return parts.join(' · ') || 'Surprise';
}

export function DailyRewardSheet({ onClose }: { onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const claimDailyReward = useGameStore((s) => s.claimDailyReward);
  const today = todayKey();
  const claimed = !canClaimDaily(player.lastDailyClaimDate, today);
  const previewStreak = claimed
    ? player.dailyClaimStreak || 1
    : nextDailyStreak(
        player.lastDailyClaimDate,
        player.dailyClaimStreak ?? 0,
        today
      );
  const todayReward = rewardForStreak(previewStreak);

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>🎁 Daily Gift</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <Body muted>
        Streak day {previewStreak} of 7
        {claimed ? ' · claimed today' : ' · ready to claim'}
      </Body>

      <View style={styles.row}>
        {DAILY_REWARD_CYCLE.map((day) => {
          const active = day.day === ((previewStreak - 1) % 7) + 1;
          return (
            <View
              key={day.day}
              style={[styles.day, active && styles.dayOn]}>
              <Text style={styles.dayNum}>{day.day}</Text>
              <Text style={styles.dayReward} numberOfLines={2}>
                {formatReward(day)}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.today}>
        Today: {formatReward(todayReward)}
      </Text>

      {claimed ? (
        <SecondaryButton label="Come back tomorrow" onPress={onClose} />
      ) : (
        <PrimaryButton
          label="Claim daily reward"
          onPress={() => {
            const res = claimDailyReward();
            if (!res.ok) Alert.alert('Daily gift', res.message);
            else {
              Alert.alert('Claimed!', formatReward(todayReward));
              onClose();
            }
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { gap: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 24,
    color: palette.ink,
  },
  close: {
    fontFamily: fonts.bodyBold,
    color: palette.inkMuted,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  day: {
    width: '30%',
    flexGrow: 1,
    minWidth: 88,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#C4A484',
    backgroundColor: 'rgba(255,255,255,0.45)',
    padding: 8,
    gap: 4,
  },
  dayOn: {
    borderColor: '#8B5E3C',
    backgroundColor: '#F6E2B8',
  },
  dayNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: palette.inkMuted,
  },
  dayReward: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: palette.ink,
  },
  today: {
    fontFamily: fonts.bodyExtra,
    fontSize: 15,
    color: palette.ink,
  },
});
