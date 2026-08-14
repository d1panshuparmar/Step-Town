import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';

const LOCAL_USERS_KEY = 'stepwize-local-users-v1';
const LOCAL_SESSION_KEY = 'stepwize-local-session-v1';

type LocalUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: number;
};

export type AuthUser = {
  id: string;
  email: string;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  ready: boolean;
  mode: 'supabase' | 'local';
  error: string | null;
  init: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `stepwize:${password}`
  );
}

async function readLocalUsers(): Promise<LocalUser[]> {
  const raw = await AsyncStorage.getItem(LOCAL_USERS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as LocalUser[];
  } catch {
    return [];
  }
}

async function writeLocalUsers(users: LocalUser[]) {
  await AsyncStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  ready: false,
  mode: isSupabaseConfigured ? 'supabase' : 'local',
  error: null,

  clearError: () => set({ error: null }),

  init: async () => {
    set({
      mode: isSupabaseConfigured ? 'supabase' : 'local',
      loading: true,
    });

    try {
      if (isSupabaseConfigured) {
        const supabase = getSupabase()!;
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user;
        set({
          user: sessionUser
            ? { id: sessionUser.id, email: sessionUser.email ?? '' }
            : null,
          ready: true,
          loading: false,
        });

        supabase.auth.onAuthStateChange((_event, session) => {
          const u = session?.user;
          set({
            user: u ? { id: u.id, email: u.email ?? '' } : null,
          });
        });
        return;
      }

      const sessionRaw = await AsyncStorage.getItem(LOCAL_SESSION_KEY);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw) as AuthUser;
        set({ user: session, ready: true, loading: false });
      } else {
        set({ user: null, ready: true, loading: false });
      }
    } catch (e) {
      set({
        ready: true,
        loading: false,
        error: e instanceof Error ? e.message : 'Auth init failed',
      });
    }
  },

  signUp: async (email, password) => {
    const clean = email.trim().toLowerCase();
    if (!clean || !password || password.length < 6) {
      return { ok: false, message: 'Use a valid email and 6+ character password' };
    }

    set({ loading: true, error: null });
    try {
      if (isSupabaseConfigured) {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.auth.signUp({
          email: clean,
          password,
        });
        if (error) {
          set({ loading: false, error: error.message });
          return { ok: false, message: error.message };
        }
        const u = data.user;
        set({
          loading: false,
          user: u ? { id: u.id, email: u.email ?? clean } : get().user,
        });
        return { ok: true };
      }

      const users = await readLocalUsers();
      if (users.some((u) => u.email === clean)) {
        set({ loading: false });
        return { ok: false, message: 'Account already exists — try logging in' };
      }
      const user: LocalUser = {
        id: `local-${Date.now()}`,
        email: clean,
        passwordHash: await hashPassword(password),
        createdAt: Date.now(),
      };
      await writeLocalUsers([...users, user]);
      const session = { id: user.id, email: user.email };
      await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      set({ user: session, loading: false });
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign up failed';
      set({ loading: false, error: message });
      return { ok: false, message };
    }
  },

  signIn: async (email, password) => {
    const clean = email.trim().toLowerCase();
    set({ loading: true, error: null });
    try {
      if (isSupabaseConfigured) {
        const supabase = getSupabase()!;
        const { data, error } = await supabase.auth.signInWithPassword({
          email: clean,
          password,
        });
        if (error) {
          set({ loading: false, error: error.message });
          return { ok: false, message: error.message };
        }
        const u = data.user;
        set({
          loading: false,
          user: u ? { id: u.id, email: u.email ?? clean } : null,
        });
        return { ok: true };
      }

      const users = await readLocalUsers();
      const found = users.find((u) => u.email === clean);
      if (!found) {
        set({ loading: false });
        return { ok: false, message: 'No account found — sign up first' };
      }
      const hash = await hashPassword(password);
      if (hash !== found.passwordHash) {
        set({ loading: false });
        return { ok: false, message: 'Incorrect password' };
      }
      const session = { id: found.id, email: found.email };
      await AsyncStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      set({ user: session, loading: false });
      return { ok: true };
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Login failed';
      set({ loading: false, error: message });
      return { ok: false, message };
    }
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await getSupabase()?.auth.signOut();
    } else {
      await AsyncStorage.removeItem(LOCAL_SESSION_KEY);
    }
    set({ user: null });
  },
}));
