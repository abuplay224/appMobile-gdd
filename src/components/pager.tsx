import { StyleSheet, Text, View } from 'react-native';

import { pageLabel } from '@/lib/format';
import { colors, fonts, fontSize, space } from '@/theme/tokens';

import { Button } from './button';

type Props = {
  page: number;
  pages: number;
  pageSize: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
};

/** Pagination serveur, précédent / suivant. */
export function Pager({ page, pages, pageSize, total, onPrev, onNext }: Props) {
  const label = pageLabel(page, pages, pageSize, total);
  return (
    <View accessibilityLabel="Pagination" style={styles.nav}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.buttons}>
        <Button
          label="‹ Précédent"
          accessibilityLabel="Page précédente"
          variant="outline"
          compact
          disabled={page <= 1}
          onPress={onPrev}
          style={styles.button}
        />
        <Button
          label="Suivant ›"
          accessibilityLabel="Page suivante"
          variant="outline"
          compact
          disabled={page >= pages}
          onPress={onNext}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { gap: space.sm, paddingTop: space.xxs },
  label: { fontFamily: fonts.medium, fontSize: fontSize.small, color: colors.textMuted, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: space.xs },
  button: { flex: 1 },
});
