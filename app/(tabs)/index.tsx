import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { CoinToast } from '@/components/CoinToast';
import { OfflineWelcome } from '@/components/OfflineWelcome';
import { TownGrid } from '@/components/TownGrid';
import { TownHUD } from '@/components/TownHUD';
import { WeatherFX } from '@/components/WeatherFX';
import { getAtmosphere } from '@/lib/atmosphere';

/** Classic bright Township day sky; keep dusk/night moods without weather labels. */
const DAY_SKY: [string, string, string, string, string] = [
  '#6EC8F0',
  '#8ED8A8',
  '#A8E060',
  '#5BC93A',
  '#52B832',
];

export default function TownScreen() {
  const [atm, setAtm] = useState(getAtmosphere());

  useEffect(() => {
    const id = setInterval(() => setAtm(getAtmosphere()), 60_000);
    return () => clearInterval(id);
  }, []);

  const sky = atm.phase === 'day' ? DAY_SKY : atm.skyColors;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={sky}
        locations={[0, 0.22, 0.42, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      {atm.overlay !== 'transparent' && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: atm.overlay }]}
        />
      )}
      <WeatherFX weather={atm.weather} />
      <TownHUD />
      <TownGrid atmospherePhase={atm.phase} />
      <CoinToast />
      <OfflineWelcome />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
