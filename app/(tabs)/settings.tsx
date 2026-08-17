import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { Screen, Title } from '@/components/ui';
import { fonts, palette, radii, spacing } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

export default function SettingsScreen() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  return (
    <Screen>
      <Title>Settings</Title>
      <View style={styles.card}>
        <Row
          label="Music"
          value={settings.music}
          onChange={(v) => updateSettings({ music: v })}
        />
        <Row
          label="Sound effects"
          value={settings.sfx}
          onChange={(v) => updateSettings({ sfx: v })}
        />
        <Row
          label="Notifications"
          value={settings.notifications}
          onChange={(v) => updateSettings({ notifications: v })}
        />
        <Row
          label="Reduce motion"
          value={settings.reduceMotion}
          onChange={(v) => updateSettings({ reduceMotion: v })}
        />
      </View>

      <Text style={styles.section}>Graphics</Text>
      <View style={styles.rowBtns}>
        {(['low', 'medium', 'high'] as const).map((q) => (
          <Pressable
            key={q}
            style={[
              styles.chip,
              settings.graphicsQuality === q && styles.chipOn,
            ]}
            onPress={() => updateSettings({ graphicsQuality: q })}>
            <Text
              style={[
                styles.chipText,
                settings.graphicsQuality === q && styles.chipTextOn,
              ]}>
              {q}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>
        SFX uses haptics · Music bed ships in a later update.
      </Text>
    </Screen>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: '#5ECF4A', false: '#CCC' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: palette.woodLight,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontFamily: fonts.bodyBold, fontSize: 16, color: palette.ink },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    fontFamily: fonts.bodyExtra,
    color: palette.ink,
  },
  rowBtns: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#E8DCC8',
  },
  chipOn: { backgroundColor: '#3D8FE8' },
  chipText: {
    fontFamily: fonts.bodyBold,
    color: palette.ink,
    textTransform: 'capitalize',
  },
  chipTextOn: { color: '#FFF' },
  hint: {
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    color: palette.inkMuted,
    fontSize: 12,
  },
});
