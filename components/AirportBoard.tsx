import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { ITEM_META } from '@/constants/catalog';
import { fonts, palette, radii } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import { useGameStore } from '@/store/gameStore';

export function AirportBoard({ onClose }: { onClose: () => void }) {
  const airport = useGameStore((s) => s.airport);
  const inventory = useGameStore((s) => s.inventory);
  const fillAirportCrate = useGameStore((s) => s.fillAirportCrate);
  const refreshAirport = useGameStore((s) => s.refreshAirport);
  const [, setTick] = useState(0);

  useEffect(() => {
    refreshAirport();
    const id = setInterval(() => {
      refreshAirport();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [refreshAirport]);

  if (!airport) {
    return (
      <View style={styles.inner}>
        <Text style={styles.title}>✈️ Airport</Text>
        <SecondaryButton label="Close" onPress={onClose} />
      </View>
    );
  }

  const left = Math.max(0, airport.expiresAt - Date.now());

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>✈️ Airport</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <Text style={styles.timer}>{formatDuration(left)}</Text>
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.row}>
          <Text style={styles.rowLabel}>Row {row + 1}</Text>
          {airport.crates
            .filter((c) => c.row === row)
            .map((crate) => {
              const can =
                !crate.filled &&
                (inventory[crate.requirement.itemId] ?? 0) >=
                  crate.requirement.qty;
              return (
                <Pressable
                  key={crate.id}
                  style={[
                    styles.crate,
                    crate.filled && styles.crateFilled,
                    !can && !crate.filled && styles.crateLocked,
                  ]}
                  onPress={() => {
                    if (crate.filled) return;
                    const res = fillAirportCrate(crate.id);
                    if (!res.ok) Alert.alert('Airport', res.message);
                  }}>
                  <Text style={styles.crateEmoji}>
                    {crate.filled
                      ? '✅'
                      : ITEM_META[crate.requirement.itemId]?.emoji}
                  </Text>
                  {!crate.filled && (
                    <Text style={styles.crateQty}>×{crate.requirement.qty}</Text>
                  )}
                  <Text style={styles.crateReward}>
                    +{crate.rewardCoins}🪙
                    {crate.rewardGems ? ` +${crate.rewardGems}💎` : ''}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      ))}
      <PrimaryButton label="Refresh board" onPress={() => refreshAirport()} />
      <SecondaryButton label="Done" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { gap: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontFamily: fonts.displaySoft, fontSize: 22, color: palette.ink },
  close: { fontFamily: fonts.bodyBold, color: '#7A4E2D', fontSize: 14 },
  timer: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: palette.wood,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowLabel: {
    fontFamily: fonts.bodyExtra,
    width: 48,
    fontSize: 12,
    color: palette.inkMuted,
  },
  crate: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#8B5E3C',
    padding: 10,
    alignItems: 'center',
    gap: 2,
  },
  crateFilled: { backgroundColor: '#DFF5D4', borderColor: '#5AA32E' },
  crateLocked: { opacity: 0.7 },
  crateEmoji: { fontSize: 22 },
  crateQty: { fontFamily: fonts.bodyBold, fontSize: 13, color: palette.ink },
  crateReward: {
    fontFamily: fonts.bodyExtra,
    fontSize: 11,
    color: palette.wood,
  },
});
