import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, fontSize, size, space } from '@/theme/tokens';

type Props = {
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
  busy?: boolean;
};

/** En-tête de présentation modale : « Annuler » · titre · « Enregistrer ». */
export function ModalHeader({ title, onCancel, onSave, saveLabel, busy }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, space.xs) }]}>
      <Pressable
        onPress={onCancel}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!busy }}
        style={[styles.side, busy && styles.dim]}
        hitSlop={6}
      >
        <Text style={styles.cancel}>Annuler</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <Pressable
        onPress={onSave}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ disabled: !!busy, busy: !!busy }}
        style={[styles.side, styles.right, busy && styles.dim]}
        hitSlop={6}
      >
        <Text style={styles.save} numberOfLines={1}>
          {saveLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dark,
    paddingHorizontal: space.xs,
    paddingBottom: space.xs,
  },
  side: { minHeight: size.touch, minWidth: 96, justifyContent: 'center', paddingHorizontal: space.xs },
  right: { alignItems: 'flex-end' },
  dim: { opacity: 0.55 },
  cancel: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.onDarkSoft },
  save: { fontFamily: fonts.extrabold, fontSize: fontSize.body, color: colors.onDark },
  title: { flex: 1, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: fontSize.sectionTitle, color: colors.onDark },
});
