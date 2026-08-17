import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen, Title } from '@/components/ui';
import { ITEM_META } from '@/constants/catalog';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { buyPrice, MARKET_ITEMS, sellPrice } from '@/lib/marketplace';
import { useGameStore } from '@/store/gameStore';

export default function MarketScreen() {
  const inventory = useGameStore((s) => s.inventory);
  const coins = useGameStore((s) => s.player.coins);
  const buyFromMarket = useGameStore((s) => s.buyFromMarket);
  const sellToMarket = useGameStore((s) => s.sellToMarket);

  return (
    <Screen>
      <Title>Market</Title>
      <Text style={styles.sub}>Prices shift through the day · 🪙 {coins}</Text>
      <ScrollView contentContainerStyle={styles.list}>
        {MARKET_ITEMS.map((id) => {
          const meta = ITEM_META[id];
          const have = inventory[id] ?? 0;
          const buy = buyPrice(id);
          const sell = sellPrice(id);
          return (
            <View key={id} style={styles.card}>
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{meta.name}</Text>
                <Text style={styles.meta}>
                  Buy {buy} · Sell {sell} · Have {have}
                </Text>
              </View>
              <Pressable
                style={styles.btnBuy}
                onPress={() => {
                  const res = buyFromMarket(id, 1);
                  if (!res.ok) Alert.alert('Market', res.message);
                }}>
                <Text style={styles.btnText}>Buy</Text>
              </Pressable>
              <Pressable
                style={styles.btnSell}
                onPress={() => {
                  const res = sellToMarket(id, 1);
                  if (!res.ok) Alert.alert('Market', res.message);
                }}>
                <Text style={styles.btnText}>Sell</Text>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sub: {
    fontFamily: fonts.body,
    color: palette.inkMuted,
    marginBottom: spacing.sm,
  },
  list: { gap: 8, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 2,
    borderColor: palette.woodLight,
  },
  emoji: { fontSize: 28 },
  name: { fontFamily: fonts.bodyExtra, fontSize: 15, color: palette.ink },
  meta: { fontFamily: fonts.body, fontSize: 12, color: palette.inkMuted },
  btnBuy: {
    backgroundColor: '#3D8FE8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnSell: {
    backgroundColor: '#5ECF4A',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
  },
  btnText: { fontFamily: fonts.bodyExtra, color: '#FFF', fontSize: 12 },
});
