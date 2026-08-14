import { useEffect, useState } from 'react';
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

const TILE = 64;
const GAP = 6;

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
  const translateY = useSharedValue(12);
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

  const boardSize = GRID_SIZE * (TILE + GAP) + GAP;
  const clampX = Math.max(40, boardSize * 0.35);
  const clampY = Math.max(40, boardSize * 0.35);
  const viewportH = Math.min(380, Math.max(260, height * 0.42));

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
              ? 'Tap fogged land to expand'
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
          <Animated.View
            style={[
              styles.board,
              {
                width: boardSize,
                height: boardSize,
                marginLeft: (width - spacing.sm * 2 - 6 - boardSize) / 2,
                marginTop: 16,
              },
              boardStyle,
            ]}>
            {plots.map((plot) => (
              <FlatTile
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

function FlatTile({
  plot,
  selected,
  onPress,
}: {
  plot: Plot;
  selected: boolean;
  onPress: () => void;
}) {
  const now = Date.now();
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
        withSpring(1.08, { damping: 8, stiffness: 140 }),
        withSpring(1, { damping: 10, stiffness: 160 })
      );
    }, 1600);
    return () => clearInterval(loop);
  }, [ready, bounce]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.tileWrap,
        {
          left: GAP + plot.x * (TILE + GAP),
          top: GAP + plot.y * (TILE + GAP),
        },
        anim,
      ]}>
      <Pressable
        onPress={() => {
          bounce.value = withSequence(
            withSpring(0.92, { damping: 14, stiffness: 240 }),
            withSpring(1, { damping: 12, stiffness: 180 })
          );
          onPress();
        }}
        style={[
          styles.tile,
          !plot.unlocked && styles.tileLocked,
          plot.unlocked && plot.kind === 'empty' && styles.tileGrass,
          soil && styles.tileSoil,
          ready && styles.tileReady,
          selected && styles.tileSelected,
        ]}>
        {!!emoji && <Text style={styles.tileEmoji}>{emoji}</Text>}
        {!plot.unlocked && <Text style={styles.lockIcon}>🌫️</Text>}
        {!!label && <Text style={styles.tileLabel}>{label}</Text>}
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
    backgroundColor: '#C96A3D',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#8B4518',
  },
  visitorText: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    color: palette.cream,
    fontSize: 13,
  },
  modeBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: palette.wood,
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
    color: palette.cream,
    fontSize: 13,
  },
  cancel: {
    fontFamily: fonts.bodyBold,
    color: palette.coin,
    fontSize: 13,
  },
  cancelDark: {
    fontFamily: fonts.bodyBold,
    color: palette.wood,
    fontSize: 14,
  },
  viewport: {
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: '#5D3A1A',
    backgroundColor: '#5A9E45',
  },
  board: {
    position: 'relative',
  },
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
  tileWrap: {
    position: 'absolute',
    width: TILE,
    height: TILE,
  },
  tile: {
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
  tileSelected: { borderColor: '#FFF59D', borderWidth: 3 },
  tileEmoji: { fontSize: 26 },
  lockIcon: { fontSize: 18 },
  tileLabel: {
    fontFamily: fonts.bodyExtra,
    fontSize: 9,
    color: palette.ink,
    backgroundColor: 'rgba(255,246,232,0.95)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    overflow: 'hidden',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20,16,10,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: palette.panel,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: palette.woodLight,
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
