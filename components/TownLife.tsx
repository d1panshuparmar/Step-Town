import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { DayPhase } from '@/lib/atmosphere';

type Walker = {
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  duration: number;
  delay: number;
  color: string;
  size: number;
};

type Car = {
  x0: number;
  y0: number;
  dx: number;
  dy: number;
  duration: number;
  delay: number;
  color: string;
  w: number;
  h: number;
};

const PEOPLE: Walker[] = [
  { x0: 40, y0: 90, dx: 120, dy: 40, duration: 9000, delay: 0, color: '#E87060', size: 7 },
  { x0: 160, y0: 130, dx: -90, dy: 30, duration: 11000, delay: 800, color: '#5BA8F5', size: 7 },
  { x0: 90, y0: 160, dx: 70, dy: -50, duration: 10000, delay: 1400, color: '#F5C542', size: 6 },
  { x0: 200, y0: 80, dx: -60, dy: 70, duration: 12000, delay: 400, color: '#7AD850', size: 7 },
];

const CARS: Car[] = [
  { x0: 20, y0: 110, dx: 180, dy: 55, duration: 14000, delay: 0, color: '#E84848', w: 14, h: 8 },
  { x0: 210, y0: 150, dx: -160, dy: -40, duration: 18000, delay: 2000, color: '#3D8FE8', w: 16, h: 9 },
  { x0: 60, y0: 180, dx: 130, dy: -30, duration: 16000, delay: 3500, color: '#F5A623', w: 15, h: 8 },
];

function MovingDot({
  actor,
  paused,
}: {
  actor: Walker;
  paused?: boolean;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      t.value = 0;
      return;
    }
    t.value = withDelay(
      actor.delay,
      withRepeat(
        withTiming(1, {
          duration: actor.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, [actor.delay, actor.duration, paused, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: actor.x0 + actor.dx * t.value },
      { translateY: actor.y0 + actor.dy * t.value },
    ],
    opacity: paused ? 0.2 : 0.95,
  }));

  return (
    <Animated.View style={[styles.actor, style]} pointerEvents="none">
      <View
        style={[
          styles.person,
          {
            width: actor.size,
            height: actor.size * 1.35,
            backgroundColor: actor.color,
            borderRadius: actor.size,
          },
        ]}
      />
    </Animated.View>
  );
}

function MovingCar({
  car,
  paused,
}: {
  car: Car;
  paused?: boolean;
}) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (paused) {
      t.value = 0;
      return;
    }
    t.value = withDelay(
      car.delay,
      withRepeat(
        withTiming(1, {
          duration: car.duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true
      )
    );
  }, [car.delay, car.duration, paused, t]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: car.x0 + car.dx * t.value },
      { translateY: car.y0 + car.dy * t.value },
    ],
    opacity: paused ? 0.15 : 0.9,
  }));

  return (
    <Animated.View style={[styles.actor, style]} pointerEvents="none">
      <View
        style={[
          styles.car,
          {
            width: car.w,
            height: car.h,
            backgroundColor: car.color,
          },
        ]}
      />
    </Animated.View>
  );
}

/** Lightweight citizens + traffic — oval dots & tiny cars, no toy emoji. */
export function TownLife({
  phase,
  reduceMotion,
  population,
}: {
  phase: DayPhase;
  reduceMotion?: boolean;
  population: number;
}) {
  const night = phase === 'night';
  const citizenCount = Math.min(
    PEOPLE.length,
    Math.max(1, Math.floor(population / 2) + (night ? 1 : 2))
  );
  const vehicleCount = Math.min(
    CARS.length,
    night ? 1 : Math.max(1, Math.floor(population / 4) + 1)
  );

  return (
    <View style={styles.wrap} pointerEvents="none">
      {PEOPLE.slice(0, citizenCount).map((c, i) => (
        <MovingDot key={`c${i}`} actor={c} paused={reduceMotion} />
      ))}
      {CARS.slice(0, vehicleCount).map((v, i) => (
        <MovingCar key={`v${i}`} car={v} paused={reduceMotion || night} />
      ))}
      {night && (
        <>
          <View style={[styles.lampGlow, { left: 70, top: 100 }]} />
          <View style={[styles.lampGlow, { left: 170, top: 140 }]} />
          <View style={[styles.lampGlow, { left: 120, top: 180 }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFill,
    zIndex: 3,
  },
  actor: {
    position: 'absolute',
  },
  person: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  car: {
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  lampGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,230,120,0.45)',
  },
});
