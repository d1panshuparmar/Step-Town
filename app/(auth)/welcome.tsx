import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { fonts, palette, spacing } from '@/constants/theme';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function WelcomeScreen() {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [drift]);

  const cloudStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 28 }],
  }));

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.skyTop, '#A8D8EA', palette.grassLight]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.Text style={[styles.cloud, cloudStyle, { top: 80, left: 24 }]}>
        ☁️
      </Animated.Text>
      <Animated.Text style={[styles.cloud, cloudStyle, { top: 120, right: 40 }]}>
        ☁️
      </Animated.Text>
      <Text style={styles.sun}>☀️</Text>

      <View style={styles.hero}>
        <Text style={styles.brand}>Stepwize</Text>
        <Text style={styles.tagline}>Walk the world. Build your town.</Text>
        <Text style={styles.body}>
          Earn Step Coins from real steps, grow crops, run factories, and fill
          orders in a cozy town that grows with you.
        </Text>
      </View>

      <View style={styles.actions}>
        {!isSupabaseConfigured && (
          <Text style={styles.note}>
            Dev mode: accounts save on this device. Add Supabase keys for cloud
            sync.
          </Text>
        )}
        <PrimaryButton label="Create account" onPress={() => router.push('/(auth)/signup')} />
        <SecondaryButton label="Log in" onPress={() => router.push('/(auth)/login')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
    justifyContent: 'flex-end',
  },
  sun: {
    position: 'absolute',
    top: 64,
    right: 36,
    fontSize: 44,
  },
  cloud: {
    position: 'absolute',
    fontSize: 36,
    opacity: 0.85,
  },
  hero: {
    gap: 10,
    marginBottom: 28,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 56,
    color: palette.ink,
    letterSpacing: -1.8,
  },
  tagline: {
    fontFamily: fonts.displaySoft,
    fontSize: 24,
    color: palette.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
    color: palette.inkMuted,
    maxWidth: 340,
  },
  actions: {
    gap: 10,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.inkMuted,
    marginBottom: 4,
  },
});
