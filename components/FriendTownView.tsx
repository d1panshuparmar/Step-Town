import { useEffect, useMemo, useState } from 'react';
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

const TILE_W = 72;
const TILE_H = 40;

function isoPos(x: number, y: number) {
  return {
    left: (x - y) * (TILE_W / 2),
    top: (x + y) * (TILE_H / 2),
  };
}

export function FriendTownView({ snapshot }: { snapshot: FriendTownSnapshot }) {
  const { width, height } = useWindowDimensions();
  const [, setTick] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(20);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const sorted = useMemo(
    () =>
      [...snapshot.plots].sort(
        (a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x
      ),
    [snapshot.plots]
  );

  const boardW = GRID_SIZE * TILE_W;
  const boardH = GRID_SIZE * TILE_H;
  const clampX = boardW * 0.5;
  const clampY = boardH * 0.4;

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
        deceleration: 0.997,
      });
      translateY.value = withDecay({
        velocity: e.velocityY * 0.8,
        clamp: [-clampY, clampY],
        deceleration: 0.997,
      });
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 0.72, 1.45);
    })
    .onEnd(() => {
      scale.value = withSpring(clamp(scale.value, 0.78, 1.3), {
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
              width: boardW + TILE_W,
              height: boardH + TILE_H * 3,
              marginLeft: width / 2 - TILE_W / 2 - spacing.sm,
            },
            boardStyle,
          ]}>
          {sorted.map((plot) => (
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
  const pos = isoPos(plot.x, plot.y);
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
        styles.tileWrap,
        { left: pos.left, top: pos.top, zIndex: plot.x + plot.y },
      ]}>
      <View
        style={[
          styles.diamond,
          !plot.unlocked && styles.diamondLocked,
          plot.unlocked && plot.kind === 'empty' && styles.diamondGrass,
          soil && styles.diamondSoil,
          ready && styles.diamondReady,
        ]}
      />
      <View style={styles.tileFace}>
        {!!emoji && <Text style={styles.tileEmoji}>{emoji}</Text>}
        {!plot.unlocked && <Text style={styles.lockIcon}>🌫️</Text>}
        {plot.unlocked && plot.kind === 'empty' && !emoji && (
          <Text style={styles.grassTuft}>🌿</Text>
        )}
        {!!label && <Text style={styles.tileLabel}>{label}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: '#6B4423',
    backgroundColor: '#5FAF45',
  },
  board: { position: 'relative' },
  hint: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },
  tileWrap: {
    position: 'absolute',
    width: TILE_W,
    height: TILE_H + 34,
    alignItems: 'center',
  },
  diamond: {
    position: 'absolute',
    top: 10,
    width: TILE_W - 10,
    height: TILE_W - 10,
    backgroundColor: '#7AC943',
    transform: [{ rotate: '45deg' }, { scaleY: 0.55 }],
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(60, 40, 15, 0.22)',
  },
  diamondGrass: {
    backgroundColor: '#8EDB52',
    borderColor: '#5AA32E',
  },
  diamondSoil: {
    backgroundColor: '#C49A6C',
    borderColor: '#8B6844',
  },
  diamondLocked: {
    backgroundColor: '#A8B89A',
    opacity: 0.88,
  },
  diamondReady: {
    backgroundColor: '#FFD54F',
    borderColor: '#F0A020',
  },
  tileFace: {
    marginTop: 12,
    alignItems: 'center',
    zIndex: 2,
  },
  tileEmoji: { fontSize: 26 },
  grassTuft: { fontSize: 12, opacity: 0.85 },
  lockIcon: { fontSize: 16 },
  tileLabel: {
    fontFamily: fonts.bodyExtra,
    fontSize: 9,
    color: palette.ink,
    backgroundColor: 'rgba(255,248,230,0.95)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 2,
  },
});
