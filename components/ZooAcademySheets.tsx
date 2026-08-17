import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { BUILDINGS } from '@/constants/catalog';
import { fonts, palette, radii } from '@/constants/theme';
import {
  ACADEMY_INGOT_COST,
  MATERIAL_META,
  ZOO_ANIMALS,
  factoryTimeMult,
} from '@/lib/townshipExtras';
import type { BuildingId } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

export function ZooSheet({ onClose }: { onClose: () => void }) {
  const player = useGameStore((s) => s.player);
  const zooOwned = useGameStore((s) => s.zooOwned);
  const buyZooAnimal = useGameStore((s) => s.buyZooAnimal);

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>🦁 Town Zoo</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={styles.list}>
        {ZOO_ANIMALS.map((a) => {
          const owned = zooOwned.includes(a.id);
          const locked = player.level < a.unlockLevel;
          return (
            <View key={a.id} style={styles.card}>
              <Text style={styles.emoji}>{a.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.name}</Text>
                <Text style={styles.meta}>
                  +{a.happiness} 😊
                  {locked ? ` · Lv ${a.unlockLevel}` : ''}
                </Text>
              </View>
              {owned ? (
                <Text style={styles.owned}>In zoo</Text>
              ) : (
                <PrimaryButton
                  label={`${a.cost}🪙`}
                  disabled={locked}
                  onPress={() => {
                    const res = buyZooAnimal(a.id);
                    if (!res.ok) Alert.alert('Zoo', res.message);
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

export function AcademySheet({ onClose }: { onClose: () => void }) {
  const academyLevels = useGameStore((s) => s.academyLevels);
  const materials = useGameStore((s) => s.materials);
  const upgradeAcademy = useGameStore((s) => s.upgradeAcademy);
  const factories = Object.values(BUILDINGS).filter((b) => b.kind === 'factory');

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>🏫 Academy</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <Text style={styles.meta}>
        {MATERIAL_META.ingot.emoji} {materials.ingot ?? 0}
      </Text>
      <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={styles.list}>
        {factories.map((f) => {
          const lvl = academyLevels[f.id] ?? 0;
          const mult = factoryTimeMult(lvl);
          return (
            <View key={f.id} style={styles.card}>
              <Text style={styles.emoji}>{f.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{f.name}</Text>
                <Text style={styles.meta}>
                  Lv {lvl}/10 · {Math.round(mult * 100)}% time
                </Text>
              </View>
              <PrimaryButton
                label={`${ACADEMY_INGOT_COST}${MATERIAL_META.ingot.emoji}`}
                disabled={lvl >= 10}
                onPress={() => {
                  const res = upgradeAcademy(f.id as BuildingId);
                  if (!res.ok) Alert.alert('Academy', res.message);
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
  title: { fontFamily: fonts.displaySoft, fontSize: 22, color: palette.ink },
  close: { fontFamily: fonts.bodyBold, color: '#7A4E2D', fontSize: 14 },
  list: { gap: 8, paddingVertical: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderRadius: radii.md,
    padding: 10,
    borderWidth: 2,
    borderColor: '#8B5E3C',
  },
  emoji: { fontSize: 28 },
  name: { fontFamily: fonts.bodyExtra, fontSize: 15, color: palette.ink },
  meta: { fontFamily: fonts.body, fontSize: 13, color: palette.inkMuted },
  owned: { fontFamily: fonts.bodyBold, color: '#5AA32E', fontSize: 13 },
});
