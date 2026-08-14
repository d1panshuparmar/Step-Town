import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CoinToast } from '@/components/CoinToast';
import { TownGrid } from '@/components/TownGrid';
import { TownHUD } from '@/components/TownHUD';
import { palette } from '@/constants/theme';

export default function TownScreen() {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [drift]);

  const cloudA = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 40 }],
  }));
  const cloudB = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.value * 30 }],
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.skyTop, '#B5E0F0', '#DFF0C8']}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.sun}>☀️</Text>
      <Animated.Text style={[styles.cloud, cloudA, { top: 54, left: 18 }]}>
        ☁️
      </Animated.Text>
      <Animated.Text style={[styles.cloud, cloudB, { top: 90, right: 28 }]}>
        ☁️
      </Animated.Text>
      <View style={styles.hill} />
      <TownHUD />
      <TownGrid />
      <CoinToast />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.skyBottom,
  },
  sun: {
    position: 'absolute',
    top: 48,
    right: 28,
    fontSize: 36,
  },
  cloud: {
    position: 'absolute',
    fontSize: 34,
    opacity: 0.9,
  },
  hill: {
    position: 'absolute',
    left: -50,
    right: -50,
    top: '36%',
    height: 120,
    backgroundColor: '#8FBF66',
    borderTopLeftRadius: 160,
    borderTopRightRadius: 160,
    opacity: 0.55,
  },
});
