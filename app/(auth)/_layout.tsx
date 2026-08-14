import { Redirect, Stack } from 'expo-router';

import { palette } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);

  if (ready && user) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: palette.skyBottom },
      }}
    />
  );
}
