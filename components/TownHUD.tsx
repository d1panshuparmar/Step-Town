import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { fonts, palette, radii, spacing } from '@/constants/theme';
import { xpForLevel } from '@/constants/catalog';
import { formatNumber } from '@/lib/date';
import {
  inventoryUsed,
  townHappiness,
  townPopulation,
  warehouseCapacity,
} from '@/lib/townStats';
import { useGameStore } from '@/store/gameStore';
import { useStepSync } from '@/hooks/useStepSync';

export function TownHUD() {
  const player = useGameStore((s) => s.player);
  const plots = useGameStore((s) => s.plots);
  const inventory = useGameStore((s) => s.inventory);
  const { listening, liveSteps } = useStepSync();
  const need = xpForLevel(player.level);
  const xpPct = Math.min(1, player.xp / need);
  const pop = townPopulation(plots);
  const happy = townHappiness(plots);
  const used = inventoryUsed(inventory);
  const cap = warehouseCapacity(plots);
  const stepsShown = Math.max(player.todaySteps, liveSteps);

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.brandRow}>
        <Text style={styles.brand}>Stepwize</Text>
        <View style={styles.townRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: listening ? '#3DDC97' : '#FF8A80' },
            ]}
          />
          <Text style={styles.town}>{player.townName || 'Your Town'}</Text>
        </View>
      </View>

      <LinearGradient
        colors={['#FFF1D6', '#E8CFA3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.panel}>
        <View style={styles.stats}>
          <Pill emoji="🪙" value={formatNumber(player.coins)} />
          <Pill emoji="💎" value={formatNumber(player.gems)} />
          <Pill emoji="👟" value={formatNumber(stepsShown)} />
          <Pill emoji="🔥" value={`${player.streak}`} />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>👥 {pop}</Text>
          <Text style={styles.meta}>😊 {happy}</Text>
          <Text style={styles.meta}>
            📦 {used}/{cap}
          </Text>
        </View>
        <View style={styles.levelRow}>
          <Text style={styles.levelText}>Lv {player.level}</Text>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpPct * 100}%` }]} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function Pill({ emoji, value }: { emoji: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillEmoji}>{emoji}</Text>
      <Text style={styles.pillText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: palette.ink,
    letterSpacing: -0.8,
  },
  townRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  town: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: palette.inkMuted,
  },
  panel: {
    borderRadius: radii.lg,
    padding: 10,
    borderWidth: 2,
    borderColor: palette.wood,
    gap: 6,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(107,68,35,0.15)',
  },
  pillEmoji: { fontSize: 12 },
  pillText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 12,
    color: palette.ink,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  meta: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: palette.inkMuted,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: palette.inkMuted,
    width: 36,
  },
  xpTrack: {
    flex: 1,
    height: 9,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.55)',
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: palette.gem,
    borderRadius: 99,
  },
});
