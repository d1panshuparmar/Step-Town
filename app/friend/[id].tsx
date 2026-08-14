import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FriendTownView } from '@/components/FriendTownView';
import { Body, Panel, SecondaryButton } from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { formatNumber } from '@/lib/date';
import { getFriendSnapshot } from '@/lib/friends';
import type { FriendTownSnapshot } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';

export default function FriendTownScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const [snapshot, setSnapshot] = useState<FriendTownSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);
    try {
      const snap = await getFriendSnapshot(user.id, id);
      if (!snap) {
        setSnapshot(null);
        setError(
          'No town snapshot yet. Ask your friend to open Stepwize so it syncs.'
        );
      } else {
        setSnapshot(snap);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load town.');
    } finally {
      setLoading(false);
    }
  }, [user, id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 4 }]}>
      <LinearGradient
        colors={['#6EC6E6', '#A8DFF0', '#C8E89A', '#7CB342']}
        locations={[0, 0.35, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.back}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {snapshot?.townName || name || 'Friend town'}
        </Text>
        <Pressable onPress={() => void load()} hitSlop={12}>
          <Text style={styles.refresh}>↻</Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={palette.wood} style={{ marginTop: 40 }} />
      ) : error ? (
        <Panel style={styles.errorPanel}>
          <Body>{error}</Body>
          <SecondaryButton label="Try again" onPress={() => void load()} />
        </Panel>
      ) : snapshot ? (
        <ScrollView contentContainerStyle={styles.content}>
          <LinearGradient
            colors={['#FFF1D6', '#E8CFA3']}
            style={styles.stats}>
            <Stat label="Steps today" value={formatNumber(snapshot.todaySteps)} />
            <Stat label="Level" value={`${snapshot.level}`} />
            <Stat label="Streak" value={`${snapshot.streak}d`} />
          </LinearGradient>
          <Text style={styles.meta}>
            {snapshot.email || snapshot.friendCode} · read-only visit
          </Text>
          <FriendTownView snapshot={snapshot} />
        </ScrollView>
      ) : null}
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: 8,
  },
  back: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: palette.ink,
    width: 64,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.display,
    fontSize: 22,
    color: palette.ink,
  },
  refresh: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    color: palette.ink,
    width: 64,
    textAlign: 'right',
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  stats: {
    marginHorizontal: spacing.sm,
    borderRadius: radii.lg,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderWidth: 2,
    borderColor: palette.wood,
  },
  stat: { alignItems: 'center' },
  statValue: {
    fontFamily: fonts.bodyExtra,
    fontSize: 20,
    color: palette.ink,
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: palette.inkMuted,
  },
  errorPanel: {
    margin: spacing.md,
    gap: 12,
  },
  meta: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.inkMuted,
    textAlign: 'center',
  },
});
