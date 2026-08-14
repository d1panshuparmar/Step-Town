import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Screen, Subtitle, Title } from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';

const LINKS = [
  { href: '/(tabs)/goals', title: 'Goals', emoji: '🎁', blurb: 'Daily walk & town rewards' },
  { href: '/(tabs)/friends', title: 'Friends', emoji: '👯', blurb: 'Codes, steps, visit towns' },
  { href: '/(tabs)/achievements', title: 'Badges', emoji: '🏆', blurb: 'Milestones & account' },
] as const;

export default function MoreScreen() {
  const router = useRouter();

  return (
    <Screen>
      <Title>More</Title>
      <Subtitle>Extra pages without crowding the town</Subtitle>

      <View style={styles.list}>
        {LINKS.map((item) => (
          <Pressable
            key={item.href}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
            onPress={() => router.push(item.href as never)}>
            <Text style={styles.emoji}>{item.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.title}</Text>
              <Body muted>{item.blurb}</Body>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.credit}>made by d1panshuparmar</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, marginTop: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    padding: 14,
    borderWidth: 2,
    borderColor: palette.woodLight,
  },
  emoji: { fontSize: 28 },
  name: {
    fontFamily: fonts.bodyExtra,
    fontSize: 17,
    color: palette.ink,
  },
  chevron: {
    fontSize: 28,
    color: palette.inkMuted,
  },
  credit: {
    marginTop: 'auto',
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 13,
    color: palette.inkMuted,
    paddingVertical: spacing.md,
  },
});
