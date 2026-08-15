import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Body, PrimaryButton, SecondaryButton } from '@/components/ui';
import { BUILDINGS, CROPS, GRID_SIZE } from '@/constants/catalog';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import type { BuildingId, CropId, Plot } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

/** Township-like isometric tile size */
const TILE_W = 78;
const TILE_H = 44;

function isoPos(x: number, y: number) {
  return {
    left: (x - y) * (TILE_W / 2),
    top: (x + y) * (TILE_H / 2),
  };
}

export function TownGrid() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const plots = useGameStore((s) => s.plots);
  const placeMode = useGameStore((s) => s.placeMode);
  const selected = useGameStore((s) => s.selectedShopItem);
  const visitor = useGameStore((s) => s.visitor);
  const unlockPlot = useGameStore((s) => s.unlockPlot);
  const placeBuilding = useGameStore((s) => s.placeBuilding);
  const plantCrop = useGameStore((s) => s.plantCrop);
  const harvestPlot = useGameStore((s) => s.harvestPlot);
  const startFactory = useGameStore((s) => s.startFactory);
  const collectFactory = useGameStore((s) => s.collectFactory);
  const setPlaceMode = useGameStore((s) => s.setPlaceMode);
  const dismissVisitor = useGameStore((s) => s.dismissVisitor);
  const maybeSpawnVisitor = useGameStore((s) => s.maybeSpawnVisitor);

  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null);
  const [, setTick] = useState(0);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(28);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    maybeSpawnVisitor();
    const id = setInterval(() => maybeSpawnVisitor(), 120_000);
    return () => clearInterval(id);
  }, [maybeSpawnVisitor]);

  const sortedPlots = useMemo(
    () => [...plots].sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x),
    [plots]
  );

  const boardW = GRID_SIZE * TILE_W;
  const boardH = GRID_SIZE * TILE_H;
  const clampX = boardW * 0.55;
  const clampY = boardH * 0.45;
  const viewportH = Math.min(420, Math.max(280, height * 0.46));

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
        velocity: e.velocityX * 0.82,
        clamp: [-clampX, clampX],
        deceleration: 0.997,
      });
      translateY.value = withDecay({
        velocity: e.velocityY * 0.82,
        clamp: [-clampY * 0.6, clampY],
        deceleration: 0.997,
      });
    });

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 0.72, 1.5);
    })
    .onEnd(() => {
      scale.value = withSpring(clamp(scale.value, 0.78, 1.35), {
        damping: 15,
        stiffness: 170,
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

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) ?? null;

  const handleTile = (plot: Plot) => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (placeMode === 'expand' && !plot.unlocked) {
      const res = unlockPlot(plot.id);
      if (!res.ok) Alert.alert('Land', res.message);
      return;
    }
    if (placeMode === 'building' && selected && plot.unlocked) {
      const res = placeBuilding(plot.id, selected as BuildingId);
      if (!res.ok) Alert.alert('Build', res.message);
      return;
    }
    if (placeMode === 'crop' && selected && plot.unlocked) {
      const res = plantCrop(plot.id, selected as CropId);
      if (!res.ok) Alert.alert('Plant', res.message);
      return;
    }
    setSelectedPlotId(plot.id);
  };

  return (
    <View style={styles.wrap}>
      {visitor?.active && visitor.expiresAt > Date.now() && (
        <View style={styles.visitorBanner}>
          <Text style={styles.visitorText}>{visitor.message}</Text>
          <Pressable onPress={dismissVisitor}>
            <Text style={styles.cancel}>Dismiss</Text>
          </Pressable>
        </View>
      )}

      {placeMode !== 'none' && (
        <View style={styles.modeBanner}>
          <Text style={styles.modeText}>
            {placeMode === 'expand'
              ? 'Tap foggy land to expand your township'
              : placeMode === 'crop'
                ? `Plant ${CROPS[selected as string]?.name ?? ''}`
                : `Place ${BUILDINGS[selected as string]?.name ?? ''}`}
          </Text>
          <Pressable onPress={() => setPlaceMode('none')}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.viewport, { height: viewportH }]}>
          <View style={styles.fieldWash} />
          <Animated.View
            style={[
              styles.board,
              {
                width: boardW + TILE_W,
                height: boardH + TILE_H * 3,
                marginLeft: width / 2 - TILE_W / 2,
              },
              boardStyle,
            ]}>
            {sortedPlots.map((plot) => (
              <IsoTile
                key={plot.id}
                plot={plot}
                selected={selectedPlotId === plot.id}
                onPress={() => handleTile(plot)}
              />
            ))}
          </Animated.View>
          <Text style={styles.hint}>Drag · pinch · tap a plot</Text>
        </Animated.View>
      </GestureDetector>

      <Modal
        visible={!!selectedPlot}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlotId(null)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedPlotId(null)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
            onPress={(e) => e.stopPropagation()}>
            {selectedPlot && (
              <PlotSheet
                plot={selectedPlot}
                onClose={() => setSelectedPlotId(null)}
                onHarvest={() => {
                  const res = harvestPlot(selectedPlot.id);
                  if (!res.ok) Alert.alert('Harvest', res.message);
                  else {
                    void Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    ).catch(() => undefined);
                    setSelectedPlotId(null);
                  }
                }}
                onStart={() => {
                  const res = startFactory(selectedPlot.id);
                  if (!res.ok) Alert.alert('Factory', res.message);
                }}
                onCollect={() => {
                  const res = collectFactory(selectedPlot.id);
                  if (!res.ok) Alert.alert('Factory', res.message);
                  else {
                    void Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    ).catch(() => undefined);
                  }
                }}
                onUnlock={() => {
                  const res = unlockPlot(selectedPlot.id);
                  if (!res.ok) Alert.alert('Land', res.message);
                  else setSelectedPlotId(null);
                }}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function IsoTile({
  plot,
  selected,
  onPress,
}: {
  plot: Plot;
  selected: boolean;
  onPress: () => void;
}) {
  const now = Date.now();
  const pos = isoPos(plot.x, plot.y);
  const bounce = useSharedValue(1);

  let emoji = '';
  let label = '';
  let ready = false;
  let soil = false;

  if (!plot.unlocked) {
    label = `${plot.unlockCost}`;
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
      label = 'Pick';
      ready = true;
    } else label = formatDuration(plot.readyAt - now);
  }

  useEffect(() => {
    if (!ready) {
      bounce.value = withTiming(1, { duration: 160 });
      return;
    }
    const loop = setInterval(() => {
      bounce.value = withSequence(
        withSpring(1.1, { damping: 7, stiffness: 150 }),
        withSpring(1, { damping: 9, stiffness: 160 })
      );
    }, 1500);
    return () => clearInterval(loop);
  }, [ready, bounce]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.tileWrap,
        { left: pos.left, top: pos.top, zIndex: plot.x + plot.y },
        anim,
      ]}>
      <Pressable
        onPress={() => {
          bounce.value = withSequence(
            withSpring(0.9, { damping: 14, stiffness: 240 }),
            withSpring(1, { damping: 11, stiffness: 180 })
          );
          onPress();
        }}
        style={styles.tileHit}>
        <View style={styles.tileShadow} />
        <View
          style={[
            styles.diamond,
            !plot.unlocked && styles.diamondLocked,
            plot.unlocked && plot.kind === 'empty' && styles.diamondGrass,
            soil && styles.diamondSoil,
            ready && styles.diamondReady,
            selected && styles.diamondSelected,
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
      </Pressable>
    </Animated.View>
  );
}

function PlotSheet({
  plot,
  onClose,
  onHarvest,
  onStart,
  onCollect,
  onUnlock,
}: {
  plot: Plot;
  onClose: () => void;
  onHarvest: () => void;
  onStart: () => void;
  onCollect: () => void;
  onUnlock: () => void;
}) {
  const now = Date.now();
  const inventory = useGameStore((s) => s.inventory);

  let title = 'Empty plot';
  let detail = 'Plant crops from the Shop, or place a building.';
  let action: { label: string; onPress: () => void } | null = null;

  if (!plot.unlocked) {
    title = 'Locked land';
    detail = `Spend ${plot.unlockCost} coins (level ${plot.unlockLevel}+).`;
    action = { label: `Unlock · ${plot.unlockCost} 🪙`, onPress: onUnlock };
  } else if (plot.kind === 'crop' && plot.cropId && plot.readyAt) {
    const def = CROPS[plot.cropId];
    title = def.name;
    if (now >= plot.readyAt) {
      detail = `Ready · +${def.yieldQty} ${def.name}`;
      action = { label: 'Harvest', onPress: onHarvest };
    } else {
      detail = `Growing · ${formatDuration(plot.readyAt - now)}`;
    }
  } else if (plot.kind === 'building' && plot.buildingId) {
    const def = BUILDINGS[plot.buildingId];
    title = def.name;
    detail = def.description;
    if (def.recipe) {
      const r = def.recipe;
      if (plot.processing && plot.processReadyAt) {
        if (now >= plot.processReadyAt) {
          detail = 'Production ready!';
          action = { label: 'Collect', onPress: onCollect };
        } else {
          detail = `Working · ${formatDuration(plot.processReadyAt - now)}`;
        }
      } else {
        detail = `${r.inputQty} ${r.input} → ${r.outputQty} ${r.output} (have ${inventory[r.input]})`;
        action = { label: 'Start', onPress: onStart };
      }
    }
  }

  return (
    <View style={styles.sheetInner}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.cancelDark}>Close</Text>
        </Pressable>
      </View>
      <Body muted>{detail}</Body>
      <View style={styles.sheetActions}>
        {action ? (
          <PrimaryButton label={action.label} onPress={action.onPress} />
        ) : (
          <SecondaryButton label="Got it" onPress={onClose} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, marginTop: spacing.sm },
  visitorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#E07A3D',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#A85A28',
  },
  visitorText: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    color: '#FFF8EC',
    fontSize: 13,
  },
  modeBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#7A4E2D',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  modeText: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    color: '#FFF8EC',
    fontSize: 13,
  },
  cancel: {
    fontFamily: fonts.bodyBold,
    color: '#FFE08A',
    fontSize: 13,
  },
  cancelDark: {
    fontFamily: fonts.bodyBold,
    color: '#7A4E2D',
    fontSize: 14,
  },
  viewport: {
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#6B4423',
    backgroundColor: '#5FAF45',
  },
  fieldWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(40, 110, 35, 0.22)',
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
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowRadius: 3,
  },
  tileWrap: {
    position: 'absolute',
    width: TILE_W,
    height: TILE_H + 36,
  },
  tileHit: {
    width: TILE_W,
    height: TILE_H + 36,
    alignItems: 'center',
  },
  tileShadow: {
    position: 'absolute',
    top: 18,
    width: TILE_W - 16,
    height: TILE_W - 16,
    backgroundColor: 'rgba(20, 50, 10, 0.28)',
    transform: [{ rotate: '45deg' }, { scaleY: 0.55 }, { translateY: 5 }],
    borderRadius: 8,
  },
  diamond: {
    position: 'absolute',
    top: 10,
    width: TILE_W - 10,
    height: TILE_W - 10,
    backgroundColor: '#7AC943',
    transform: [{ rotate: '45deg' }, { scaleY: 0.55 }],
    borderRadius: 9,
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
  diamondSelected: {
    borderColor: '#FFF59D',
    borderWidth: 3,
  },
  tileFace: {
    marginTop: 14,
    alignItems: 'center',
    zIndex: 2,
  },
  tileEmoji: {
    fontSize: 30,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  grassTuft: { fontSize: 14, opacity: 0.85 },
  lockIcon: { fontSize: 18 },
  tileLabel: {
    fontFamily: fonts.bodyExtra,
    fontSize: 10,
    color: palette.ink,
    backgroundColor: 'rgba(255,248,230,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 2,
    borderWidth: 1,
    borderColor: 'rgba(107,68,35,0.18)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,16,10,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFF4DF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: '#C4A484',
  },
  sheetInner: { gap: 10 },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    color: palette.ink,
  },
  sheetActions: { marginTop: 4, marginBottom: 4 },
});
