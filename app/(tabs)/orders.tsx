import { useEffect } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Body,
  Panel,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '@/components/ui';
import { ITEM_META } from '@/constants/catalog';
import { fonts, palette, spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import { useGameStore } from '@/store/gameStore';

export default function OrdersScreen() {
  const orders = useGameStore((s) => s.orders);
  const inventory = useGameStore((s) => s.inventory);
  const fulfillOrder = useGameStore((s) => s.fulfillOrder);
  const refreshExpiredOrders = useGameStore((s) => s.refreshExpiredOrders);

  useEffect(() => {
    refreshExpiredOrders();
    const id = setInterval(() => refreshExpiredOrders(), 15_000);
    return () => clearInterval(id);
  }, [refreshExpiredOrders]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Orders</Title>
        <Subtitle>Deliver goods for coins & XP</Subtitle>

        {orders.map((order) => {
          const remaining = order.expiresAt - Date.now();
          const canFulfill = order.requirements.every(
            (r) => inventory[r.itemId] >= r.qty
          );

          return (
            <Panel key={order.id} style={styles.card}>
              <View style={styles.header}>
                <Text style={styles.customer}>
                  {order.bonus ? '⭐ ' : ''}
                  {order.customer}
                  {order.bonus ? ' (visitor)' : ''}
                </Text>
                <Text style={styles.timer}>
                  {remaining > 0 ? formatDuration(remaining) : 'Expired'}
                </Text>
              </View>
              <View style={styles.reqs}>
                {order.requirements.map((r) => {
                  const meta = ITEM_META[r.itemId];
                  const have = inventory[r.itemId];
                  return (
                    <Text key={r.itemId} style={styles.req}>
                      {meta.emoji} {have}/{r.qty} {meta.name}
                    </Text>
                  );
                })}
              </View>
              <Body muted>
                Reward {order.rewardCoins} coins · {order.rewardXp} XP
              </Body>
              <PrimaryButton
                label={canFulfill ? 'Deliver' : 'Need more goods'}
                disabled={!canFulfill || remaining <= 0}
                onPress={() => {
                  const res = fulfillOrder(order.id);
                  if (!res.ok) Alert.alert('Order', res.message);
                }}
              />
            </Panel>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  card: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customer: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    color: palette.ink,
  },
  timer: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: palette.inkMuted,
  },
  reqs: {
    gap: 4,
  },
  req: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: palette.ink,
  },
});
