import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import {
  Body,
  Chip,
  Panel,
  PrimaryButton,
  Screen,
  Title,
} from '@/components/ui';
import { BUILDINGS, CROPS, ITEM_META } from '@/constants/catalog';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import type { BuildingId, BuildingDef, CropId, ItemId } from '@/lib/types';
import {
  inventoryUsed,
  townPopulation,
  warehouseCapacity,
} from '@/lib/townStats';
import { useGameStore } from '@/store/gameStore';

type ShopTab =
  | 'fields'
  | 'factories'
  | 'houses'
  | 'services'
  | 'decor'
  | 'roads'
  | 'expand'
  | 'tools';

export default function ShopScreen() {
  const player = useGameStore((s) => s.player);
  const inventory = useGameStore((s) => s.inventory);
  const plots = useGameStore((s) => s.plots);
  const setPlaceMode = useGameStore((s) => s.setPlaceMode);
  const used = inventoryUsed(inventory);
  const cap = warehouseCapacity(plots, player.barnLevel ?? 0);
  const pop = townPopulation(plots);
  const [tab, setTab] = useState<ShopTab>('fields');

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
    if ((def.minPopulation ?? 0) > pop) {
      Alert.alert(
        'Population',
        `Need ${def.minPopulation} townsfolk (build more cottages).`
      );
      return;
    }
    setPlaceMode('building', buildingId);
    router.push('/(tabs)');
  };

  const buildingsFor = (...kinds: BuildingDef['kind'][]) =>
    Object.values(BUILDINGS).filter((b) => kinds.includes(b.kind));

  const renderBuildingCards = (list: BuildingDef[]) =>
    list.map((b) => {
      const locked =
        player.level < b.unlockLevel || (b.minPopulation ?? 0) > pop;
      return (
        <Panel key={b.id} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.emoji}>{b.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{b.name}</Text>
              <Body muted>
                {b.description}
                {b.minPopulation ? ` · Need 👥${b.minPopulation}` : ''}
                {player.level < b.unlockLevel
                  ? ` · Lv ${b.unlockLevel}`
                  : ''}
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
    });

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Title>Shop</Title>

        <Panel style={styles.inv}>
          <Text style={styles.section}>
            Barn {used}/{cap} · 👥 {pop}
          </Text>
          <View style={styles.chips}>
            {(Object.keys(ITEM_META) as ItemId[])
              .filter((id) => (inventory[id] ?? 0) > 0)
              .map((id) => (
                <Chip
                  key={id}
                  label={`${ITEM_META[id].emoji} ${inventory[id]}`}
                />
              ))}
          </View>
        </Panel>

        <View style={styles.tabs}>
          {(
            [
              ['fields', 'Fields'],
              ['factories', 'Factories'],
              ['houses', 'Houses'],
              ['services', 'Services'],
              ['decor', 'Decor'],
              ['roads', 'Roads'],
              ['expand', 'Expand'],
              ['tools', 'Tools'],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              style={[styles.tab, tab === id && styles.tabOn]}
              onPress={() => setTab(id)}>
              <Text style={[styles.tabText, tab === id && styles.tabTextOn]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'fields' &&
          Object.values(CROPS).map((crop) => {
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

        {tab === 'factories' && renderBuildingCards(buildingsFor('factory'))}

        {tab === 'houses' &&
          renderBuildingCards(buildingsFor('home', 'storage'))}

        {tab === 'services' && renderBuildingCards(buildingsFor('service'))}

        {tab === 'decor' && renderBuildingCards(buildingsFor('decor'))}

        {tab === 'roads' && renderBuildingCards(buildingsFor('road'))}

        {tab === 'expand' && (
          <Panel style={styles.card}>
            <Text style={styles.name}>🗺️ Expand land</Text>
            <Body muted>Unlock fogged plots</Body>
            <PrimaryButton
              label="Expand mode"
              onPress={() => {
                setPlaceMode('expand');
                router.push('/(tabs)');
              }}
            />
          </Panel>
        )}

        {tab === 'tools' && (
          <>
            <Panel style={styles.card}>
              <Text style={styles.name}>↔️ Move building</Text>
              <Body muted>Pick up, then place</Body>
              <PrimaryButton
                label="Move mode"
                onPress={() => {
                  setPlaceMode('move');
                  router.push('/(tabs)');
                }}
              />
            </Panel>
            <Panel style={styles.card}>
              <Text style={styles.name}>💸 Sell building</Text>
              <Body muted>~40% refund</Body>
              <PrimaryButton
                label="Sell mode"
                onPress={() => {
                  setPlaceMode('sell');
                  router.push('/(tabs)');
                }}
              />
            </Panel>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  inv: { gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#C4A484',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  tabOn: {
    backgroundColor: '#F6E2B8',
    borderColor: '#8B5E3C',
  },
  tabText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: palette.inkMuted,
  },
  tabTextOn: { color: palette.ink },
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
