import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { fonts, palette, radii, spacing } from '@/constants/theme';
import { useGameStore } from '@/store/gameStore';

type Balloon = { id: number; x: number; y: number; emoji: string };

const EMOJIS = ['🎈', '🟡', '🔴', '🔵', '🟢', '🟣'];

/** Simple balloon-pop mini-game — small coin rewards, economy-safe. */
export function BalloonPopGame({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const awardMiniGame = useGameStore((s) => s.awardMiniGame);
  const sfx = useGameStore((s) => s.settings.sfx);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(20);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setScore(0);
    setLeft(20);
    setDone(false);
    setBalloons(spawn(width, height));
  }, [visible, width, height]);

  useEffect(() => {
    if (!visible || done) return;
    const id = setInterval(() => {
      setLeft((t) => {
        if (t <= 1) {
          setDone(true);
          return 0;
        }
        return t - 1;
      });
      setBalloons((b) => (b.length < 6 ? [...b, ...spawn(width, height, 2)] : b));
    }, 1000);
    return () => clearInterval(id);
  }, [visible, done, width, height]);

  const pop = (id: number) => {
    if (done) return;
    if (sfx) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setBalloons((b) => b.filter((x) => x.id !== id));
    setScore((s) => s + 1);
  };

  const finish = () => {
    const coins = Math.min(40, 5 + score * 2);
    awardMiniGame(coins, Math.floor(score / 8));
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.backdrop}>
        <View style={styles.hud}>
          <Text style={styles.hudText}>🎈 {score}</Text>
          <Text style={styles.hudText}>⏱ {left}s</Text>
        </View>
        {!done &&
          balloons.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => pop(b.id)}
              style={[styles.balloon, { left: b.x, top: b.y }]}>
              <Text style={styles.emoji}>{b.emoji}</Text>
            </Pressable>
          ))}
        {done && (
          <View style={styles.result}>
            <Text style={styles.title}>Nice pop!</Text>
            <Text style={styles.sub}>
              Score {score} · Earn up to {Math.min(40, 5 + score * 2)} coins
            </Text>
            <Pressable style={styles.btn} onPress={finish}>
              <Text style={styles.btnText}>Collect</Text>
            </Pressable>
          </View>
        )}
        {!done && (
          <Pressable style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
}

let _id = 1;
function spawn(w: number, h: number, n = 4): Balloon[] {
  return Array.from({ length: n }, () => ({
    id: _id++,
    x: 24 + Math.random() * Math.max(40, w - 80),
    y: 80 + Math.random() * Math.max(80, h - 220),
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  }));
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(90,170,255,0.92)',
  },
  hud: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  hudText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 22,
    color: '#FFF',
  },
  balloon: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 42 },
  result: {
    marginTop: '45%',
    marginHorizontal: 28,
    backgroundColor: palette.cream,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: palette.wood,
  },
  title: {
    fontFamily: fonts.displaySoft,
    fontSize: 28,
    color: palette.ink,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: palette.inkMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  btn: {
    marginTop: 16,
    backgroundColor: '#5ECF4A',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 18,
  },
  btnText: {
    fontFamily: fonts.bodyExtra,
    fontSize: 16,
    color: '#FFF',
  },
  close: {
    position: 'absolute',
    top: 52,
    right: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: '#FFF', fontSize: 18 },
});
