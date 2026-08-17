import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, PrimaryButton, SecondaryButton } from '@/components/ui';
import { BUILDINGS, ITEM_META, factoryRecipes } from '@/constants/catalog';
import { fonts, palette, radii } from '@/constants/theme';
import { formatDuration } from '@/lib/date';
import { GEM_SPEEDUP_COST, factoryTimeMult } from '@/lib/townshipExtras';
import type { Plot } from '@/lib/types';
import { useGameStore } from '@/store/gameStore';

export function FactorySheet({
  plot,
  onClose,
}: {
  plot: Plot;
  onClose: () => void;
}) {
  const inventory = useGameStore((s) => s.inventory);
  const gems = useGameStore((s) => s.player.gems);
  const academyLevels = useGameStore((s) => s.academyLevels);
  const startFactory = useGameStore((s) => s.startFactory);
  const collectFactory = useGameStore((s) => s.collectFactory);
  const gemSpeedUpFactory = useGameStore((s) => s.gemSpeedUpFactory);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const live = useGameStore((s) => s.plots.find((p) => p.id === plot.id)) ?? plot;
  const def = live.buildingId ? BUILDINGS[live.buildingId] : null;
  if (!def || def.kind !== 'factory') {
    return (
      <View style={styles.inner}>
        <Body muted>Not a factory.</Body>
        <SecondaryButton label="Close" onPress={onClose} />
      </View>
    );
  }

  const recipes = factoryRecipes(def);
  const now = Date.now();
  const queue = live.factoryQueue ?? [];
  const shelf = live.factoryShelf ?? [];
  const readyOnShelf =
    shelf.length + queue.filter((j) => j.readyAt <= now).length;
  const academyLvl = academyLevels[def.id] ?? 0;
  const timeMult = factoryTimeMult(academyLvl);
  const cooking = queue.some((j) => j.readyAt > now);

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {def.emoji} {def.name}
        </Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </View>
      <Body muted>
        Queue {queue.length}/{def.queueSlots ?? 2} · Shelf {shelf.length}/
        {def.shelfSlots ?? 2} · Academy Lv {academyLvl} (
        {Math.round(timeMult * 100)}% time)
      </Body>

      <Text style={styles.section}>Working</Text>
      {queue.length === 0 ? (
        <Body muted>Idle — start a recipe below.</Body>
      ) : (
        queue.map((job, i) => (
          <Text key={`${job.recipeId}-${i}`} style={styles.job}>
            {ITEM_META[job.output]?.emoji} ×{job.outputQty} ·{' '}
            {job.readyAt <= now
              ? 'Ready → shelf'
              : formatDuration(job.readyAt - now)}
          </Text>
        ))
      )}

      {cooking && (
        <PrimaryButton
          label={`Speed up queue · ${GEM_SPEEDUP_COST}💎 (have ${gems})`}
          onPress={() => {
            const res = gemSpeedUpFactory(live.id);
            if (!res.ok) Alert.alert(def.name, res.message);
          }}
        />
      )}

      <Text style={styles.section}>Shelf</Text>
      {shelf.length === 0 && readyOnShelf === 0 ? (
        <Body muted>Empty</Body>
      ) : (
        shelf.map((item, i) => (
          <Text key={`${item.itemId}-${i}`} style={styles.job}>
            {ITEM_META[item.itemId]?.emoji} ×{item.qty} ready
          </Text>
        ))
      )}

      <PrimaryButton
        label="Collect to barn"
        onPress={() => {
          const res = collectFactory(live.id);
          if (!res.ok) Alert.alert(def.name, res.message);
        }}
      />

      <Text style={styles.section}>Start production</Text>
      {recipes.map((r) => {
        const have = inventory[r.input] ?? 0;
        const have2 = r.input2 ? inventory[r.input2] ?? 0 : 0;
        const need2 = r.input2Qty ?? 0;
        const can =
          have >= r.inputQty && (!r.input2 || have2 >= need2);
        const secs = Math.round((r.processMs * timeMult) / 1000);
        const inputLabel = r.input2
          ? `${ITEM_META[r.input]?.emoji}×${r.inputQty} + ${ITEM_META[r.input2]?.emoji}×${need2}`
          : `${ITEM_META[r.input]?.emoji}×${r.inputQty}`;
        return (
          <Pressable
            key={r.id}
            style={[styles.recipe, !can && styles.recipeDisabled]}
            onPress={() => {
              const res = startFactory(live.id, r.id);
              if (!res.ok) Alert.alert(def.name, res.message);
            }}>
            <Text style={styles.recipeText}>
              {inputLabel} → {ITEM_META[r.output]?.emoji}×{r.outputQty} ·{' '}
              {secs}s
            </Text>
            <Text style={styles.have}>
              Have {have}
              {r.input2 ? ` / ${have2}` : ''}
            </Text>
          </Pressable>
        );
      })}

      <SecondaryButton label="Done" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  inner: { gap: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 22,
    color: palette.ink,
  },
  close: {
    fontFamily: fonts.bodyBold,
    color: '#7A4E2D',
    fontSize: 14,
  },
  section: {
    fontFamily: fonts.bodyExtra,
    fontSize: 14,
    color: palette.ink,
    marginTop: 4,
  },
  job: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: palette.inkMuted,
  },
  recipe: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radii.md,
    padding: 12,
    borderWidth: 2,
    borderColor: '#8B5E3C',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeDisabled: { opacity: 0.55 },
  recipeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: palette.ink,
    flex: 1,
  },
  have: {
    fontFamily: fonts.bodyExtra,
    fontSize: 12,
    color: palette.wood,
  },
});
