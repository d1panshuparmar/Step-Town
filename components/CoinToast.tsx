import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

import { fonts, palette, radii } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

export function CoinToast() {
  const amount = useGameStore((s) => s.lastCoinToast);
  const clear = useGameStore((s) => s.clearCoinToast);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (amount <= 0) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.delay(1100),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        useNativeDriver: true,
      }),
    ]).start();
    const t = setTimeout(() => clear(), 1800);
    return () => clearTimeout(t);
  }, [amount, clear, opacity]);

  if (amount <= 0) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.text}>+{amount} Step Coins</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    backgroundColor: palette.coin,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    zIndex: 50,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  text: {
    fontFamily: fonts.bodyExtra,
    color: palette.ink,
    fontSize: 15,
  },
});
