export type GameSettings = {
  music: boolean;
  sfx: boolean;
  notifications: boolean;
  reduceMotion: boolean;
  graphicsQuality: 'low' | 'medium' | 'high';
};

export const DEFAULT_SETTINGS: GameSettings = {
  music: true,
  sfx: true,
  notifications: true,
  reduceMotion: false,
  graphicsQuality: 'high',
};
