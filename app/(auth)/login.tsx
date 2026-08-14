import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, PrimaryButton, Screen, SecondaryButton, Title } from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((s) => s.signIn);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    const res = await signIn(email, password);
    if (!res.ok) {
      setMessage(res.message ?? 'Login failed');
      return;
    }
    router.replace('/');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}>
        <Title>Welcome back</Title>
        <Body muted>Log in to sync your town across devices.</Body>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={palette.inkMuted}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={palette.inkMuted}
          />
          {!!message && <Text style={styles.error}>{message}</Text>}
          <PrimaryButton
            label={loading ? 'Signing in…' : 'Log in'}
            onPress={onSubmit}
            disabled={loading}
          />
          <SecondaryButton
            label="Create account"
            onPress={() => router.replace('/(auth)/signup')}
          />
        </View>

        <Text
          style={[
            styles.credit,
            { marginBottom: Math.max(insets.bottom, 8) },
          ]}>
          made by d1panshuparmar
        </Text>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: spacing.md, paddingTop: spacing.md },
  form: { gap: 10, marginTop: spacing.md, flexGrow: 1 },
  label: {
    fontFamily: fonts.bodyBold,
    color: palette.inkMuted,
    fontSize: 13,
  },
  input: {
    backgroundColor: palette.cream,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.woodLight,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: palette.ink,
  },
  error: {
    fontFamily: fonts.bodyBold,
    color: palette.danger,
    fontSize: 13,
  },
  credit: {
    marginTop: 'auto',
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: palette.ink,
    opacity: 0.7,
    letterSpacing: 0.2,
  },
});
