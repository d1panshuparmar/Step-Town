import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { ITEM_META, barnUpgradeCost } from '@/constants/catalog';
import { fonts, palette, radii } from '@/constants/theme';
import {
  MATERIAL_META,
  barnMaterialCost,
  type MaterialId,
} from '@/lib/townshipExtras';
import type { ItemId } from '@/lib/types';
import {
  inventoryUsed,
  warehouseCapacity,
} from '@/lib/townStats';
import { useGameStore } from '@/store/gameStore';

export function BarnSheet({ onClose }: { onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const inventory = useGameStore((s) => s.inventory);
  const materials = useGameStore((s) => s.materials);
  const plots = useGameStore((s) => s.plots);
  const sellFromBarn = useGameStore((s) => s.sellFromBarn);
  const upgradeBarn = useGameStore((s) => s.upgradeBarn);

  const barnLevel = player.barnLevel ?? 0;
  const used = inventoryUsed(inventory);
  const cap = warehouseCapacity(plots, barnLevel);
  const upgradeCost = barnUpgradeCost(barnLevel);
  const needMats = barnMaterialCost(barnLevel);
  const items = (Object.keys(ITEM_META) as ItemId[]).filter(
    (id) => (inventory[id] ?? 0) > 0
  );

  const matLabel = Object.entries(needMats)
    .map(
      ([m, q]) =>
        `${MATERIAL_META[m as MaterialId]?.emoji}×${q} (have ${materials[m] ?? 0})`
    )
    .join(' · ');

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>🏚️ Barn</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <Text style={styles.cap}>
        Storage {used}/{cap} · Lv {barnLevel}
      </Text>
      <View style={styles.mats}>
        {(Object.keys(MATERIAL_META) as MaterialId[]).map((id) => (
          <Text key={id} style={styles.mat}>
            {MATERIAL_META[id].emoji} {materials[id] ?? 0}
          </Text>
        ))}
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${Math.min(100, (used / Math.max(1, cap)) * 100)}%` },
          ]}
        />
      </View>

      <ScrollView style={{ maxHeight: 240 }} contentContainerStyle={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.empty}>Empty</Text>
        ) : (
          items.map((id) => (
            <View key={id} style={styles.row}>
              <Text style={styles.item}>
                {ITEM_META[id]?.emoji ?? '📦'} {ITEM_META[id]?.name ?? id} ×
                {inventory[id]}
              </Text>
              <Pressable
                style={styles.sellBtn}
                onPress={() => {
                  const res = sellFromBarn(id, 1);
                  if (!res.ok) Alert.alert('Barn', res.message);
                }}>
                <Text style={styles.sellText}>
                  Sell 1 · {ITEM_META[id]?.sellPrice ?? 1}🪙
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {matLabel ? (
        <Text style={styles.upgradeNeed}>{matLabel}</Text>
      ) : null}
      <PrimaryButton
        label={`Upgrade barn · ${upgradeCost} 🪙`}
        onPress={() => {
          const res = upgradeBarn();
          if (!res.ok) Alert.alert('Barn', res.message);
          else Alert.alert('Barn', `Upgraded to level ${barnLevel + 1}!`);
        }}
      />
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
  cap: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: palette.ink,
  },
  empty: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: palette.inkMuted,
  },
  upgradeNeed: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: palette.wood,
  },
  track: {
    height: 12,
    borderRadius: 99,
    backgroundColor: 'rgba(80,50,25,0.15)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(80,50,25,0.2)',
  },
  mats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  mat: { fontFamily: fonts.bodyExtra, fontSize: 13, color: palette.ink },
  fill: {
    height: '100%',
    backgroundColor: '#E07A3D',
    borderRadius: 99,
  },
  list: { gap: 8, paddingVertical: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(107,68,35,0.15)',
    gap: 8,
  },
  item: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: palette.ink,
  },
  sellBtn: {
    backgroundColor: '#FFE08A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C9A227',
  },
  sellText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 12,
    color: palette.ink,
  },
});
