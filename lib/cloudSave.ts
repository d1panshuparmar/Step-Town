import AsyncStorage from '@react-native-async-storage/async-storage';

import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import type { CloudSavePayload } from '@/lib/types';

function localKey(userId: string) {
  return `stepwize-cloud-mirror:${userId}`;
}

export async function pullCloudSave(
  userId: string
): Promise<CloudSavePayload | null> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { data, error } = await supabase
      .from('town_saves')
      .select('save')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data?.save as CloudSavePayload) ?? null;
  }

  const raw = await AsyncStorage.getItem(localKey(userId));
  if (!raw) return null;
  return JSON.parse(raw) as CloudSavePayload;
}

export async function pushCloudSave(
  userId: string,
  payload: CloudSavePayload
): Promise<void> {
  if (isSupabaseConfigured) {
    const supabase = getSupabase()!;
    const { error } = await supabase.from('town_saves').upsert({
      user_id: userId,
      save: payload,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    return;
  }

  await AsyncStorage.setItem(localKey(userId), JSON.stringify(payload));
}
