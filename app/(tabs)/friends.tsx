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
  buildFriendInvite,
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
  const [inviteToken, setInviteToken] = useState('');
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
      setInviteToken(buildFriendInvite({ v: 1, profile, snapshot }));
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
        <Subtitle>Add by code — no logging into their account</Subtitle>

        <Panel style={styles.block}>
          <Text style={styles.section}>Your friend code</Text>
          <Text style={styles.code}>{myCode || '······'}</Text>
          <Body muted>
            Share your invite. Friends paste it on their phone and instantly see
            your steps & town.
            {isSupabaseConfigured
              ? ' Cloud sync keeps progress updated.'
              : ' Without cloud, share the full invite (not just the code).'}
          </Body>
          <View style={styles.rowBtns}>
            <PrimaryButton
              label="Share invite"
              disabled={!myCode || !inviteToken}
              onPress={() => {
                void Share.share({
                  message: [
                    'Add me on Stepwize!',
                    `Friend code: ${myCode}`,
                    '',
                    'Paste this whole message in Friends → Add a friend:',
                    inviteToken,
                  ].join('\n'),
                });
              }}
            />
            <SecondaryButton label="Refresh" onPress={() => void reload()} />
          </View>
        </Panel>

        <Panel style={styles.block}>
          <Text style={styles.section}>Add a friend</Text>
          <Body muted>
            Paste their friend code, or the full invite they shared. No accept
            step — they are added right away.
          </Body>
          <TextInput
            value={codeInput}
            onChangeText={setCodeInput}
            placeholder="Code or paste invite"
            placeholderTextColor={palette.inkMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            multiline
            style={styles.input}
          />
          <PrimaryButton
            label={busy ? 'Adding…' : 'Add friend'}
            disabled={busy || codeInput.trim().length < 4}
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
              No friends yet — ask them to Share invite, then paste it above.
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
    fontSize: 36,
    letterSpacing: 4,
    color: palette.wood,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: palette.woodLight,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    letterSpacing: 0.5,
    color: palette.ink,
    backgroundColor: '#FFF8EC',
    minHeight: 52,
    textAlignVertical: 'top',
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
