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

/** Township-inspired sky + rolling hills behind the isometric town */
export default function TownScreen() {
  const insets = useSafeAreaInsets();
  const drift = useSharedValue(0);
  const sunPulse = useSharedValue(1);
  const bird = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    sunPulse.value = withRepeat(
      withTiming(1.1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    bird.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.linear }),
      -1,
      false
    );
  }, [drift, sunPulse, bird]);

  const cloudA = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 56 }],
  }));
  const cloudB = useAnimatedStyle(() => ({
    transform: [{ translateX: -drift.value * 40 }],
  }));
  const cloudC = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 28 }],
  }));
  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sunPulse.value }],
  }));
  const birdStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: bird.value * 220 - 40 }],
    opacity: 0.75,
  }));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 4 }]}>
      <LinearGradient
        colors={['#5EB8E8', '#8ED4F2', '#B8E8A0', '#6FBF4A', '#4F9E32']}
        locations={[0, 0.28, 0.55, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.Text style={[styles.sun, sunStyle]}>☀️</Animated.Text>
      <Animated.Text style={[styles.cloud, cloudA, { top: 54, left: 8 }]}>
        ☁️
      </Animated.Text>
      <Animated.Text style={[styles.cloud, cloudB, { top: 88, right: 18 }]}>
        ☁️
      </Animated.Text>
      <Animated.Text
        style={[styles.cloudSmall, cloudC, { top: 118, left: '38%' }]}>
        ☁️
      </Animated.Text>
      <Animated.Text style={[styles.bird, birdStyle]}>🕊️</Animated.Text>

      <View style={styles.hillFar} />
      <View style={styles.hillMid} />
      <View style={styles.hillNear} />
      <View style={styles.treeLeft}>
        <Text style={styles.treeEmoji}>🌲</Text>
      </View>
      <View style={styles.treeRight}>
        <Text style={styles.treeEmoji}>🌳</Text>
      </View>

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
    right: 26,
    fontSize: 44,
  },
  cloud: {
    position: 'absolute',
    fontSize: 38,
    opacity: 0.95,
  },
  cloudSmall: {
    position: 'absolute',
    fontSize: 26,
    opacity: 0.85,
  },
  bird: {
    position: 'absolute',
    top: 72,
    left: 0,
    fontSize: 16,
  },
  hillFar: {
    position: 'absolute',
    left: -80,
    right: -40,
    top: '30%',
    height: 120,
    backgroundColor: '#7BC45A',
    borderTopLeftRadius: 200,
    borderTopRightRadius: 160,
    opacity: 0.45,
  },
  hillMid: {
    position: 'absolute',
    left: -50,
    right: -90,
    top: '36%',
    height: 140,
    backgroundColor: '#69B348',
    borderTopLeftRadius: 140,
    borderTopRightRadius: 200,
    opacity: 0.5,
  },
  hillNear: {
    position: 'absolute',
    left: -30,
    right: -20,
    top: '44%',
    height: 160,
    backgroundColor: '#5AA338',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 120,
    opacity: 0.35,
  },
  treeLeft: {
    position: 'absolute',
    left: 6,
    top: '38%',
    opacity: 0.85,
  },
  treeRight: {
    position: 'absolute',
    right: 10,
    top: '41%',
    opacity: 0.8,
  },
  treeEmoji: { fontSize: 28 },
});
