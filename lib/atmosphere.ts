/** Real-time day/night + light weather for the town sky. */

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';
export type Weather = 'sunny' | 'cloudy' | 'rain' | 'snow';

export type Atmosphere = {
  phase: DayPhase;
  weather: Weather;
  /** 0 = midnight dark, 1 = noon bright */
  brightness: number;
  skyColors: [string, string, string, string, string];
  overlay: string;
  label: string;
};

function hourNow(date = new Date()): number {
  return date.getHours() + date.getMinutes() / 60;
}

export function dayPhase(hour = hourNow()): DayPhase {
  if (hour >= 5 && hour < 7.5) return 'dawn';
  if (hour >= 7.5 && hour < 17.5) return 'day';
  if (hour >= 17.5 && hour < 20) return 'dusk';
  return 'night';
}

/** Deterministic daily weather from calendar day (stable all day). */
export function weatherForDay(date = new Date()): Weather {
  const key =
    date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  const roll = (key * 17 + 31) % 100;
  if (roll < 8) return 'snow';
  if (roll < 28) return 'rain';
  if (roll < 48) return 'cloudy';
  return 'sunny';
}

export function getAtmosphere(date = new Date()): Atmosphere {
  const hour = hourNow(date);
  const phase = dayPhase(hour);
  const weather = weatherForDay(date);

  let brightness = 1;
  if (phase === 'dawn') brightness = 0.72;
  else if (phase === 'dusk') brightness = 0.55;
  else if (phase === 'night') brightness = 0.28;
  else brightness = 1;

  if (weather === 'cloudy') brightness *= 0.88;
  if (weather === 'rain') brightness *= 0.78;
  if (weather === 'snow') brightness *= 0.82;

  const skies: Record<DayPhase, [string, string, string, string, string]> = {
    dawn: ['#F7A8C8', '#FFC9A8', '#B8E87A', '#6BC93A', '#52B832'],
    day: ['#6EC8F0', '#8ED8A8', '#A8E060', '#5BC93A', '#52B832'],
    dusk: ['#E07A3D', '#F0A060', '#7AB84A', '#4E9A32', '#3A7A28'],
    night: ['#1A2744', '#2A3A62', '#3A5A3A', '#2E4A2E', '#1E3A1E'],
  };

  const overlays: Record<DayPhase, string> = {
    dawn: 'rgba(255,180,140,0.12)',
    day: 'transparent',
    dusk: 'rgba(220,100,40,0.18)',
    night: 'rgba(10,20,50,0.42)',
  };

  const weatherLabel =
    weather === 'sunny'
      ? ''
      : weather === 'cloudy'
        ? ' · Cloudy'
        : weather === 'rain'
          ? ' · Rain'
          : ' · Snow';

  const phaseLabel =
    phase === 'dawn'
      ? 'Dawn'
      : phase === 'day'
        ? 'Day'
        : phase === 'dusk'
          ? 'Dusk'
          : 'Night';

  return {
    phase,
    weather,
    brightness,
    skyColors: skies[phase],
    overlay: overlays[phase],
    label: `${phaseLabel}${weatherLabel}`,
  };
}
