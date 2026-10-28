import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, shadow, size, space } from '@/theme/tokens';

/** Bouton flottant d'ajout, au-dessus de la zone sûre basse. */
export function Fab({ onPress, label }: { onPress: () => void; label: string }) {
  const insets = useSafeAreaInsets();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.fab,
        { bottom: insets.bottom + space.xl, backgroundColor: pressed ? colors.primaryPressed : colors.primary },
      ]}
    >
      <Text style={styles.plus} accessible={false}>
        +
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space.xl,
    width: size.fab,
    height: size.fab,
    borderRadius: size.fab / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
  plus: { color: colors.onDark, fontSize: 30, lineHeight: 34, fontFamily: fonts.medium },
});
