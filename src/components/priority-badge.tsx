import { StyleSheet, Text, View } from 'react-native';

import { GLYPH, PRIORITY } from '@/lib/labels';
import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

/** Priorité signalée par un texte ET un symbole, jamais par la couleur seule. */
export function PriorityBadge({ isPriority }: { isPriority: boolean }) {
  const label = isPriority ? PRIORITY.badgePriority : PRIORITY.badgeNormal;
  return (
    <View
      accessible
      accessibilityLabel={`Priorité : ${label}`}
      style={[styles.badge, { backgroundColor: isPriority ? colors.priorityBg : colors.normalBg }]}
    >
      <Text style={[styles.text, { color: isPriority ? colors.priorityText : colors.normalText }]}>
        {isPriority ? GLYPH.priority : GLYPH.normal} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexShrink: 0,
    borderRadius: radius.pill,
    paddingHorizontal: space.sm - 2,
    paddingVertical: 5,
  },
  text: { fontFamily: fonts.bold, fontSize: fontSize.overline },
});
