import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen, Title } from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { activeTownEvent, eventStillActive } from '@/lib/events';
import { isQuestActive, QUEST_DEFS } from '@/lib/quests';
import { useGameStore } from '@/store/gameStore';

export default function QuestsScreen() {
  const quests = useGameStore((s) => s.quests);
  const level = useGameStore((s) => s.player.level);
  const claimQuest = useGameStore((s) => s.claimQuest);
  const syncEvent = useGameStore((s) => s.syncEvent);
  const claimEventReward = useGameStore((s) => s.claimEventReward);
  const player = useGameStore((s) => s.player);
  const [ev, setEv] = useState(activeTownEvent());

  useEffect(() => {
    syncEvent();
    setEv(activeTownEvent());
  }, [syncEvent]);

  return (
    <Screen>
      <Title>Quests</Title>
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.eventCard}>
          <Text style={styles.eventEmoji}>{ev.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.eventName}>{ev.name}</Text>
            <Text style={styles.eventDesc}>{ev.questLabel}</Text>
            <Text style={styles.eventProg}>
              {Math.min(player.eventProgress, ev.questTarget)}/{ev.questTarget}
              {eventStillActive(ev) ? ` · ends ${ev.endsOn}` : ' · ended'}
            </Text>
          </View>
          <Pressable
            style={styles.claim}
            onPress={() => {
              const res = claimEventReward();
              Alert.alert(res.ok ? 'Event' : 'Event', res.message ?? 'Reward claimed!');
            }}>
            <Text style={styles.claimText}>Claim</Text>
          </Pressable>
        </View>

        {QUEST_DEFS.map((def) => {
          const q = quests.find((x) => x.id === def.id)!;
          const active = isQuestActive(q, quests, level);
          const locked = !active && !q.claimed;
          return (
            <View
              key={def.id}
              style={[styles.card, locked && styles.locked, q.claimed && styles.done]}>
              <Text style={styles.title}>{def.title}</Text>
              <Text style={styles.desc}>{def.description}</Text>
              <Text style={styles.prog}>
                {Math.min(q.progress, def.target)}/{def.target}
                {q.claimed ? ' ✓' : ''}
              </Text>
              {active && q.progress >= def.target && (
                <Pressable
                  style={styles.claim}
                  onPress={() => {
                    const res = claimQuest(def.id);
                    if (!res.ok) Alert.alert('Quest', res.message);
                  }}>
                  <Text style={styles.claimText}>
                    Claim · {def.rewardCoins}🪙 {def.rewardXp}XP
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, paddingBottom: 40, paddingTop: spacing.sm },
  eventCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#FFE8C8',
    borderRadius: radii.lg,
    padding: 12,
    borderWidth: 2,
    borderColor: '#E0A820',
  },
  eventEmoji: { fontSize: 32 },
  eventName: { fontFamily: fonts.bodyExtra, fontSize: 16, color: palette.ink },
  eventDesc: { fontFamily: fonts.body, fontSize: 12, color: palette.inkMuted },
  eventProg: { fontFamily: fonts.bodyBold, fontSize: 12, color: '#C45C4A', marginTop: 4 },
  card: {
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 2,
    borderColor: palette.woodLight,
  },
  locked: { opacity: 0.45 },
  done: { borderColor: '#5ECF4A' },
  title: { fontFamily: fonts.bodyExtra, fontSize: 16, color: palette.ink },
  desc: { fontFamily: fonts.body, fontSize: 13, color: palette.inkMuted, marginTop: 4 },
  prog: { fontFamily: fonts.bodyBold, fontSize: 13, color: '#3D8FE8', marginTop: 6 },
  claim: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#5ECF4A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  claimText: { fontFamily: fonts.bodyExtra, color: '#FFF', fontSize: 13 },
});
