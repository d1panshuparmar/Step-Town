import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  Body,
  Chip,
  Panel,
  PrimaryButton,
  Screen,
  Subtitle,
  Title,
} from '@/components/ui';
import { BUILDINGS, CROPS, ITEM_META } from '@/constants/catalog';
import { fonts, palette, spacing } from '@/constants/theme';
import type { BuildingId, CropId, ItemId } from '@/lib/types';
import {
  inventoryUsed,
  warehouseCapacity,
} from '@/lib/townStats';
import { useGameStore } from '@/store/gameStore';

export default function ShopScreen() {
  const player = useGameStore((s) => s.player);
  const inventory = useGameStore((s) => s.inventory);
  const plots = useGameStore((s) => s.plots);
  const setPlaceMode = useGameStore((s) => s.setPlaceMode);
  const used = inventoryUsed(inventory);
  const cap = warehouseCapacity(plots);

  const selectCrop = (cropId: CropId) => {
    const def = CROPS[cropId];
    if (player.level < def.unlockLevel) {
      Alert.alert('Locked', `Reach town level ${def.unlockLevel}`);
      return;
    }
    setPlaceMode('crop', cropId);
    router.push('/(tabs)');
  };

  const selectBuilding = (buildingId: BuildingId) => {
    const def = BUILDINGS[buildingId];
    if (player.level < def.unlockLevel) {
      Alert.alert('Locked', `Reach town level ${def.unlockLevel}`);
      return;
    }
    setPlaceMode('building', buildingId);
    router.push('/(tabs)');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Shop</Title>
        <Subtitle>Seeds, factories & land</Subtitle>

        <Panel style={styles.inv}>
          <Text style={styles.section}>
            Warehouse {used}/{cap}
          </Text>
          <View style={styles.chips}>
            {(Object.keys(ITEM_META) as ItemId[]).map((id) => (
              <Chip key={id} label={`${ITEM_META[id].emoji} ${inventory[id]}`} />
            ))}
          </View>
        </Panel>

        <Text style={styles.section}>Seeds</Text>
        {Object.values(CROPS).map((crop) => {
          const locked = player.level < crop.unlockLevel;
          return (
            <Panel key={crop.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{crop.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{crop.name}</Text>
                  <Body muted>
                    {Math.round(crop.growMs / 1000)}s · +{crop.yieldQty}
                    {locked ? ` · Lv ${crop.unlockLevel}` : ''}
                  </Body>
                </View>
                <Text style={styles.price}>{crop.seedCost}🪙</Text>
              </View>
              <PrimaryButton
                label={locked ? 'Locked' : 'Plant on town'}
                disabled={locked}
                onPress={() => selectCrop(crop.id)}
              />
            </Panel>
          );
        })}

        <Text style={styles.section}>Buildings</Text>
        {Object.values(BUILDINGS).map((b) => {
          const locked = player.level < b.unlockLevel;
          return (
            <Panel key={b.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.emoji}>{b.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{b.name}</Text>
                  <Body muted>
                    {b.description}
                    {locked ? ` · Lv ${b.unlockLevel}` : ''}
                  </Body>
                </View>
                <Text style={styles.price}>{b.cost}🪙</Text>
              </View>
              <PrimaryButton
                label={locked ? 'Locked' : 'Place on town'}
                disabled={locked}
                onPress={() => selectBuilding(b.id)}
              />
            </Panel>
          );
        })}

        <Panel style={styles.card}>
          <Text style={styles.name}>Expand land</Text>
          <Body muted>Unlock neighboring plots with coins and town level.</Body>
          <PrimaryButton
            label="Expand mode"
            onPress={() => {
              setPlaceMode('expand');
              router.push('/(tabs)');
            }}
          />
        </Panel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  inv: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    color: palette.ink,
  },
  card: { gap: 12 },
  cardTop: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  emoji: { fontSize: 32 },
  name: {
    fontFamily: fonts.bodyExtra,
    fontSize: 17,
    color: palette.ink,
  },
  price: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: palette.coinDark,
  },
});
