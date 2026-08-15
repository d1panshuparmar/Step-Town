import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import {
  Body,
  Panel,
  PrimaryButton,
  Screen,
  SecondaryButton,
  Subtitle,
  Title,
} from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { formatNumber } from '@/lib/date';
import {
  addFriendEasy,
  ensureMyProfile,
  listFriends,
  publishFriendSnapshot,
  removeFriendship,
  snapshotFromSave,
  type FriendListItem,
} from '@/lib/friends';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { useGameStore } from '@/store/gameStore';

export default function FriendsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const townName = useGameStore((s) => s.player.townName);
  const [myCode, setMyCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [friends, setFriends] = useState<FriendListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await ensureMyProfile({
        userId: user.id,
        email: user.email,
        townName,
      });
      setMyCode(profile.friendCode);
      const payload = useGameStore.getState().exportCloudSave();
      const snapshot = snapshotFromSave(
        user.id,
        user.email,
        profile.friendCode,
        payload
      );
      await publishFriendSnapshot(snapshot);
      const list = await listFriends(user.id);
      setFriends(list.filter((f) => f.status === 'accepted'));
    } catch (e) {
      Alert.alert(
        'Friends',
        e instanceof Error ? e.message : 'Could not load friends.'
      );
    } finally {
      setLoading(false);
    }
  }, [user, townName]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload])
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void reload()} />
        }>
        <Title>Friends</Title>
        <Subtitle>Just the 6-letter code — that's all you need</Subtitle>

        <Panel style={styles.block}>
          <Text style={styles.section}>Your friend code</Text>
          <Text style={styles.code}>{myCode || '······'}</Text>
          <Body muted>
            Share only this code. Friends type it below to add you and see your
            steps & town.
            {!isSupabaseConfigured
              ? ' Tip: cloud (Supabase) lets codes work across phones.'
              : ''}
          </Body>
          <View style={styles.rowBtns}>
            <PrimaryButton
              label="Share code"
              disabled={!myCode}
              onPress={() => {
                void Share.share({
                  message: `Add me on Stepwize! My friend code is ${myCode}`,
                });
              }}
            />
            <SecondaryButton label="Refresh" onPress={() => void reload()} />
          </View>
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.section}>Add a friend</Text>
          <Body muted>Type their 6-letter friend code. No long invite needed.</Body>
          <TextInput
            value={codeInput}
            onChangeText={(t) =>
              setCodeInput(t.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase())
            }
            placeholder="ABCDEF"
            placeholderTextColor={palette.inkMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            style={styles.input}
          />
          <PrimaryButton
            label={busy ? 'Adding…' : 'Add friend'}
            disabled={busy || codeInput.trim().length !== 6}
            onPress={async () => {
              if (!user) return;
              setBusy(true);
              try {
                const res = await addFriendEasy(user.id, codeInput);
                Alert.alert('Friends', res.message);
                if (res.ok) {
                  setCodeInput('');
                  await reload();
                }
              } finally {
                setBusy(false);
              }
            }}
          />
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.section}>Your friends</Text>
          {friends.length === 0 ? (
            <Body muted>
              No friends yet — share your code, or enter theirs above.
            </Body>
          ) : (
            friends.map((f) => (
              <Pressable
                key={f.friendshipId}
                style={styles.friendCard}
                onPress={() =>
                  router.push(
                    `/friend/${f.userId}?name=${encodeURIComponent(f.displayName)}` as never
                  )
                }>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{f.townName}</Text>
                  <Body muted>
                    {f.displayName} · Lv {f.level} · 🔥 {f.streak} · {f.friendCode}
                  </Body>
                  <Text style={styles.steps}>
                    {formatNumber(f.todaySteps)} steps today
                  </Text>
                </View>
                <Pressable
                  hitSlop={10}
                  onPress={async () => {
                    if (!user) return;
                    await removeFriendship(user.id, f.friendshipId);
                    await reload();
                  }}>
                  <Text style={styles.cancel}>Remove</Text>
                </Pressable>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))
          )}
        </Panel>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.xl },
  block: { gap: 10 },
  section: {
    fontFamily: fonts.displaySoft,
    fontSize: 18,
    color: palette.ink,
  },
  code: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: 6,
    color: palette.wood,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: palette.woodLight,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: 6,
    color: palette.ink,
    backgroundColor: '#FFF8EC',
    textAlign: 'center',
  },
  rowBtns: { gap: 8 },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(107,68,35,0.15)',
  },
  name: {
    fontFamily: fonts.bodyExtra,
    fontSize: 16,
    color: palette.ink,
  },
  steps: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: palette.wood,
    marginTop: 2,
  },
  chevron: {
    fontSize: 28,
    color: palette.inkMuted,
    paddingHorizontal: 4,
  },
  cancel: {
    fontFamily: fonts.bodyBold,
    color: palette.inkMuted,
    fontSize: 12,
  },
});
