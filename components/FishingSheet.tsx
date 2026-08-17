import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, PrimaryButton, SecondaryButton } from '@/components/ui';
import { fonts, palette } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

export function FishingSheet({ onClose }: { onClose: () => void }) {
  const inventory = useGameStore((s) => s.inventory);
  const player = useGameStore((s) => s.player);
  const castFishingRod = useGameStore((s) => s.castFishingRod);
  const fish = inventory.fish ?? 0;
  const corn = inventory.corn ?? 0;

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>🎣 Fishing Spot</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <Body muted>
        Cast with 1 corn (preferred) or 5 coins. ~55% chance to catch a fish.
      </Body>
      <Text style={styles.stat}>🐟 In barn: {fish}</Text>
      <Text style={styles.stat}>Lifetime caught: {player.fishCaught ?? 0}</Text>
      <Text style={styles.stat}>
        Bait: 🌽 {corn} · 🪙 {player.coins}
      </Text>

      <PrimaryButton
        label="Cast rod"
        onPress={() => {
          const res = castFishingRod();
          if (!res.ok) Alert.alert('Fishing', res.message);
          else Alert.alert(res.caught ? 'Catch!' : 'Miss', res.message);
        }}
      />
      <SecondaryButton label="Done" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { gap: 12 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 24,
    color: palette.ink,
  },
  close: {
    fontFamily: fonts.bodyBold,
    color: palette.inkMuted,
    fontSize: 14,
  },
  stat: {
    fontFamily: fonts.bodyExtra,
    fontSize: 16,
    color: palette.ink,
  },
});
