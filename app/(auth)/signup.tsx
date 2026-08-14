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

import { Body, PrimaryButton, Screen, SecondaryButton, Title } from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function SignupScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    const res = await signUp(email, password);
    if (!res.ok) {
      setMessage(res.message ?? 'Sign up failed');
      return;
    }
    router.replace('/');
  };

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.wrap}>
        <Title>Join Stepwize</Title>
        <Body muted>Create an account to keep your town safe in the cloud.</Body>

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
          <Text style={styles.label}>Password (6+ characters)</Text>
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
            label={loading ? 'Creating…' : 'Sign up'}
            onPress={onSubmit}
            disabled={loading}
          />
          <SecondaryButton label="I already have an account" onPress={() => router.replace('/(auth)/login')} />
        </View>
        <Text style={styles.credit}>made by d1panshuparmar</Text>
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
    paddingBottom: 8,
  },
});
