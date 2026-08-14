import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

export async function isPedometerAvailable(): Promise<boolean> {
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function requestMotionPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const res = await Pedometer.requestPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

/** Steps since local midnight when the API supports it. */
export async function readTodaySteps(): Promise<number | null> {
  const available = await isPedometerAvailable();
  if (!available) return null;

  const end = new Date();
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  try {
    const result = await Pedometer.getStepCountAsync(start, end);
    return result.steps ?? 0;
  } catch {
    return null;
  }
}
