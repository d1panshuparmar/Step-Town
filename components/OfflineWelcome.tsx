import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, PrimaryButton } from '@/components/ui';
import { fonts, palette, radii } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

export function OfflineWelcome() {
  const lines = useGameStore((s) => s.offlineWelcome);
  const clearOfflineWelcome = useGameStore((s) => s.clearOfflineWelcome);
  const visible = !!(lines && lines.length);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={clearOfflineWelcome}>
      <Pressable style={styles.backdrop} onPress={clearOfflineWelcome}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Welcome back</Text>
          {(lines ?? []).map((line, i) => (
            <Body key={`${i}-${line}`} muted={i > 0}>
              {line}
            </Body>
          ))}
          <PrimaryButton label="Continue" onPress={clearOfflineWelcome} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 20, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: palette.panel,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: palette.panelBorder,
    padding: 20,
    gap: 10,
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 26,
    color: palette.ink,
  },
});
