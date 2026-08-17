import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fonts, palette } from '@/constants/theme';
import { isQuestActive, questDef } from '@/lib/quests';
import { useGameStore } from '@/store/gameStore';

/** Soft corner tip — doesn't dominate the first viewport. */
export function TutorialCoach({ onOpenQuests }: { onOpenQuests: () => void }) {
  const quests = useGameStore((s) => s.quests);
  const level = useGameStore((s) => s.player.level);
  const tutorialDone = useGameStore((s) => s.tutorialDone);

  if (tutorialDone) return null;

  const active = quests.find((q) => isQuestActive(q, quests, level));
  if (!active) return null;
  const def = questDef(active.id);
  if (!def) return null;

  const ready = active.progress >= def.target;

  return (
    <Pressable style={styles.wrap} onPress={onOpenQuests}>
      <Text style={styles.badge}>!</Text>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {def.title}
        </Text>
        <Text style={[styles.progress, ready && styles.ready]}>
          {Math.min(active.progress, def.target)}/{def.target}
          {ready ? ' · claim' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 10,
    bottom: 92,
    zIndex: 18,
    maxWidth: 168,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(255,252,245,0.82)',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(232,192,96,0.7)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  badge: {
    fontFamily: fonts.bodyExtra,
    fontSize: 11,
    color: '#FFF',
    backgroundColor: '#E07A3D',
    overflow: 'hidden',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
  },
  body: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: fonts.bodyExtra,
    fontSize: 11,
    color: palette.ink,
  },
  progress: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: '#3D8FE8',
    marginTop: 1,
  },
  ready: { color: '#2F9E44' },
});
