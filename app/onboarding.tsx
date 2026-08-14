import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Redirect, router } from 'expo-router';

import { fonts, palette, radii, spacing } from '@/constants/theme';
import { Body, PrimaryButton } from '@/components/ui';
import { requestMotionPermission } from '@/lib/steps';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export default function OnboardingScreen() {
  const user = useAuthStore((s) => s.user);
  const onboarded = useGameStore((s) => s.player.onboarded);
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);
  const [name, setName] = useState('');
  const [step, setStep] = useState(0);

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (onboarded) {
    return <Redirect href="/(tabs)" />;
  }

  const finish = async () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    if (step === 1) {
      await requestMotionPermission();
      setStep(2);
      return;
    }
    completeOnboarding(name);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.root}>
      <View style={[styles.bg, { backgroundColor: palette.skyTop }]} />
      <View style={[styles.bgBottom, { backgroundColor: palette.grass }]} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.brand}>Stepwize</Text>
        <Text style={styles.headline}>
          {step === 0 && 'Walk the world.\nBuild your town.'}
          {step === 1 && 'Steps become coins.'}
          {step === 2 && 'Name your town.'}
        </Text>
        <Body muted>
          {step === 0 &&
            'Plant crops, bake bread, fill orders — powered by every step you take.'}
          {step === 1 &&
            'Allow motion access so walking fills your wallet. You can also simulate steps while testing.'}
          {step === 2 &&
            'Your cottage is ready. Earn Step Coins, grow food, and expand the map.'}
        </Body>

        {step === 2 && (
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Willowstep"
            placeholderTextColor={palette.inkMuted}
            style={styles.input}
            maxLength={20}
            autoFocus
          />
        )}

        <View style={styles.footer}>
          <PrimaryButton
            label={
              step === 0 ? 'Begin' : step === 1 ? 'Continue' : 'Enter town'
            }
            onPress={finish}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.skyBottom,
  },
  bg: {
    ...StyleSheet.absoluteFill,
    bottom: '38%',
  },
  bgBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'flex-end',
    gap: 12,
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 48,
    color: palette.ink,
    letterSpacing: -1.5,
    marginBottom: 8,
  },
  headline: {
    fontFamily: fonts.displaySoft,
    fontSize: 28,
    color: palette.ink,
    lineHeight: 34,
  },
  input: {
    marginTop: 8,
    backgroundColor: palette.cream,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.woodLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: palette.ink,
  },
  footer: {
    marginTop: 20,
  },
});
