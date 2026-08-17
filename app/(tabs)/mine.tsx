import { Alert, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import {
  Panel,
  PrimaryButton,
  Screen,
  Title,
} from '@/components/ui';
import { MINE_ENERGY_PER_DIG } from '@/constants/catalog';
import { fonts, palette, spacing } from '@/constants/theme';
import { formatNumber } from '@/lib/date';
import { mineEnergyAvailable } from '@/lib/townStats';
import { useGameStore } from '@/store/gameStore';

export default function MineScreen() {
  const player = useGameStore((s) => s.player);
  const inventory = useGameStore((s) => s.inventory);
  const digMine = useGameStore((s) => s.digMine);
  const energy = mineEnergyAvailable(player.todaySteps, player.mineEnergySpent);

  return (
    <Screen>
      <LinearGradient
        colors={['#5C4E3A', '#2C2416']}
        style={styles.hero}>
        <Text style={styles.pick}>⛏️</Text>
        <Text style={styles.heroTitle}>Step Mine</Text>
      </LinearGradient>

      <Title>Mine</Title>

      <Panel style={styles.block}>
        <Text style={styles.stat}>
          Energy {formatNumber(energy)} · dig {MINE_ENERGY_PER_DIG} · ore {inventory.ore}
        </Text>
        <PrimaryButton
          label="Dig"
          onPress={() => {
            const res = digMine();
            if (!res.ok) Alert.alert('Mine', res.message);
            else if (res.reward === 'gem') Alert.alert('Lucky!', 'You found a gem!');
            else if (res.reward === 'coins') Alert.alert('Strike!', '+25 coins');
            else Alert.alert('Dig', 'You found ore.');
          }}
        />
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  pick: { fontSize: 40 },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: palette.cream,
  },
  block: { gap: 12, marginTop: spacing.md },
  stat: {
    fontFamily: fonts.bodyExtra,
    fontSize: 16,
    color: palette.ink,
  },
});
