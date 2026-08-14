import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { todayKey } from '@/lib/date';
import type {
  CloudSavePayload,
  FriendProfile,
  Friendship,
  FriendTownSnapshot,
} from '@/lib/types';

const PROFILES_KEY = 'stepwize-profiles-v1';
const FRIENDSHIPS_KEY = 'stepwize-friendships-v1';
const SNAPSHOTS_KEY = 'stepwize-friend-snapshots-v1';

export type FriendListItem = {
  friendshipId: string;
  userId: string;
  email: string;
  displayName: string;
  townName: string;
  friendCode: string;
  status: 'pending' | 'accepted';
  incoming: boolean;
  todaySteps: number;
  level: number;
  streak: number;
  savedAt: number;
};

function codeFromSeed(seed: string): string {
  // Take hex digest → 6 readable chars (no 0/O/1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n * 31 + seed.charCodeAt(i)) >>> 0;
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[(n + i * 17) % alphabet.length];
    n = (n * 1103515245 + 12345) >>> 0;
  }
  return out;
}

export async function makeFriendCode(userId: string, email: string): Promise<string> {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${userId}:${email.toLowerCase()}`
  );
  return codeFromSeed(digest);
}

export function snapshotFromSave(
  userId: string,
  email: string,
  friendCode: string,
  payload: CloudSavePayload
): FriendTownSnapshot {
  return {
    userId,
    friendCode,
    email,
    townName: payload.player.townName || 'My Town',
    level: payload.player.level,
    todaySteps:
      payload.player.todayDate === todayKey() ? payload.player.todaySteps : 0,
    todayDate: payload.player.todayDate,
    streak: payload.player.streak,
    plots: payload.plots,
    savedAt: payload.savedAt,
  };
}

async function readLocalProfiles(): Promise<Record<string, FriendProfile>> {
  const raw = await AsyncStorage.getItem(PROFILES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, FriendProfile>;
  } catch {
    return {};
  }
}

async function writeLocalProfiles(map: Record<string, FriendProfile>) {
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(map));
}

async function readLocalFriendships(): Promise<Friendship[]> {
  const raw = await AsyncStorage.getItem(FRIENDSHIPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Friendship[];
  } catch {
    return [];
  }
}

async function writeLocalFriendships(list: Friendship[]) {
  await AsyncStorage.setItem(FRIENDSHIPS_KEY, JSON.stringify(list));
}

async function readLocalSnapshots(): Promise<Record<string, FriendTownSnapshot>> {
  const raw = await AsyncStorage.getItem(SNAPSHOTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, FriendTownSnapshot>;
  } catch {
    return {};
  }
}

async function writeLocalSnapshots(map: Record<string, FriendTownSnapshot>) {
  await AsyncStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(map));
}

export type FriendInvitePayload = {
  v: 1;
  profile: FriendProfile;
  snapshot: FriendTownSnapshot;
};

function utf8ToBase64(value: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = unescape(encodeURIComponent(value));
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes.charCodeAt(i);
    const b = i + 1 < bytes.length ? bytes.charCodeAt(i + 1) : 0;
    const c = i + 2 < bytes.length ? bytes.charCodeAt(i + 2) : 0;
    const n = (a << 16) | (b << 8) | c;
    out += chars[(n >> 18) & 63];
    out += chars[(n >> 12) & 63];
    out += i + 1 < bytes.length ? chars[(n >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? chars[n & 63] : '=';
  }
  return out;
}

function base64ToUtf8(value: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  let bytes = '';
  for (let i = 0; i < clean.length; i += 4) {
    const n =
      (chars.indexOf(clean[i]) << 18) |
      (chars.indexOf(clean[i + 1]) << 12) |
      ((clean[i + 2] === '=' ? 0 : chars.indexOf(clean[i + 2])) << 6) |
      (clean[i + 3] === '=' ? 0 : chars.indexOf(clean[i + 3]));
    bytes += String.fromCharCode((n >> 16) & 255);
    if (clean[i + 2] !== '=') bytes += String.fromCharCode((n >> 8) & 255);
    if (clean[i + 3] !== '=') bytes += String.fromCharCode(n & 255);
  }
  return decodeURIComponent(escape(bytes));
}

export function buildFriendInvite(payload: FriendInvitePayload): string {
  return `STEPWIZE1.${utf8ToBase64(JSON.stringify(payload))}`;
}

export function parseFriendInvite(raw: string): FriendInvitePayload | null {
  const match = raw.match(/STEPWIZE1\.([A-Za-z0-9+/=_-]+)/);
  if (!match) return null;
  try {
    const json = base64ToUtf8(match[1].replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(json) as FriendInvitePayload;
    if (parsed?.v !== 1 || !parsed.profile?.id || !parsed.snapshot?.userId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function extractFriendCode(raw: string): string | null {
  const invite = parseFriendInvite(raw);
  if (invite) return invite.profile.friendCode;
  const fromLabel = raw.match(/\b(?:code|friend code)[:\s]*([A-Z0-9]{6})\b/i);
  if (fromLabel) return fromLabel[1].toUpperCase();
  const bare = raw.trim().toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(bare)) return bare;
  return null;
}

async function upsertLocalFriendLink(
  myUserId: string,
  profile: FriendProfile,
  snapshot?: FriendTownSnapshot
): Promise<void> {
  const profiles = await readLocalProfiles();
  profiles[profile.id] = profile;
  await writeLocalProfiles(profiles);

  if (snapshot) {
    const snaps = await readLocalSnapshots();
    snaps[profile.id] = {
      ...snapshot,
      userId: profile.id,
      friendCode: profile.friendCode,
      email: profile.email || snapshot.email,
    };
    await writeLocalSnapshots(snaps);
  }

  const list = await readLocalFriendships();
  const existing = list.find(
    (f) =>
      (f.requesterId === myUserId && f.addresseeId === profile.id) ||
      (f.requesterId === profile.id && f.addresseeId === myUserId)
  );
  if (existing) {
    existing.status = 'accepted';
    await writeLocalFriendships(list);
    return;
  }
  list.push({
    id: `f-${Date.now()}`,
    requesterId: myUserId,
    addresseeId: profile.id,
    status: 'accepted',
    createdAt: Date.now(),
  });
  await writeLocalFriendships(list);
}

/** Instant-add by short code or pasted STEPWIZE invite (no account switching). */
export async function addFriendEasy(
  myUserId: string,
  paste: string
): Promise<{ ok: boolean; message: string }> {
  const text = paste.trim();
  if (!text) return { ok: false, message: 'Paste a friend code or invite.' };

  const invite = parseFriendInvite(text);
  if (invite) {
    if (invite.profile.id === myUserId) {
      return { ok: false, message: "That's your own invite." };
    }
    await upsertLocalFriendLink(myUserId, invite.profile, invite.snapshot);

    if (isSupabaseConfigured) {
      try {
        const supabase = getSupabase()!;
        const { data: existing } = await supabase
          .from('friendships')
          .select('*')
          .or(
            `and(requester_id.eq.${myUserId},addressee_id.eq.${invite.profile.id}),and(requester_id.eq.${invite.profile.id},addressee_id.eq.${myUserId})`
          )
          .maybeSingle();
        if (!existing) {
          await supabase.from('friendships').insert({
            requester_id: myUserId,
            addressee_id: invite.profile.id,
            status: 'accepted',
          });
        } else if (existing.status !== 'accepted') {
          await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', existing.id);
        }
      } catch {
        /* local friend still works */
      }
    }

    return {
      ok: true,
      message: `Added ${invite.profile.displayName || invite.snapshot.townName}. Their town & steps are ready.`,
    };
  }

  const code = extractFriendCode(text);
  if (!code) {
    return {
      ok: false,
      message:
        'Paste their 6-letter code, or the full invite they shared from Friends.',
    };
  }

  // Prefer cloud lookup so you never need their account on your phone
  const target = await findProfileByFriendCode(code);
  if (!target) {
    return {
      ok: false,
      message: isSupabaseConfigured
        ? 'No player found with that code yet. Ask them to open Friends once, then share again.'
        : 'Ask them to tap Share invite in Friends, then paste the whole message here (code alone needs cloud).',
    };
  }
  if (target.id === myUserId) {
    return { ok: false, message: "That's your own code." };
  }

  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(
        `and(requester_id.eq.${myUserId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${myUserId})`
      )
      .maybeSingle();

    if (existing?.status === 'accepted') {
      await upsertLocalFriendLink(myUserId, target);
      return { ok: false, message: 'Already friends.' };
    }
    if (existing) {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', existing.id);
      if (error) return { ok: false, message: error.message };
    } else {
      const { error } = await supabase.from('friendships').insert({
        requester_id: myUserId,
        addressee_id: target.id,
        status: 'accepted',
      });
      if (error) return { ok: false, message: error.message };
    }

    // Cache their public snapshot locally for instant town view
    const { data: snapRow } = await supabase
      .from('friend_snapshots')
      .select('snapshot')
      .eq('user_id', target.id)
      .maybeSingle();
    await upsertLocalFriendLink(
      myUserId,
      target,
      (snapRow?.snapshot as FriendTownSnapshot) ?? undefined
    );
    return {
      ok: true,
      message: `Added ${target.displayName}. Tap them to see steps & town.`,
    };
  }

  // Local-only short code: only works if their profile already exists on this phone
  await upsertLocalFriendLink(myUserId, target);
  return {
    ok: true,
    message: `Added ${target.displayName}.`,
  };
}

/** @deprecated use addFriendEasy — kept for older UI paths */
export async function sendFriendRequest(
  myUserId: string,
  friendCode: string
): Promise<{ ok: boolean; message: string }> {
  return addFriendEasy(myUserId, friendCode);
}

export async function ensureMyProfile(input: {
  userId: string;
  email: string;
  townName?: string;
}): Promise<FriendProfile> {
  const friendCode = await makeFriendCode(input.userId, input.email);
  const displayName = input.email.split('@')[0] || 'Player';
  const townName = input.townName || 'My Town';

  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', input.userId)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          email: input.email,
          town_name: townName,
          display_name: existing.display_name || displayName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.userId)
        .select('*')
        .single();
      if (error) throw error;
      return {
        id: data.id,
        email: data.email,
        friendCode: data.friend_code,
        townName: data.town_name,
        displayName: data.display_name,
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: input.userId,
        email: input.email,
        friend_code: friendCode,
        display_name: displayName,
        town_name: townName,
      })
      .select('*')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      email: data.email,
      friendCode: data.friend_code,
      townName: data.town_name,
      displayName: data.display_name,
    };
  }

  const map = await readLocalProfiles();
  const prev = map[input.userId];
  const profile: FriendProfile = {
    id: input.userId,
    email: input.email,
    friendCode: prev?.friendCode ?? friendCode,
    townName,
    displayName: prev?.displayName ?? displayName,
  };
  map[input.userId] = profile;
  await writeLocalProfiles(map);
  return profile;
}

export async function publishFriendSnapshot(
  snapshot: FriendTownSnapshot
): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from('friend_snapshots').upsert({
      user_id: snapshot.userId,
      snapshot,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }

  const map = await readLocalSnapshots();
  map[snapshot.userId] = snapshot;
  await writeLocalSnapshots(map);
}

export async function findProfileByFriendCode(
  code: string
): Promise<FriendProfile | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('friend_code', normalized)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      email: data.email,
      friendCode: data.friend_code,
      townName: data.town_name,
      displayName: data.display_name,
    };
  }

  const map = await readLocalProfiles();
  return (
    Object.values(map).find((p) => p.friendCode === normalized) ?? null
  );
}

export async function acceptFriendRequest(
  myUserId: string,
  friendshipId: string
): Promise<{ ok: boolean; message: string }> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .eq('addressee_id', myUserId);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Friend added!' };
  }

  const list = await readLocalFriendships();
  const idx = list.findIndex(
    (f) => f.id === friendshipId && f.addresseeId === myUserId
  );
  if (idx < 0) return { ok: false, message: 'Request not found.' };
  list[idx] = { ...list[idx], status: 'accepted' };
  await writeLocalFriendships(list);
  return { ok: true, message: 'Friend added!' };
}

export async function removeFriendship(
  myUserId: string,
  friendshipId: string
): Promise<{ ok: boolean; message: string }> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`requester_id.eq.${myUserId},addressee_id.eq.${myUserId}`);
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: 'Removed.' };
  }

  const list = await readLocalFriendships();
  const next = list.filter(
    (f) =>
      f.id !== friendshipId ||
      (f.requesterId !== myUserId && f.addresseeId !== myUserId)
  );
  await writeLocalFriendships(next);
  return { ok: true, message: 'Removed.' };
}

export async function listFriends(myUserId: string): Promise<FriendListItem[]> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { data: rows, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`requester_id.eq.${myUserId},addressee_id.eq.${myUserId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!rows?.length) return [];

    const otherIds = rows.map((r) =>
      r.requester_id === myUserId ? r.addressee_id : r.requester_id
    );
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

    const acceptedIds = rows
      .filter((r) => r.status === 'accepted')
      .map((r) =>
        r.requester_id === myUserId ? r.addressee_id : r.requester_id
      );
    const { data: snaps } = acceptedIds.length
      ? await supabase
          .from('friend_snapshots')
          .select('user_id, snapshot')
          .in('user_id', acceptedIds)
      : { data: [] as { user_id: string; snapshot: FriendTownSnapshot }[] };
    const snapMap = new Map(
      (snaps ?? []).map((s) => [s.user_id, s.snapshot as FriendTownSnapshot])
    );

    return rows.map((r) => {
      const otherId =
        r.requester_id === myUserId ? r.addressee_id : r.requester_id;
      const p = profileMap.get(otherId);
      const snap = snapMap.get(otherId);
      return {
        friendshipId: r.id,
        userId: otherId,
        email: p?.email ?? '',
        displayName: p?.display_name ?? 'Player',
        townName: snap?.townName ?? p?.town_name ?? 'Town',
        friendCode: p?.friend_code ?? '',
        status: r.status as 'pending' | 'accepted',
        incoming: r.addressee_id === myUserId && r.status === 'pending',
        todaySteps: snap?.todaySteps ?? 0,
        level: snap?.level ?? 1,
        streak: snap?.streak ?? 0,
        savedAt: snap?.savedAt ?? 0,
      };
    });
  }

  const [list, profiles, snaps] = await Promise.all([
    readLocalFriendships(),
    readLocalProfiles(),
    readLocalSnapshots(),
  ]);
  return list
    .filter((f) => f.requesterId === myUserId || f.addresseeId === myUserId)
    .map((f) => {
      const otherId =
        f.requesterId === myUserId ? f.addresseeId : f.requesterId;
      const p = profiles[otherId];
      const snap = snaps[otherId];
      return {
        friendshipId: f.id,
        userId: otherId,
        email: p?.email ?? '',
        displayName: p?.displayName ?? 'Player',
        townName: snap?.townName ?? p?.townName ?? 'Town',
        friendCode: p?.friendCode ?? '',
        status: f.status,
        incoming: f.addresseeId === myUserId && f.status === 'pending',
        todaySteps: snap?.todaySteps ?? 0,
        level: snap?.level ?? 1,
        streak: snap?.streak ?? 0,
        savedAt: snap?.savedAt ?? 0,
      };
    })
    .sort((a, b) => b.savedAt - a.savedAt);
}

export async function getFriendSnapshot(
  myUserId: string,
  friendUserId: string
): Promise<FriendTownSnapshot | null> {
  // Invite-imported friends are always available locally
  const localSnaps = await readLocalSnapshots();
  const local = localSnaps[friendUserId] ?? null;

  if (isSupabaseConfigured) {
    try {
      const supabase = getSupabase()!;
      const { data, error } = await supabase
        .from('friend_snapshots')
        .select('snapshot')
        .eq('user_id', friendUserId)
        .maybeSingle();
      if (!error && data?.snapshot) {
        const remote = data.snapshot as FriendTownSnapshot;
        // Keep the fresher of local invite vs cloud
        if (!local || (remote.savedAt ?? 0) >= (local.savedAt ?? 0)) {
          const map = await readLocalSnapshots();
          map[friendUserId] = remote;
          await writeLocalSnapshots(map);
          return remote;
        }
      }
    } catch {
      /* fall through to local */
    }
  }

  if (local) return local;

  const list = await readLocalFriendships();
  const ok = list.some(
    (f) =>
      f.status === 'accepted' &&
      ((f.requesterId === myUserId && f.addresseeId === friendUserId) ||
        (f.addresseeId === myUserId && f.requesterId === friendUserId))
  );
  if (!ok) return null;
  return null;
}
