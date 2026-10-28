import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hideToast, useToast } from '@/lib/toast';
import { colors, fonts, fontSize, radius, shadow, space } from '@/theme/tokens';

/** Retour discret en bas d'écran (succès ✓ / échec !), au-dessus de la zone sûre. */
export function ToastHost() {
  const toast = useToast();
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const ok = toast.kind === 'ok';
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: insets.bottom + space.xxl }]}>
      <Pressable
        key={toast.id}
        onPress={hideToast}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityHint="Touchez pour fermer"
        style={[styles.toast, { backgroundColor: ok ? colors.toastOk : colors.toastError }]}
        testID="toast"
      >
        <View style={styles.icon} accessible={false} importantForAccessibility="no-hide-descendants">
          <Text style={styles.iconText}>{ok ? '✓' : '!'}</Text>
        </View>
        <Text style={styles.text}>{toast.text}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: space.gutter, right: space.gutter, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm - 2,
    paddingVertical: space.sm + 1,
    paddingHorizontal: space.lg + 2,
    borderRadius: radius.control + 2,
    maxWidth: '100%',
    ...shadow.floating,
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.toastIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.onDark, fontSize: fontSize.overline, fontFamily: fonts.bold },
  text: { flexShrink: 1, color: colors.onDark, fontFamily: fonts.bold, fontSize: fontSize.label },
});
