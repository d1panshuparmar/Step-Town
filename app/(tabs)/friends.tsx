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
  Title,
} from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { formatNumber } from '@/lib/date';
import {
  addFriendEasy,
  ensureMyProfile,
  listFriends,
  makeFriendCode,
  publishFriendSnapshot,
  removeFriendship,
  snapshotFromSave,
  type FriendListItem,
} from '@/lib/friends';
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
      const quickCode = await makeFriendCode(user.id, user.email);
      setMyCode(quickCode);
    } catch {
      /* keep previous code if any */
    }
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
    } catch {
      try {
        const code = await makeFriendCode(user.id, user.email);
        setMyCode(code);
      } catch {
        /* ignore */
      }
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

        <Panel style={styles.block}>
          <Text style={styles.section}>Your code</Text>
          <Text style={styles.code}>{myCode || '…'}</Text>
          <PrimaryButton
            label="Share"
            disabled={!myCode}
            onPress={() => {
              void Share.share({
                message: `Add me on Stepwize! My friend code is ${myCode}`,
              });
            }}
          />
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.section}>Add friend</Text>
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
          {friends.length === 0 ? (
            <Body muted>No friends yet</Body>
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
                    {f.displayName} · Lv {f.level} · 🔥 {f.streak}
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
    fontSize: 16,
    color: palette.inkMuted,
    textAlign: 'center',
  },
  code: {
    fontFamily: fonts.display,
    fontSize: 48,
    letterSpacing: 8,
    color: palette.wood,
    textAlign: 'center',
    fontWeight: '700',
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
