import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { ITEM_META } from '@/constants/catalog';
import { fonts, palette, radii } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import { useGameStore } from '@/store/gameStore';

export function HelicopterPad({ onClose }: { onClose: () => void }) {
  const orders = useGameStore((s) => s.orders);
  const inventory = useGameStore((s) => s.inventory);
  const fulfillOrder = useGameStore((s) => s.fulfillOrder);
  const refreshExpiredOrders = useGameStore((s) => s.refreshExpiredOrders);
  const visitor = useGameStore((s) => s.visitor);
  const [, setTick] = useState(0);

  useEffect(() => {
    refreshExpiredOrders();
    const id = setInterval(() => {
      refreshExpiredOrders();
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [refreshExpiredOrders]);

  const active = orders.filter((o) => !o.bonus || visitor?.active);
  const now = Date.now();

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>🚁 Helicopter</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>

      <ScrollView style={{ maxHeight: 340 }} contentContainerStyle={styles.list}>
        {active.map((order) => {
          const left = Math.max(0, order.expiresAt - now);
          const canFill = order.requirements.every(
            (r) => (inventory[r.itemId] ?? 0) >= r.qty
          );
          return (
            <View
              key={order.id}
              style={[styles.card, order.bonus && styles.bonusCard]}>
              <Text style={styles.customer}>
                {order.bonus ? '⭐ ' : ''}
                {order.customer}
              </Text>
              <View style={styles.reqs}>
                {order.requirements.map((r) => (
                  <Text key={r.itemId} style={styles.req}>
                    {ITEM_META[r.itemId]?.emoji} {r.qty}
                    {(inventory[r.itemId] ?? 0) < r.qty ? ' ❗' : ''}
                  </Text>
                ))}
              </View>
              <Text style={styles.reward}>
                +{order.rewardCoins}🪙 · +{order.rewardXp} XP ·{' '}
                {left > 0 ? formatDuration(left) : 'Expired'}
              </Text>
              <PrimaryButton
                label={canFill ? 'Fill order' : 'Need goods'}
                disabled={!canFill || left <= 0}
                onPress={() => {
                  const res = fulfillOrder(order.id);
                  if (!res.ok) Alert.alert('Helicopter', res.message);
                }}
              />
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
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    color: palette.ink,
  },
  close: {
    fontFamily: fonts.bodyBold,
    color: '#7A4E2D',
    fontSize: 14,
  },
  list: { gap: 10, paddingVertical: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 2,
    borderColor: '#8B5E3C',
    gap: 8,
  },
  bonusCard: {
    borderColor: '#E07A3D',
    backgroundColor: 'rgba(255, 230, 200, 0.85)',
  },
  customer: {
    fontFamily: fonts.bodyExtra,
    fontSize: 16,
    color: palette.ink,
  },
  reqs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  req: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    backgroundColor: '#FFF8EC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  reward: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: palette.wood,
  },
});
