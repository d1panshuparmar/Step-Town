import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Screen, Title } from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { listClubs } from '@/lib/clubs';
import { useGameStore } from '@/store/gameStore';

export default function ClubScreen() {
  const club = useGameStore((s) => s.club);
  const joinClub = useGameStore((s) => s.joinClub);
  const leaveClub = useGameStore((s) => s.leaveClub);
  const donateToClub = useGameStore((s) => s.donateToClub);
  const claimClubTask = useGameStore((s) => s.claimClubTask);
  const wheat = useGameStore((s) => s.inventory.wheat);

  if (club?.joined) {
    return (
      <Screen>
        <Title>
          {club.logo} {club.name}
        </Title>
        <Text style={styles.motto}>{club.motto}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{club.taskLabel}</Text>
          <Text style={styles.prog}>
            {club.taskProgress}/{club.taskTarget}
          </Text>
          <Pressable
            style={styles.btn}
            onPress={() => {
              const res = donateToClub(5);
              Alert.alert(res.ok ? 'Donated' : 'Club', res.message ?? `Thanks! (wheat left: check barn)`);
            }}>
            <Text style={styles.btnText}>Donate 5 wheat ({wheat})</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.claim]}
            onPress={() => {
              const res = claimClubTask();
              Alert.alert(res.ok ? 'Club' : 'Club', res.message ?? 'Reward claimed!');
            }}>
            <Text style={styles.btnText}>Claim club reward</Text>
          </Pressable>
        </View>
        <Text style={styles.section}>Members</Text>
        {club.members.map((m) => (
          <Text key={m.id} style={styles.member}>
            {m.role === 'leader' ? '⭐' : m.role === 'co_leader' ? '✨' : '·'}{' '}
            {m.name} · donated {m.donated}
          </Text>
        ))}
        <Pressable style={styles.leave} onPress={leaveClub}>
          <Text style={styles.leaveText}>Leave club</Text>
        </Pressable>
      </Screen>
    );
  }

  return (
    <Screen>
      <Title>Clubs</Title>
      <Text style={styles.motto}>Join a co-op club for shared goals.</Text>
      <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 40 }}>
        {listClubs().map((c) => (
          <View key={c.id} style={styles.card}>
            <Text style={styles.clubName}>
              {c.logo} {c.name}
            </Text>
            <Text style={styles.motto}>{c.motto}</Text>
            <Text style={styles.meta}>{c.members.length} members</Text>
            <Pressable
              style={styles.btn}
              onPress={() => {
                const res = joinClub(c);
                if (!res.ok) Alert.alert('Club', res.message);
              }}>
              <Text style={styles.btnText}>Join</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  motto: {
    fontFamily: fonts.body,
    color: palette.inkMuted,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 2,
    borderColor: palette.woodLight,
    gap: 8,
  },
  clubName: { fontFamily: fonts.bodyExtra, fontSize: 18, color: palette.ink },
  label: { fontFamily: fonts.bodyBold, color: palette.ink },
  prog: { fontFamily: fonts.bodyExtra, color: '#3D8FE8' },
  meta: { fontFamily: fonts.body, fontSize: 12, color: palette.inkMuted },
  btn: {
    backgroundColor: '#3D8FE8',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
  },
  claim: { backgroundColor: '#5ECF4A' },
  btnText: { fontFamily: fonts.bodyExtra, color: '#FFF' },
  section: {
    marginTop: spacing.md,
    fontFamily: fonts.bodyExtra,
    color: palette.ink,
  },
  member: {
    fontFamily: fonts.body,
    color: palette.inkMuted,
    marginTop: 4,
  },
  leave: { marginTop: spacing.lg, alignItems: 'center' },
  leaveText: { fontFamily: fonts.bodyBold, color: palette.danger },
});
