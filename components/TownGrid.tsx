import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Body, PrimaryButton, SecondaryButton } from '@/components/ui';
import { BUILDINGS, CROPS, GRID_SIZE } from '@/constants/catalog';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import type { BuildingId, CropId, Plot } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

const TILE = 76;

export function TownGrid() {
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

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    maybeSpawnVisitor();
    const id = setInterval(() => maybeSpawnVisitor(), 90_000);
    return () => clearInterval(id);
  }, [maybeSpawnVisitor]);

  const selectedPlot = plots.find((p) => p.id === selectedPlotId) ?? null;

  const onTilePress = async (plot: Plot) => {
    try {
      await Haptics.selectionAsync();
    } catch {
      /* web */
    }

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
              ? 'Tap locked land to expand'
              : placeMode === 'crop'
                ? `Tap a plot to plant ${CROPS[selected as string]?.name ?? ''}`
                : `Tap a plot to place ${BUILDINGS[selected as string]?.name ?? ''}`}
          </Text>
          <Pressable onPress={() => setPlaceMode('none')}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollInner}>
        <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <View style={styles.boardShadow}>
            <View
              style={[
                styles.grid,
                { width: GRID_SIZE * TILE, height: GRID_SIZE * TILE },
              ]}>
              {plots.map((plot) => (
                <Tile
                  key={plot.id}
                  plot={plot}
                  selected={selectedPlotId === plot.id}
                  onPress={() => onTilePress(plot)}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </ScrollView>

      {selectedPlot && (
        <PlotSheet
          plot={selectedPlot}
          onClose={() => setSelectedPlotId(null)}
          onHarvest={() => {
            const res = harvestPlot(selectedPlot.id);
            if (!res.ok) Alert.alert('Harvest', res.message);
            else setSelectedPlotId(null);
          }}
          onStart={() => {
            const res = startFactory(selectedPlot.id);
            if (!res.ok) Alert.alert('Factory', res.message);
          }}
          onCollect={() => {
            const res = collectFactory(selectedPlot.id);
            if (!res.ok) Alert.alert('Factory', res.message);
          }}
          onUnlock={() => {
            const res = unlockPlot(selectedPlot.id);
            if (!res.ok) Alert.alert('Land', res.message);
            else setSelectedPlotId(null);
          }}
        />
      )}
    </View>
  );
}

function Tile({
  plot,
  selected,
  onPress,
}: {
  plot: Plot;
  selected: boolean;
  onPress: () => void;
}) {
  const now = Date.now();
  let emoji = '';
  let label = '';
  let ready = false;

  if (!plot.unlocked) {
    emoji = '🌫️';
    label = `${plot.unlockCost}`;
  } else if (plot.kind === 'building' && plot.buildingId) {
    emoji = BUILDINGS[plot.buildingId].emoji;
    if (plot.processing && plot.processReadyAt) {
      if (now >= plot.processReadyAt) {
        label = 'Ready';
        ready = true;
      } else {
        label = formatDuration(plot.processReadyAt - now);
      }
    }
  } else if (plot.kind === 'crop' && plot.cropId && plot.readyAt) {
    emoji = CROPS[plot.cropId].emoji;
    if (now >= plot.readyAt) {
      label = 'Pick';
      ready = true;
    } else {
      label = formatDuration(plot.readyAt - now);
    }
  } else if (plot.unlocked) {
    emoji = '';
  }

  const pulse = useSharedValue(1);
  useEffect(() => {
    if (!ready) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 450 }),
        withTiming(1, { duration: 450 })
      ),
      -1,
      false
    );
  }, [ready, pulse]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.tile,
          !plot.unlocked && styles.tileLocked,
          plot.unlocked && plot.kind === 'empty' && styles.tileEmpty,
          plot.kind === 'crop' && styles.tileSoil,
          selected && styles.tileSelected,
          ready && styles.tileReady,
          animStyle,
        ]}>
        {!!emoji && <Text style={styles.tileEmoji}>{emoji}</Text>}
        {!!label && <Text style={styles.tileLabel}>{label}</Text>}
      </Animated.View>
    </Pressable>
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
    detail = `Spend ${plot.unlockCost} coins (level ${plot.unlockLevel}+) to expand.`;
    action = { label: `Unlock · ${plot.unlockCost} 🪙`, onPress: onUnlock };
  } else if (plot.kind === 'crop' && plot.cropId && plot.readyAt) {
    const def = CROPS[plot.cropId];
    title = def.name;
    if (now >= plot.readyAt) {
      detail = `Ready to harvest +${def.yieldQty} ${def.name}.`;
      action = { label: 'Harvest', onPress: onHarvest };
    } else {
      detail = `Growing… ${formatDuration(plot.readyAt - now)} left.`;
    }
  } else if (plot.kind === 'building' && plot.buildingId) {
    const def = BUILDINGS[plot.buildingId];
    title = def.name;
    detail = def.description;
    if (def.recipe) {
      const r = def.recipe;
      if (plot.processing && plot.processReadyAt) {
        if (now >= plot.processReadyAt) {
          detail = `${ITEM_LABEL(r.output)} ready!`;
          action = { label: 'Collect', onPress: onCollect };
        } else {
          detail = `Working… ${formatDuration(plot.processReadyAt - now)}`;
        }
      } else {
        detail = `${r.inputQty} ${r.input} → ${r.outputQty} ${r.output}. You have ${inventory[r.input]}.`;
        action = { label: 'Start', onPress: onStart };
      }
    }
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <Pressable onPress={onClose}>
          <Text style={styles.cancel}>Close</Text>
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

function ITEM_LABEL(id: string) {
  return id.charAt(0).toUpperCase() + id.slice(1);
}

const styles = StyleSheet.create({
  wrap: { flex: 1, marginTop: spacing.sm },
  visitorBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: '#D9844A',
    borderRadius: radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  scrollInner: { paddingHorizontal: spacing.md },
  boardShadow: {
    borderRadius: radii.lg + 4,
    backgroundColor: '#3E6B2E',
    padding: 6,
    marginVertical: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: palette.grassDark,
    borderRadius: radii.lg,
    padding: 4,
    borderWidth: 3,
    borderColor: '#6B4423',
  },
  tile: {
    width: TILE - 4,
    height: TILE - 4,
    margin: 2,
    borderRadius: 14,
    backgroundColor: palette.grass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(44,36,22,0.14)',
  },
  tileEmpty: { backgroundColor: '#9CCC65' },
  tileSoil: { backgroundColor: '#C4A484' },
  tileLocked: { backgroundColor: '#8FA88A', opacity: 0.9 },
  tileSelected: { borderColor: palette.sun, borderWidth: 2.5 },
  tileReady: {
    backgroundColor: '#FFE082',
    borderColor: palette.coin,
  },
  tileEmoji: { fontSize: 28 },
  tileLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: palette.ink,
    marginTop: 2,
  },
  sheet: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: palette.woodLight,
    gap: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetTitle: {
    fontFamily: fonts.displaySoft,
    fontSize: 20,
    color: palette.ink,
  },
  sheetActions: { marginTop: 4 },
});
