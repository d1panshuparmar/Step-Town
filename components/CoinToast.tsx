import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { fonts, palette, radii } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

export function CoinToast() {
  const amount = useGameStore((s) => s.lastCoinToast);
  const clear = useGameStore((s) => s.clearCoinToast);
  const opacity = useSharedValue(0);
  const y = useSharedValue(-12);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (amount <= 0) return;
    opacity.value = 0;
    y.value = -12;
    scale.value = 0.86;
    opacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(1, { duration: 1100 }),
      withTiming(0, { duration: 280, easing: Easing.in(Easing.quad) })
    );
    y.value = withSequence(
      withSpring(0, { damping: 12, stiffness: 160 }),
      withTiming(0, { duration: 1100 }),
      withTiming(-10, { duration: 280 })
    );
    scale.value = withSequence(
      withSpring(1.06, { damping: 10, stiffness: 180 }),
      withSpring(1, { damping: 12, stiffness: 160 }),
      withTiming(0.96, { duration: 280 })
    );
    const t = setTimeout(() => clear(), 1700);
    return () => clearTimeout(t);
  }, [amount, clear, opacity, scale, y]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: y.value }, { scale: scale.value }],
  }));

  if (amount <= 0) return null;

  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="none">
      <Text style={styles.text}>+{amount} Step Coins</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: 118,
    alignSelf: 'center',
    backgroundColor: palette.coin,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.md,
    zIndex: 50,
    borderWidth: 2,
    borderColor: '#C9A227',
  },
  text: {
    fontFamily: fonts.bodyExtra,
    color: palette.ink,
    fontSize: 15,
  },
});
