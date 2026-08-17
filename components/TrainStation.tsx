import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { ITEM_META } from '@/constants/catalog';
import { fonts, palette, radii } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import { MATERIAL_META } from '@/lib/townshipExtras';
import { useGameStore } from '@/store/gameStore';

export function TrainStation({ onClose }: { onClose: () => void }) {
  const trains = useGameStore((s) => s.trains);
  const materials = useGameStore((s) => s.materials);
  const inventory = useGameStore((s) => s.inventory);
  const loadTrainCar = useGameStore((s) => s.loadTrainCar);
  const collectTrainCar = useGameStore((s) => s.collectTrainCar);
  const refreshTrains = useGameStore((s) => s.refreshTrains);
  const [, setTick] = useState(0);

  useEffect(() => {
    refreshTrains();
    const id = setInterval(() => {
      refreshTrains();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [refreshTrains]);

  const now = Date.now();

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>🚂 Train Station</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <View style={styles.mats}>
        {(Object.keys(MATERIAL_META) as (keyof typeof MATERIAL_META)[]).map(
          (id) => (
            <Text key={id} style={styles.mat}>
              {MATERIAL_META[id].emoji} {materials[id] ?? 0}
            </Text>
          )
        )}
      </View>
      <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={styles.list}>
        {[...trains]
          .sort((a, b) => a.slot - b.slot)
          .map((car) => {
            const canLoad =
              car.status === 'loading' &&
              car.requirements.every(
                (r) => (inventory[r.itemId] ?? 0) >= r.qty
              );
            const left =
              car.status === 'traveling' && car.returnsAt
                ? Math.max(0, car.returnsAt - now)
                : 0;
            return (
              <View key={car.id} style={styles.card}>
                <Text style={styles.carTitle}>Car {car.slot + 1}</Text>
                <View style={styles.reqs}>
                  {car.requirements.map((r) => (
                    <Text key={r.itemId} style={styles.req}>
                      {ITEM_META[r.itemId]?.emoji}×{r.qty}
                    </Text>
                  ))}
                </View>
                <Text style={styles.reward}>
                  Rewards:{' '}
                  {Object.entries(car.rewards)
                    .map(
                      ([m, q]) =>
                        `${MATERIAL_META[m as keyof typeof MATERIAL_META]?.emoji}×${q}`
                    )
                    .join(' ')}
                </Text>
                {car.status === 'loading' && (
                  <PrimaryButton
                    label={canLoad ? 'Send train' : 'Need goods'}
                    disabled={!canLoad}
                    onPress={() => {
                      const res = loadTrainCar(car.slot);
                      if (!res.ok) Alert.alert('Train', res.message);
                    }}
                  />
                )}
                {car.status === 'traveling' && (
                  <Text style={styles.reward}>
                    Returning · {formatDuration(left)}
                  </Text>
                )}
                {car.status === 'ready' && (
                  <PrimaryButton
                    label="Collect materials"
                    onPress={() => {
                      const res = collectTrainCar(car.slot);
                      if (!res.ok) Alert.alert('Train', res.message);
                    }}
                  />
                )}
              </View>
            );
          })}
      </ScrollView>
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
  mats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mat: { fontFamily: fonts.bodyExtra, fontSize: 14, color: palette.ink },
  list: { gap: 10, paddingVertical: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 2,
    borderColor: '#8B5E3C',
    gap: 8,
  },
  carTitle: { fontFamily: fonts.bodyExtra, fontSize: 16, color: palette.ink },
  reqs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  req: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    backgroundColor: '#FFF8EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reward: { fontFamily: fonts.bodyBold, fontSize: 13, color: palette.wood },
});
