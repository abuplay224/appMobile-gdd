import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

import { colors, radius, size, space } from '@/theme/tokens';

const ROWS = [0, 1, 2, 3, 4];

/** Cinq cartes squelettes pendant le chargement initial. */
export function ListSkeleton() {
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 650, useNativeDriver: true }),
        ]),
      );
      loop.start();
    });
    return () => loop?.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });

  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel="Chargement des demandes…" style={styles.list}>
      {ROWS.map((i) => (
        <Animated.View key={i} style={[styles.row, { opacity }]}>
          <View style={styles.avatar} />
          <View style={styles.lines}>
            <View style={[styles.line, { width: '38%' }]} />
            <View style={[styles.line, styles.lineThin, { width: '68%' }]} />
          </View>
          <View style={styles.pill} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.sm - 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.control + 2,
    backgroundColor: colors.surfaceMuted,
  },
  avatar: { width: size.avatar, height: size.avatar, borderRadius: size.avatar / 2, backgroundColor: colors.skeletonBase },
  lines: { flex: 1, gap: space.xs },
  line: { height: 11, borderRadius: 6, backgroundColor: colors.skeletonBase },
  lineThin: { height: 10, backgroundColor: colors.skeletonHighlight },
  pill: { width: 86, height: 26, borderRadius: radius.pill, backgroundColor: colors.skeletonPill },
});
