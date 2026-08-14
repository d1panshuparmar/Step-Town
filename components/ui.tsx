import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonts, palette, radii, spacing } from '@/constants/theme';

export function Screen({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + spacing.sm,
          paddingHorizontal: padded ? spacing.md : 0,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Body({
  children,
  muted,
}: {
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <Text style={[styles.body, muted && { color: palette.inkMuted }]}>
      {children}
    </Text>
  );
}

export function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.btnDisabled,
        pressed && !disabled && { transform: [{ scale: 0.98 }] },
      ]}>
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryBtn,
        disabled && styles.btnDisabled,
        pressed && !disabled && { opacity: 0.85 },
      ]}>
      <Text style={styles.secondaryBtnText}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function LoadingGate({ ready }: { ready: boolean }) {
  if (ready) return null;
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={palette.wood} size="large" />
      <Text style={styles.loadingText}>Waking your town…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.skyBottom,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: palette.ink,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    color: palette.inkMuted,
    marginTop: 4,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: palette.ink,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: palette.panelBorder,
    padding: spacing.md,
  },
  primaryBtn: {
    backgroundColor: palette.wood,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: fonts.bodyExtra,
    color: palette.cream,
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: palette.cream,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: palette.woodLight,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontFamily: fonts.bodyBold,
    color: palette.ink,
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: palette.panelBorder,
  },
  chipActive: {
    backgroundColor: palette.wood,
    borderColor: palette.wood,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    color: palette.ink,
    fontSize: 13,
  },
  chipTextActive: {
    color: palette.cream,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.skyBottom,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    gap: 12,
  },
  loadingText: {
    fontFamily: fonts.body,
    color: palette.inkMuted,
  },
});
