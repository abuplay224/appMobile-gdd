import * as Clipboard from 'expo-clipboard';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';

import { showToast } from '@/lib/toast';
import { colors, fonts, fontSize, radius, size, space } from '@/theme/tokens';

type Props = { label: string; value: string | null; url: string | null };

/** Coordonnée : appui = ouvrir (mailto: / tel:), appui long = copier. Valeur affichée intacte. */
export function ContactTile({ label, value, url }: Props) {
  if (!value || !url) {
    return (
      <Pressable disabled style={styles.tile} accessible accessibilityLabel={`${label} : non renseigné`}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.empty}>Non renseigné</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={() => Linking.openURL(url).catch(() => {})}
      onLongPress={async () => {
        await Clipboard.setStringAsync(value);
        showToast(`${label} copié`);
      }}
      accessibilityRole="link"
      accessibilityLabel={`${label} : ${value}`}
      accessibilityHint="Appui long pour copier"
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.link}>{value}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    minHeight: size.touch,
    backgroundColor: colors.surface,
    borderRadius: radius.control,
    paddingVertical: space.sm - 1,
    paddingHorizontal: space.md - 1,
    gap: 3,
  },
  pressed: { backgroundColor: colors.primarySoft },
  label: { fontFamily: fonts.semibold, fontSize: fontSize.micro, color: colors.textMuted },
  link: { fontFamily: fonts.bold, fontSize: fontSize.label, color: colors.primaryPressed },
  empty: { fontFamily: fonts.regular, fontSize: fontSize.label, color: colors.textMuted },
});
