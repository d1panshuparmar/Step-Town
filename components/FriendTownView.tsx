import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
} from 'react-native-reanimated';

import { BUILDINGS, CROPS, GRID_SIZE } from '@/constants/catalog';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import type { FriendTownSnapshot, Plot } from '@/lib/types';

const TILE = 58;
const GAP = 5;

export function FriendTownView({ snapshot }: { snapshot: FriendTownSnapshot }) {
  const { width, height } = useWindowDimensions();
  const [, setTick] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(12);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const boardSize = GRID_SIZE * (TILE + GAP) + GAP;
  const clampX = Math.max(40, boardSize * 0.35);
  const clampY = Math.max(40, boardSize * 0.35);

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onBegin(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd((e) => {
      translateX.value = withDecay({
        velocity: e.velocityX * 0.8,
        clamp: [-clampX, clampX],
        deceleration: 0.998,
      });
      translateY.value = withDecay({
        velocity: e.velocityY * 0.8,
        clamp: [-clampY, clampY],
        deceleration: 0.998,
      });
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 0.75, 1.4);
    })
    .onEnd(() => {
      scale.value = withSpring(clamp(scale.value, 0.8, 1.3), {
        damping: 16,
        stiffness: 180,
      });
    });

  const gesture = Gesture.Simultaneous(pan, pinch);
  const boardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[styles.viewport, { height: Math.min(360, height * 0.42) }]}>
        <Animated.View
          style={[
            styles.board,
            {
              width: boardSize,
              height: boardSize,
              marginLeft: (width - spacing.sm * 2 - boardSize) / 2,
              marginTop: 14,
            },
            boardStyle,
          ]}>
          {snapshot.plots.map((plot) => (
            <ReadOnlyTile key={plot.id} plot={plot} />
          ))}
        </Animated.View>
        <Text style={styles.hint}>Drag · pinch · view only</Text>
      </Animated.View>
    </GestureDetector>
  );
}

function ReadOnlyTile({ plot }: { plot: Plot }) {
  const now = Date.now();
  let emoji = '';
  let label = '';
  let ready = false;
  let soil = false;

  if (!plot.unlocked) {
    label = '';
  } else if (plot.kind === 'building' && plot.buildingId) {
    emoji = BUILDINGS[plot.buildingId].emoji;
    if (plot.processing && plot.processReadyAt) {
      if (now >= plot.processReadyAt) {
        label = 'Ready';
        ready = true;
      } else label = formatDuration(plot.processReadyAt - now);
    }
  } else if (plot.kind === 'crop' && plot.cropId && plot.readyAt) {
    emoji = CROPS[plot.cropId].emoji;
    soil = true;
    if (now >= plot.readyAt) {
      label = 'Ready';
      ready = true;
    } else label = formatDuration(plot.readyAt - now);
  }

  return (
    <View
      style={[
        styles.tile,
        {
          left: GAP + plot.x * (TILE + GAP),
          top: GAP + plot.y * (TILE + GAP),
        },
        !plot.unlocked && styles.tileLocked,
        plot.unlocked && plot.kind === 'empty' && styles.tileGrass,
        soil && styles.tileSoil,
        ready && styles.tileReady,
      ]}>
      {!!emoji && <Text style={styles.tileEmoji}>{emoji}</Text>}
      {!plot.unlocked && <Text style={styles.lockIcon}>🌫️</Text>}
      {!!label && <Text style={styles.tileLabel}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: '#5D3A1A',
    backgroundColor: '#5A9E45',
  },
  board: { position: 'relative' },
  hint: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
  },
  tile: {
    position: 'absolute',
    width: TILE,
    height: TILE,
    borderRadius: 12,
    backgroundColor: '#7CB342',
    borderWidth: 2,
    borderColor: 'rgba(44,36,22,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tileGrass: { backgroundColor: '#8BC34A' },
  tileSoil: { backgroundColor: '#A67C52', borderColor: '#7A5A3A' },
  tileLocked: { backgroundColor: '#9AAA88', opacity: 0.92 },
  tileReady: { backgroundColor: '#FFD54F', borderColor: '#F9A825' },
  tileEmoji: { fontSize: 24 },
  lockIcon: { fontSize: 16 },
  tileLabel: {
    fontFamily: fonts.bodyExtra,
    fontSize: 9,
    color: palette.ink,
    backgroundColor: 'rgba(255,246,232,0.95)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
});
