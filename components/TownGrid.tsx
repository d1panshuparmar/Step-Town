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
import { router } from 'expo-router';
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

import { AirportBoard } from '@/components/AirportBoard';
import { BalloonPopGame } from '@/components/BalloonPopGame';
import { BarnSheet } from '@/components/BarnSheet';
import { DailyRewardSheet } from '@/components/DailyRewardSheet';
import { FactorySheet } from '@/components/FactorySheet';
import { FishingSheet } from '@/components/FishingSheet';
import { HelicopterPad } from '@/components/HelicopterPad';
import {
  BuildingShadow,
  BuildingSprite,
  FarmBed,
  FogPatch,
  SelectGlow,
  TownMeadow,
  TOWN_TILE,
  buildingColors,
} from '@/components/IsoBlock';
import { TownLife } from '@/components/TownLife';
import { TrainStation } from '@/components/TrainStation';
import { TutorialCoach } from '@/components/TutorialCoach';
import { AcademySheet, ZooSheet } from '@/components/ZooAcademySheets';
import { Body, PrimaryButton, SecondaryButton } from '@/components/ui';
import { BUILDINGS, CROPS, GRID_SIZE } from '@/constants/catalog';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import type { DayPhase } from '@/lib/atmosphere';
import { formatDuration } from '@/lib/date';
import { cropGrowthStage } from '@/lib/offline';
import { GEM_SPEEDUP_COST } from '@/lib/townshipExtras';
import { townPopulation } from '@/lib/townStats';
import type { BuildingId, CropId, Plot } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

const TILE_W = TOWN_TILE.W;
const TILE_H = TOWN_TILE.H;

function isoPos(x: number, y: number) {
  return {
    left: (x - y) * (TILE_W / 2),
    top: (x + y) * (TILE_H / 2),
  };
}

function isExpandEdge(plot: Plot, plots: Plot[]): boolean {
  if (plot.unlocked) return false;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  return dirs.some(([dx, dy]) =>
    plots.some(
      (p) => p.unlocked && p.x === plot.x + dx && p.y === plot.y + dy
    )
  );
}

type Sheet =
  | { type: 'plot'; plotId: string }
  | { type: 'factory'; plotId: string }
  | { type: 'barn' }
  | { type: 'heli' }
  | { type: 'train' }
  | { type: 'airport' }
  | { type: 'zoo' }
  | { type: 'academy' }
  | { type: 'daily' }
  | { type: 'fish' }
  | null;

export function TownGrid({
  atmospherePhase = 'day',
}: {
  atmospherePhase?: DayPhase;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const plots = useGameStore((s) => s.plots);
  const placeMode = useGameStore((s) => s.placeMode);
  const selected = useGameStore((s) => s.selectedShopItem);
  const moveFromPlotId = useGameStore((s) => s.moveFromPlotId);
  const visitor = useGameStore((s) => s.visitor);
  const unlockPlot = useGameStore((s) => s.unlockPlot);
  const placeBuilding = useGameStore((s) => s.placeBuilding);
  const plantCrop = useGameStore((s) => s.plantCrop);
  const harvestPlot = useGameStore((s) => s.harvestPlot);
  const setPlaceMode = useGameStore((s) => s.setPlaceMode);
  const sellBuilding = useGameStore((s) => s.sellBuilding);
  const beginMoveBuilding = useGameStore((s) => s.beginMoveBuilding);
  const completeMoveBuilding = useGameStore((s) => s.completeMoveBuilding);
  const dismissVisitor = useGameStore((s) => s.dismissVisitor);
  const maybeSpawnVisitor = useGameStore((s) => s.maybeSpawnVisitor);
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion);
  const sfx = useGameStore((s) => s.settings.sfx);

  const townName = useGameStore((s) => s.player.townName);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [miniGame, setMiniGame] = useState(false);
  const [, setTick] = useState(0);
  const pop = townPopulation(plots);

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
  const viewportH = Math.max(280, height - insets.top - 168);

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

  const selectedPlot =
    sheet?.type === 'plot' || sheet?.type === 'factory'
      ? plots.find((p) => p.id === sheet.plotId) ?? null
      : null;

  const handleTile = (plot: Plot) => {
    if (sfx) void Haptics.selectionAsync().catch(() => undefined);
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
    if (placeMode === 'move') {
      if (moveFromPlotId) {
        const res = completeMoveBuilding(plot.id);
        if (!res.ok) Alert.alert('Move', res.message);
        return;
      }
      if (plot.kind === 'building' && plot.buildingId) {
        const res = beginMoveBuilding(plot.id);
        if (!res.ok) Alert.alert('Move', res.message);
        return;
      }
      Alert.alert('Move', 'Tap a building');
      return;
    }
    if (placeMode === 'sell') {
      if (plot.kind === 'building' && plot.buildingId) {
        Alert.alert(
          'Sell?',
          '~40% refund',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sell',
              style: 'destructive',
              onPress: () => {
                const res = sellBuilding(plot.id);
                if (!res.ok) Alert.alert('Sell', res.message);
              },
            },
          ]
        );
        return;
      }
      Alert.alert('Sell', 'Tap a building');
      return;
    }
    if (
      plot.unlocked &&
      plot.kind === 'building' &&
      plot.buildingId &&
      BUILDINGS[plot.buildingId]?.kind === 'factory'
    ) {
      setSheet({ type: 'factory', plotId: plot.id });
      return;
    }
    if (
      plot.unlocked &&
      plot.kind === 'building' &&
      plot.buildingId === 'barn'
    ) {
      setSheet({ type: 'barn' });
      return;
    }
    setSheet({ type: 'plot', plotId: plot.id });
  };

  return (
    <View style={styles.wrap}>
      {visitor?.active && visitor.expiresAt > Date.now() && (
        <View style={styles.visitorBanner}>
          <Text style={styles.visitorText} numberOfLines={1}>
            {visitor.message}
          </Text>
          <Pressable onPress={() => setSheet({ type: 'heli' })}>
            <Text style={styles.cancel}>🚁</Text>
          </Pressable>
          <Pressable onPress={dismissVisitor}>
            <Text style={styles.cancel}>✕</Text>
          </Pressable>
        </View>
      )}

      {placeMode !== 'none' && (
        <View style={styles.modeBanner}>
          <Text style={styles.modeText}>
            {placeMode === 'expand'
              ? 'Expand'
              : placeMode === 'crop'
                ? 'Plant'
                : placeMode === 'move'
                  ? 'Move'
                  : placeMode === 'sell'
                    ? 'Sell'
                    : 'Place'}
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
                width: boardW + TILE_W,
                height: boardH + TILE_H * 4,
                marginLeft: width / 2 - TILE_W / 2,
                marginTop: 48,
              },
              boardStyle,
            ]}>
            <TownMeadow />
            <TownLife
              phase={atmospherePhase}
              reduceMotion={reduceMotion}
              population={pop}
            />
            {sortedPlots.map((plot) => (
              <IsoTile
                key={plot.id}
                plot={plot}
                plots={plots}
                placeMode={placeMode}
                selected={
                  ((sheet?.type === 'plot' || sheet?.type === 'factory') &&
                    sheet.plotId === plot.id) ||
                  moveFromPlotId === plot.id
                }
                onPress={() => handleTile(plot)}
              />
            ))}
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Township-style bottom dock */}
      <View
        style={[styles.dock, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.dockLeft}>
          <DockBtn
            emoji="👯"
            onPress={() => router.push('/(tabs)/friends')}
          />
          <DockBtn
            emoji="🎁"
            tint="#F5A623"
            onPress={() => setSheet({ type: 'daily' })}
          />
          <DockBtn
            emoji="🎣"
            tint="#5EC8E8"
            onPress={() => setSheet({ type: 'fish' })}
          />
          <DockBtn
            emoji="📜"
            tint="#E07A3D"
            onPress={() => router.push('/(tabs)/quests')}
          />
          <DockBtn emoji="🎈" tint="#E88AC8" onPress={() => setMiniGame(true)} />
          <DockBtn
            emoji="✥"
            tint="#5ECF4A"
            onPress={() => setPlaceMode('move')}
          />
        </View>
        <View style={styles.welcomeSign}>
          <Text style={styles.welcomeTitle} numberOfLines={1}>
            {townName || 'My Town'}
          </Text>
        </View>
        <View style={styles.dockRight}>
          <DockBtn emoji="🚁" onPress={() => setSheet({ type: 'heli' })} />
          <DockBtn emoji="🚂" onPress={() => setSheet({ type: 'train' })} />
          <DockBtn emoji="🏚️" onPress={() => setSheet({ type: 'barn' })} />
          <DockBtn
            emoji="👷"
            tint="#F5C542"
            big
            onPress={() => router.push('/(tabs)/shop')}
          />
        </View>
      </View>

      <TutorialCoach onOpenQuests={() => router.push('/(tabs)/quests')} />
      <BalloonPopGame visible={miniGame} onClose={() => setMiniGame(false)} />

      <Modal
        visible={!!sheet}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSheet(null)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
            onPress={(e) => e.stopPropagation()}>
            {sheet?.type === 'barn' && (
              <BarnSheet onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'heli' && (
              <HelicopterPad onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'train' && (
              <TrainStation onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'airport' && (
              <AirportBoard onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'zoo' && (
              <ZooSheet onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'academy' && (
              <AcademySheet onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'daily' && (
              <DailyRewardSheet onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'fish' && (
              <FishingSheet onClose={() => setSheet(null)} />
            )}
            {sheet?.type === 'factory' && selectedPlot && (
              <FactorySheet
                plot={selectedPlot}
                onClose={() => setSheet(null)}
              />
            )}
            {sheet?.type === 'plot' && selectedPlot && (
              <PlotSheet
                plot={selectedPlot}
                onClose={() => setSheet(null)}
                onHarvest={() => {
                  const res = harvestPlot(selectedPlot.id);
                  if (!res.ok) {
                    Alert.alert('Harvest', res.message);
                    if (res.message?.includes('Barn')) setSheet({ type: 'barn' });
                  } else {
                    void Haptics.notificationAsync(
                      Haptics.NotificationFeedbackType.Success
                    ).catch(() => undefined);
                    setSheet(null);
                  }
                }}
                onUnlock={() => {
                  const res = unlockPlot(selectedPlot.id);
                  if (!res.ok) Alert.alert('Land', res.message);
                  else setSheet(null);
                }}
                onOpenFactory={() =>
                  setSheet({ type: 'factory', plotId: selectedPlot.id })
                }
                onOpenBarn={() => setSheet({ type: 'barn' })}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DockBtn({
  emoji,
  onPress,
  tint,
  big,
}: {
  emoji: string;
  onPress: () => void;
  tint?: string;
  big?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.dockBtn,
        big && styles.dockBtnBig,
        tint ? { backgroundColor: tint } : null,
      ]}>
      <View style={styles.dockGloss} />
      <Text style={[styles.dockEmoji, big && styles.dockEmojiBig]}>{emoji}</Text>
    </Pressable>
  );
}

function IsoTile({
  plot,
  plots,
  placeMode,
  selected,
  onPress,
}: {
  plot: Plot;
  plots: Plot[];
  placeMode: string;
  selected: boolean;
  onPress: () => void;
}) {
  const now = Date.now();
  const pos = isoPos(plot.x, plot.y);
  const bounce = useSharedValue(1);
  const edge = isExpandEdge(plot, plots);

  let emoji = '';
  let label = '';
  let ready = false;
  let mode: 'empty' | 'crop' | 'building' | 'fog' | 'hidden' = 'empty';
  let fogPrice: number | undefined;

  if (!plot.unlocked) {
    // Only show mist on the town edge — distant locked land stays continuous meadow
    if (edge || placeMode === 'expand') {
      mode = 'fog';
      fogPrice = plot.unlockCost;
    } else {
      mode = 'hidden';
    }
  } else if (plot.kind === 'building' && plot.buildingId) {
    mode = 'building';
    const def = BUILDINGS[plot.buildingId];
    if (def?.kind === 'factory') {
      const shelf = plot.factoryShelf ?? [];
      const queue = plot.factoryQueue ?? [];
      const readyJobs = queue.filter((j) => j.readyAt <= now);
      if (shelf.length || readyJobs.length) {
        label = 'Collect';
        ready = true;
        emoji = def.emoji ?? '🍞';
      } else if (queue.length) {
        const soon = Math.min(...queue.map((j) => j.readyAt));
        label = formatDuration(soon - now);
      }
    }
  } else if (plot.kind === 'crop' && plot.cropId && plot.readyAt) {
    emoji = CROPS[plot.cropId]?.emoji ?? '🌱';
    mode = 'crop';
    if (now >= plot.readyAt) {
      label = 'Pick';
      ready = true;
    } else label = formatDuration(plot.readyAt - now);
  }

  const colors = buildingColors(plot.buildingId);
  const growthStage =
    mode === 'crop'
      ? cropGrowthStage(plot.plantedAt, plot.readyAt, now)
      : 3;
  const cropOpacity = ready ? 1 : growthStage === 1 ? 0.45 : growthStage === 2 ? 0.75 : 0.95;
  const cropSize = ready ? 30 : growthStage === 1 ? 16 : growthStage === 2 ? 22 : 26;

  useEffect(() => {
    if (!ready) {
      bounce.value = withTiming(1, { duration: 160 });
      return;
    }
    const loop = setInterval(() => {
      bounce.value = withSequence(
        withSpring(1.08, { damping: 7, stiffness: 150 }),
        withSpring(1, { damping: 9, stiffness: 160 })
      );
    }, 1500);
    return () => clearInterval(loop);
  }, [ready, bounce]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: bounce.value }],
  }));

  // Distant locked land: invisible (meadow shows through) but still hit-testable in expand
  if (mode === 'hidden' && placeMode !== 'expand') {
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
    <Animated.View
      style={[
        styles.tileWrap,
        {
          left: pos.left,
          top: pos.top,
          zIndex: plot.x + plot.y + (mode === 'building' ? 2 : 0),
          width: TILE_W,
          height: TILE_H + 56,
        },
        anim,
      ]}>
      <Pressable
        onPress={() => {
          bounce.value = withSequence(
            withSpring(0.94, { damping: 14, stiffness: 240 }),
            withSpring(1, { damping: 11, stiffness: 180 })
          );
          onPress();
        }}
        style={styles.tileHit}>
        {selected && mode !== 'fog' && (
          <SelectGlow width={TILE_W - 8} height={TILE_H} />
        )}

        {mode === 'fog' && (
          <FogPatch
            width={TILE_W - 20}
            height={TILE_H - 10}
            selected={selected}
            price={fogPrice}
          />
        )}

        {mode === 'crop' && (
          <FarmBed
            width={TILE_W - 14}
            height={TILE_H - 8}
            ready={ready}
            selected={selected}
            uid={plot.id}
          />
        )}

        {mode === 'building' && plot.buildingId && (
          <>
            <BuildingShadow width={80} />
            <BuildingSprite
              accent={colors.accent}
              roof={colors.roof}
              selected={selected}
              uid={plot.id}
              kind={plot.buildingId}
            />
          </>
        )}

        {/* Empty unlocked plots stay invisible — continuous meadow underneath */}

        <View style={styles.tileFace}>
          {mode === 'crop' && !!emoji && (
            <Text
              style={[
                styles.cropEmoji,
                ready && styles.cropReady,
                {
                  opacity: cropOpacity,
                  fontSize: cropSize,
                },
              ]}>
              {emoji}
            </Text>
          )}
          {mode === 'building' && ready && (
            <View style={styles.labelReady}>
              <Text style={styles.readyBubble}>{emoji || '✓'}</Text>
            </View>
          )}
          {mode !== 'fog' && !!label && !ready && (
            <View style={styles.labelPill}>
              <Text style={styles.tileLabel}>{label}</Text>
            </View>
          )}
          {mode === 'crop' && ready && (
            <View style={styles.labelReady}>
              <Text style={styles.readyBubble}>{emoji}</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function PlotSheet({
  plot,
  onClose,
  onHarvest,
  onUnlock,
  onOpenFactory,
  onOpenBarn,
}: {
  plot: Plot;
  onClose: () => void;
  onHarvest: () => void;
  onUnlock: () => void;
  onOpenFactory: () => void;
  onOpenBarn: () => void;
}) {
  const now = Date.now();
  const gems = useGameStore((s) => s.player.gems);
  const gemSpeedUpCrop = useGameStore((s) => s.gemSpeedUpCrop);
  const beginMoveBuilding = useGameStore((s) => s.beginMoveBuilding);
  const sellBuilding = useGameStore((s) => s.sellBuilding);

  let title = 'Empty';
  let detail = '';
  let action: { label: string; onPress: () => void } | null = null;
  const growing =
    plot.kind === 'crop' &&
    plot.cropId &&
    plot.readyAt &&
    now < plot.readyAt;

  if (!plot.unlocked) {
    title = 'Locked land';
    detail = `Spend ${plot.unlockCost} coins (level ${plot.unlockLevel}+).`;
    action = { label: `Unlock · ${plot.unlockCost} 🪙`, onPress: onUnlock };
  } else if (plot.kind === 'crop' && plot.cropId && plot.readyAt) {
    const def = CROPS[plot.cropId];
    title = def?.name ?? 'Crop';
    if (now >= plot.readyAt) {
      detail = `Ready · +${def?.yieldQty ?? 0} ${def?.name ?? ''}`;
      action = { label: 'Harvest', onPress: onHarvest };
    } else {
      detail = `Growing · ${formatDuration(plot.readyAt - now)}`;
    }
  } else if (plot.kind === 'building' && plot.buildingId) {
    const def = BUILDINGS[plot.buildingId];
    title = def?.name ?? 'Building';
    detail = def?.description ?? '';
    if (def?.kind === 'factory') {
      action = { label: 'Open factory', onPress: onOpenFactory };
    } else if (def?.kind === 'storage') {
      action = { label: 'Open barn', onPress: onOpenBarn };
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
      {detail ? <Body muted>{detail}</Body> : null}
      <View style={styles.sheetActions}>
        {action ? (
          <PrimaryButton label={action.label} onPress={action.onPress} />
        ) : (
          <SecondaryButton label="Got it" onPress={onClose} />
        )}
        {growing && (
          <PrimaryButton
            label={`Speed up · ${GEM_SPEEDUP_COST}💎 (have ${gems})`}
            onPress={() => {
              const res = gemSpeedUpCrop(plot.id);
              if (!res.ok) Alert.alert('Gems', res.message);
            }}
          />
        )}
        {plot.kind === 'building' && plot.buildingId && (
          <>
            <SecondaryButton
              label="Move building"
              onPress={() => {
                const res = beginMoveBuilding(plot.id);
                if (!res.ok) Alert.alert('Move', res.message);
                else onClose();
              }}
            />
            <SecondaryButton
              label="Sell building (~40%)"
              onPress={() => {
                Alert.alert('Sell?', '~40% refund', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sell',
                    style: 'destructive',
                    onPress: () => {
                      const res = sellBuilding(plot.id);
                      if (!res.ok) Alert.alert('Sell', res.message);
                      else onClose();
                    },
                  },
                ]);
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  visitorBanner: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    zIndex: 15,
    backgroundColor: 'rgba(224,122,61,0.95)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitorText: {
    flex: 1,
    fontFamily: fonts.bodyBold,
    color: '#FFF8EC',
    fontSize: 12,
  },
  modeBanner: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    zIndex: 15,
    backgroundColor: 'rgba(40,40,40,0.75)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeText: {
    fontFamily: fonts.bodyExtra,
    color: '#FFF',
    fontSize: 14,
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
    flex: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  board: { position: 'relative' },
  dock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 6,
    gap: 8,
  },
  dockLeft: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dockRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dockBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    overflow: 'hidden',
  },
  dockBtnBig: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderColor: '#E0A820',
  },
  dockGloss: {
    position: 'absolute',
    top: 3,
    left: 6,
    right: 6,
    height: 14,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dockEmoji: { fontSize: 22 },
  dockEmojiBig: { fontSize: 26 },
  welcomeSign: {
    flex: 1,
    maxWidth: 120,
    backgroundColor: 'rgba(255,248,230,0.9)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C4A484',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  welcomeTitle: {
    fontFamily: fonts.bodyExtra,
    fontSize: 11,
    color: '#3D2914',
    textAlign: 'center',
  },
  tileWrap: { position: 'absolute' },
  tileHit: { alignItems: 'center', minHeight: TILE_H + 20 },
  tileFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 4,
  },
  cropEmoji: {
    fontSize: 26,
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cropReady: { fontSize: 30 },
  labelPill: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  labelReady: {
    backgroundColor: '#FFF',
    borderColor: '#5ECF4A',
    borderWidth: 3,
    borderRadius: 22,
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginTop: -4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  readyBubble: { fontSize: 22 },
  tileLabel: {
    fontFamily: fonts.bodyExtra,
    fontSize: 10,
    color: palette.ink,
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
    borderColor: '#8B5E3C',
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

