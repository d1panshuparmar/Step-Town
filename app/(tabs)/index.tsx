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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CoinToast } from '@/components/CoinToast';
import { TownGrid } from '@/components/TownGrid';
import { TownHUD } from '@/components/TownHUD';
import { palette } from '@/constants/theme';

export default function TownScreen() {
  const insets = useSafeAreaInsets();
  const drift = useSharedValue(0);
  const sunPulse = useSharedValue(1);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    sunPulse.value = withRepeat(
      withTiming(1.08, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [drift, sunPulse]);

  const cloudA = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 48 }],
  }));
  const cloudB = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.value * 36 }],
  }));
  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunPulse.value }],
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 4 }]}>
      <LinearGradient
        colors={['#6EC6E6', '#A8DFF0', '#C8E89A', '#7CB342']}
        locations={[0, 0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.Text style={[styles.sun, sunStyle]}>☀️</Animated.Text>
      <Animated.Text style={[styles.cloud, cloudA, { top: 58, left: 12 }]}>
        ☁️
      </Animated.Text>
      <Animated.Text style={[styles.cloud, cloudB, { top: 96, right: 24 }]}>
        ☁️
      </Animated.Text>
      <View style={styles.hillBack} />
      <View style={styles.hillFront} />
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
    top: 52,
    right: 28,
    fontSize: 40,
  },
  cloud: {
    position: 'absolute',
    fontSize: 36,
    opacity: 0.92,
  },
  hillBack: {
    position: 'absolute',
    left: -60,
    right: -20,
    top: '34%',
    height: 130,
    backgroundColor: '#6FAE4E',
    borderTopLeftRadius: 180,
    borderTopRightRadius: 140,
    opacity: 0.55,
  },
  hillFront: {
    position: 'absolute',
    left: -30,
    right: -70,
    top: '40%',
    height: 140,
    backgroundColor: '#8FBF66',
    borderTopLeftRadius: 120,
    borderTopRightRadius: 180,
    opacity: 0.5,
  },
});
