import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { fonts } from '@/constants/theme';
import { xpForLevel } from '@/constants/catalog';
import { formatNumber } from '@/lib/date';
import { townHappiness, townPopulation } from '@/lib/townStats';
import { useGameStore } from '@/store/gameStore';
import { useStepSync } from '@/hooks/useStepSync';

/** Playrix Township–style floating HUD chrome. */
export function TownHUD() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const player = useGameStore((s) => s.player);
  const plots = useGameStore((s) => s.plots);
  const zooOwned = useGameStore((s) => s.zooOwned);
  const { liveSteps } = useStepSync();
  const pop = townPopulation(plots);
  const happy = townHappiness(plots, zooOwned);
  const popCap = Math.max(pop + 10, 20 + player.level * 12);
  const stepsShown = Math.max(player.todaySteps, liveSteps);
  const need = xpForLevel(player.level);
  const xpPct = Math.min(1, player.xp / Math.max(1, need));

  return (
    <View
      style={[styles.wrap, { paddingTop: insets.top + 6 }]}
      pointerEvents="box-none">
      <View style={styles.row} pointerEvents="box-none">
        <View style={styles.leftCol}>
          <View style={styles.levelStar}>
            <View style={styles.starInner}>
              <Text style={styles.starGlyph}>★</Text>
              <Text style={styles.levelNum}>{player.level}</Text>
            </View>
          </View>
          <View style={styles.xpTrack}>
            <View style={[styles.xpFill, { width: `${xpPct * 100}%` }]} />
          </View>
          <View style={styles.popPill}>
            <Text style={styles.popIcon}>👥</Text>
            <Text style={styles.popText}>
              {pop}/{popCap}
            </Text>
          </View>
          <View style={styles.happyPill}>
            <Text style={styles.popIcon}>😊</Text>
            <Text style={styles.popText}>{happy}</Text>
          </View>
        </View>

        <View style={styles.rightCol}>
          <CurrencyPill
            emoji="🪙"
            value={formatNumber(player.coins)}
            onPlus={() => router.push('/(tabs)/market')}
          />
          <CurrencyPill
            emoji="💎"
            value={formatNumber(player.gems)}
            onPlus={() => router.push('/(tabs)/shop')}
          />
          <CurrencyPill emoji="👟" value={formatNumber(stepsShown)} compact />
        </View>
      </View>
    </View>
  );
}

function CurrencyPill({
  emoji,
  value,
  compact,
  onPlus,
}: {
  emoji: string;
  value: string;
  compact?: boolean;
  onPlus?: () => void;
}) {
  return (
    <View style={[styles.currency, compact && styles.currencyCompact]}>
      <Text style={styles.currencyEmoji}>{emoji}</Text>
      <Text style={styles.currencyValue} numberOfLines={1}>
        {value}
      </Text>
      {onPlus ? (
        <Pressable style={styles.plusBtn} onPress={onPlus}>
          <Text style={styles.plusText}>+</Text>
        </Pressable>
      ) : (
        <View style={[styles.plusBtn, styles.plusGhost]}>
          <Text style={styles.plusText}>+</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftCol: { gap: 5, alignItems: 'flex-start' },
  rightCol: { gap: 5, alignItems: 'flex-end' },
  levelStar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3D8FE8',
    borderWidth: 3.5,
    borderColor: '#FFF8E7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  starInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  starGlyph: {
    position: 'absolute',
    fontSize: 44,
    color: '#6BB0F8',
    opacity: 0.5,
  },
  levelNum: {
    fontFamily: fonts.bodyExtra,
    fontSize: 23,
    color: '#FFF',
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  xpTrack: {
    width: 56,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
    marginTop: -2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FFE08A',
    borderRadius: 3,
  },
  popPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(45,120,210,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  happyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,150,50,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  popIcon: { fontSize: 12 },
  popText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 13,
    color: '#FFF',
  },
  currency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingLeft: 8,
    paddingRight: 4,
    paddingVertical: 4,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#FFF',
    minWidth: 92,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  currencyCompact: { minWidth: 80 },
  currencyEmoji: { fontSize: 14 },
  currencyValue: {
    flex: 1,
    fontFamily: fonts.bodyExtra,
    fontSize: 14,
    color: '#2A2A2A',
  },
  plusBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#5ECF4A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#3FA832',
  },
  plusGhost: { opacity: 0.55 },
  plusText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 14,
    color: '#FFF',
    marginTop: -1,
  },
});
