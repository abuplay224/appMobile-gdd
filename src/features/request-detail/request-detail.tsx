import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { PriorityBadge } from '@/components/priority-badge';
import { PriorityButton } from '@/components/priority-button';
import { formatDateTime, mailtoUrl, telUrl } from '@/lib/format';
import { colors, fonts, fontSize, radius, size, space } from '@/theme/tokens';
import type { CustomerRequest } from '@/validation/request.schema';

import { ContactTile } from './contact-tile';

type Props = { request: CustomerRequest; onClose: () => void };

/** Détail en lecture seule, équivalent natif du panneau latéral du web. */
export function RequestDetail({ request: r, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.sheet}>
      <View style={styles.top}>
        <PriorityBadge isPriority={r.isPriority} />
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer le détail"
          style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
        >
          <Text style={styles.closeText} accessible={false}>
            ×
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <View style={styles.block}>
          <Text style={styles.overline}>Objet</Text>
          {/* Texte brut : aucune interprétation HTML du contenu saisi. */}
          <Text accessibilityRole="header" selectable style={styles.subject}>
            {r.subject}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.overline}>Description</Text>
          <Text selectable style={styles.description}>
            {r.description}
          </Text>
        </View>

        <View style={styles.client}>
          <View style={styles.clientHead}>
            <Avatar id={r.id} name={r.customerName} large />
            <View style={styles.clientName}>
              <Text style={styles.micro}>Client</Text>
              <Text selectable style={styles.clientText}>
                {r.customerName}
              </Text>
            </View>
          </View>
          <ContactTile label="E-mail" value={r.customerEmail} url={r.customerEmail ? mailtoUrl(r.customerEmail) : null} />
          <ContactTile label="Téléphone" value={r.customerPhone} url={r.customerPhone ? telUrl(r.customerPhone) : null} />
        </View>

        <View style={styles.dates}>
          <View style={[styles.meta, styles.half]}>
            <Text style={styles.micro}>Créée le</Text>
            <Text style={styles.metaValue}>{formatDateTime(r.createdAt)}</Text>
          </View>
          <View style={[styles.meta, styles.half]}>
            <Text style={styles.micro}>Modifiée le</Text>
            <Text style={styles.metaValue}>{formatDateTime(r.updatedAt)}</Text>
          </View>
        </View>
        <View style={styles.meta}>
          <Text style={styles.micro}>Identifiant</Text>
          <Text selectable style={styles.id}>
            {r.id}
          </Text>
        </View>

        <Text style={styles.note}>Heures affichées dans le fuseau Africa/Conakry. Lecture seule.</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <PriorityButton id={r.id} isPriority={r.isPriority} customerName={r.customerName} variant="dark" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.xl,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderThin,
  },
  close: {
    width: size.touch,
    height: size.touch,
    borderRadius: radius.control,
    borderWidth: 1.5,
    borderColor: colors.borderControl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closePressed: { backgroundColor: colors.surfaceSoft },
  closeText: { fontSize: 22, lineHeight: 24, color: colors.text, fontFamily: fonts.medium },
  content: { paddingHorizontal: space.xl, paddingVertical: space.xxl - 2, gap: space.xl },
  block: { gap: 6 },
  overline: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  subject: { fontFamily: fonts.extrabold, fontSize: fontSize.panelTitle, lineHeight: 28, color: colors.text },
  description: { fontFamily: fonts.regular, fontSize: fontSize.body, lineHeight: 24, color: colors.textSecondary },
  client: { backgroundColor: colors.surfaceSoft, borderRadius: radius.card, padding: space.lg, gap: space.sm },
  clientHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm - 1, paddingBottom: 2 },
  clientName: { flex: 1, gap: 1 },
  clientText: { fontFamily: fonts.extrabold, fontSize: fontSize.body, color: colors.text },
  micro: { fontFamily: fonts.semibold, fontSize: fontSize.micro, color: colors.textMuted },
  dates: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm - 2 },
  half: { flexGrow: 1, flexBasis: 140 },
  meta: {
    borderWidth: 1,
    borderColor: colors.borderThin,
    borderRadius: radius.control,
    paddingVertical: space.sm - 1,
    paddingHorizontal: space.md - 1,
    gap: 3,
  },
  metaValue: { fontFamily: fonts.bold, fontSize: fontSize.label, color: colors.text },
  id: { fontFamily: fonts.mono, fontSize: fontSize.small, color: colors.textSecondary },
  note: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderThin,
    backgroundColor: colors.surface,
  },
});
