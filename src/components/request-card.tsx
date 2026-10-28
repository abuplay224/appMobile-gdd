import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDate, formatTime } from '@/lib/format';
import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';
import type { CustomerRequest } from '@/validation/request.schema';

import { Avatar } from './avatar';
import { Button } from './button';
import { PriorityBadge } from './priority-badge';
import { PriorityButton } from './priority-button';

type Props = {
  request: CustomerRequest;
  fresh?: boolean;
  onOpen: (id: string) => void;
};

function RequestCardBase({ request: r, fresh, onOpen }: Props) {
  const when = `${formatDate(r.createdAt)} · ${formatTime(r.createdAt)}`;
  return (
    <View style={[styles.card, fresh && styles.fresh]}>
      <Pressable
        onPress={() => onOpen(r.id)}
        accessibilityRole="button"
        accessibilityLabel={`${r.customerName}, ${r.subject}, créée le ${when}, ${r.isPriority ? 'prioritaire' : 'normale'}`}
        accessibilityHint="Ouvre le détail de la demande"
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <View style={styles.head}>
          <Avatar id={r.id} name={r.customerName} />
          <View style={styles.who}>
            <Text style={styles.name} numberOfLines={1}>
              {r.customerName}
            </Text>
            <Text style={styles.when}>{when}</Text>
          </View>
          <PriorityBadge isPriority={r.isPriority} />
        </View>
        <View style={styles.subjectBox}>
          <Text style={styles.subjectLabel}>Objet</Text>
          <Text style={styles.subject} numberOfLines={2}>
            {r.subject}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>
        <PriorityButton id={r.id} isPriority={r.isPriority} customerName={r.customerName} style={styles.grow} />
        <Button
          label="Voir"
          glyph="↗"
          variant="dark"
          compact
          onPress={() => onOpen(r.id)}
          accessibilityLabel={`Voir la demande de ${r.customerName}`}
        />
      </View>
    </View>
  );
}

export const RequestCard = memo(RequestCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderCard,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.sm,
  },
  fresh: { backgroundColor: colors.fresh },
  body: { gap: space.sm, borderRadius: radius.control },
  pressed: { opacity: 0.85 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm - 1 },
  who: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: fonts.extrabold, fontSize: fontSize.cardTitle, color: colors.text },
  when: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.textMuted },
  subjectBox: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: radius.control,
    paddingVertical: space.sm - 1,
    paddingHorizontal: space.md - 1,
    gap: 3,
  },
  subjectLabel: { fontFamily: fonts.semibold, fontSize: fontSize.micro, color: colors.textMuted },
  subject: { fontFamily: fonts.bold, fontSize: fontSize.label, color: colors.text, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: space.xs },
  grow: { flex: 1 },
});
