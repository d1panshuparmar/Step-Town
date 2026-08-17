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

import {
  BuildingShadow,
  BuildingSprite,
  FarmBed,
  FogPatch,
  TownMeadow,
  TOWN_TILE,
  buildingColors,
} from '@/components/IsoBlock';
import { CROPS, GRID_SIZE } from '@/constants/catalog';
import { fonts, palette, spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import type { FriendTownSnapshot, Plot } from '@/lib/types';

const TILE_W = TOWN_TILE.W;
const TILE_H = TOWN_TILE.H;

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
              height: boardH + TILE_H * 4,
              marginLeft: width / 2 - TILE_W / 2 - spacing.sm,
            },
            boardStyle,
          ]}>
          <TownMeadow />
          {sorted.map((plot) => (
            <ReadOnlyTile key={plot.id} plot={plot} plots={snapshot.plots} />
          ))}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

function ReadOnlyTile({ plot, plots }: { plot: Plot; plots: Plot[] }) {
  const now = Date.now();
  const pos = isoPos(plot.x, plot.y);
  let emoji = '';
  let label = '';
  let ready = false;
  let mode: 'empty' | 'crop' | 'building' | 'fog' | 'hidden' = 'empty';

  const edge =
    !plot.unlocked &&
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].some(([dx, dy]) =>
      plots.some(
        (p) => p.unlocked && p.x === plot.x + dx && p.y === plot.y + dy
      )
    );

  if (!plot.unlocked) {
    mode = edge ? 'fog' : 'hidden';
  } else if (plot.kind === 'building' && plot.buildingId) {
    mode = 'building';
    const shelf = plot.factoryShelf ?? [];
    const queue = plot.factoryQueue ?? [];
    const readyJobs = queue.filter((j) => j.readyAt <= now);
    if (shelf.length || readyJobs.length) {
      label = 'Ready';
      ready = true;
    } else if (queue.length) {
      const soon = Math.min(...queue.map((j) => j.readyAt));
      label = formatDuration(soon - now);
    } else if (plot.processing && plot.processReadyAt) {
      if (now >= plot.processReadyAt) {
        label = 'Ready';
        ready = true;
      } else label = formatDuration(plot.processReadyAt - now);
    }
  } else if (plot.kind === 'crop' && plot.cropId && plot.readyAt) {
    emoji = CROPS[plot.cropId]?.emoji ?? '🌱';
    mode = 'crop';
    if (now >= plot.readyAt) {
      label = 'Ready';
      ready = true;
    } else label = formatDuration(plot.readyAt - now);
  }

  const colors = buildingColors(plot.buildingId);

  if (mode === 'hidden') {
    return (
      <View
        style={[
          styles.tileWrap,
          {
            left: pos.left,
            top: pos.top,
            zIndex: 0,
            width: TILE_W,
            height: TILE_H + 20,
          },
        ]}
        pointerEvents="none"
      />
    );
  }

  return (
    <View
      style={[
        styles.tileWrap,
        {
          left: pos.left,
          top: pos.top,
          zIndex: plot.x + plot.y + (mode === 'building' ? 2 : 0),
          width: TILE_W,
          height: TILE_H + 56,
        },
      ]}>
      {mode === 'fog' && <FogPatch width={TILE_W - 20} height={TILE_H - 10} />}
      {mode === 'crop' && (
        <FarmBed
          width={TILE_W - 14}
          height={TILE_H - 8}
          ready={ready}
          uid={plot.id}
        />
      )}
      {mode === 'building' && plot.buildingId && (
        <>
          <BuildingShadow width={80} />
          <BuildingSprite
            accent={colors.accent}
            roof={colors.roof}
            uid={plot.id}
            kind={plot.buildingId}
          />
        </>
      )}
      <View style={styles.tileFace}>
        {mode === 'crop' && !!emoji && (
          <Text style={styles.cropEmoji}>{emoji}</Text>
        )}
        {!!label && (
          <View style={[styles.labelPill, ready && styles.labelReady]}>
            <Text style={styles.tileLabel}>{label}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: '#6B9E45',
    backgroundColor: '#5BB83A',
  },
  board: { position: 'relative' },
  tileWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  tileFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  cropEmoji: {
    fontSize: 24,
    marginTop: 6,
  },
  labelPill: {
    marginTop: 2,
    backgroundColor: 'rgba(255,248,230,0.94)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(107,68,35,0.2)',
  },
  labelReady: {
    backgroundColor: '#FFE08A',
    borderColor: '#E0A020',
  },
  tileLabel: {
    fontFamily: fonts.bodyExtra,
    fontSize: 9,
    color: palette.ink,
  },
});
