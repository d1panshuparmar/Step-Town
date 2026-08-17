import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Weather } from '@/lib/atmosphere';

/** Soft weather particles — keep subtle so the meadow stays the hero. */
export function WeatherFX({ weather }: { weather: Weather }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (weather !== 'rain' && weather !== 'snow') return;
    const id = setInterval(() => setTick((t) => t + 1), 520);
    return () => clearInterval(id);
  }, [weather]);

  if (weather === 'sunny') return null;

  if (weather === 'cloudy') {
    return (
      <View style={styles.wrap} pointerEvents="none">
        <Text style={[styles.cloud, { left: '10%', top: 16, opacity: 0.35 }]}>☁️</Text>
        <Text style={[styles.cloud, { left: '58%', top: 10, opacity: 0.28 }]}>☁️</Text>
      </View>
    );
  }

  const glyph = weather === 'rain' ? '·' : '❄';
  const drops = Array.from({ length: 10 }, (_, i) => {
    const seed = (tick + i * 7) % 20;
    return {
      key: i,
      left: `${(i * 9 + seed) % 94}%`,
      top: 8 + ((tick * 8 + i * 11) % 55),
      opacity: weather === 'snow' ? 0.35 : 0.22,
    };
  });

  return (
    <View style={styles.wrap} pointerEvents="none">
      {drops.map((d) => (
        <Text
          key={d.key}
          style={[
            styles.drop,
            {
              left: d.left as `${number}%`,
              top: d.top,
              opacity: d.opacity,
              fontSize: weather === 'snow' ? 10 : 14,
            },
          ]}>
          {glyph}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 12,
  },
  cloud: {
    position: 'absolute',
    fontSize: 34,
  },
  drop: {
    position: 'absolute',
    color: '#FFF',
  },
});
