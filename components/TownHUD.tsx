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

/** Township-style top HUD: wooden bars + chunky resource chips */
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
      <View style={styles.topBar}>
        <View style={styles.townBadge}>
          <View
            style={[
              styles.dot,
              { backgroundColor: listening ? '#4ADE80' : '#FB7185' },
            ]}
          />
          <Text style={styles.town} numberOfLines={1}>
            {player.townName || 'My Township'}
          </Text>
        </View>
        <Text style={styles.brand}>Stepwize</Text>
      </View>

      <LinearGradient
        colors={['#F6E2B8', '#E8C98A', '#D4A574']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.panel}>
        <View style={styles.stats}>
          <Chip emoji="🪙" value={formatNumber(player.coins)} tint="#FFF3C4" />
          <Chip emoji="💎" value={formatNumber(player.gems)} tint="#DCEBFF" />
          <Chip emoji="👟" value={formatNumber(stepsShown)} tint="#DFF5D4" />
          <Chip emoji="🔥" value={`${player.streak}`} tint="#FFE0D4" />
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>👥 {pop}</Text>
          <Text style={styles.meta}>😊 {happy}</Text>
          <Text style={styles.meta}>
            📦 {used}/{cap}
          </Text>
          <Text style={styles.meta}>Lv {player.level}</Text>
        </View>
        <View style={styles.xpTrack}>
          <View style={[styles.xpFill, { width: `${xpPct * 100}%` }]} />
        </View>
      </LinearGradient>
    </View>
  );
}

function Chip({
  emoji,
  value,
  tint,
}: {
  emoji: string;
  value: string;
  tint: string;
}) {
  return (
    <View style={[styles.chip, { backgroundColor: tint }]}>
      <Text style={styles.chipEmoji}>{emoji}</Text>
      <Text style={styles.chipText}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  townBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    backgroundColor: 'rgba(255,248,230,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#8B5E3C',
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: '#3D2914',
    letterSpacing: -0.6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  town: {
    fontFamily: fonts.bodyExtra,
    fontSize: 14,
    color: '#3D2914',
    flexShrink: 1,
  },
  panel: {
    borderRadius: 16,
    padding: 10,
    borderWidth: 3,
    borderColor: '#8B5E3C',
    gap: 8,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 2,
    borderColor: 'rgba(107,68,35,0.28)',
  },
  chipEmoji: { fontSize: 13 },
  chipText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 13,
    color: palette.ink,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  meta: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#5C4030',
  },
  xpTrack: {
    height: 10,
    borderRadius: 99,
    backgroundColor: 'rgba(80,50,25,0.18)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(80,50,25,0.2)',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#5B8DEF',
    borderRadius: 99,
  },
});
