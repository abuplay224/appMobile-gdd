import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { Button } from './button';

export function ErrorState({ onRetry, retrying }: { onRetry: () => void; retrying?: boolean }) {
  return (
    <View accessibilityRole="alert" style={styles.box}>
      <View style={styles.icon} accessible={false} importantForAccessibility="no-hide-descendants">
        <Text style={styles.iconText}>!</Text>
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>Impossible de charger les demandes</Text>
        <Text style={styles.body}>Vérifiez votre connexion puis réessayez.</Text>
      </View>
      <Button label="Réessayer" variant="dark" onPress={onRetry} busy={retrying} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: space.md,
    paddingVertical: 48,
    paddingHorizontal: space.lg,
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radius.card,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: space.md,
    backgroundColor: colors.errorIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.errorText, fontFamily: fonts.extrabold, fontSize: 22 },
  texts: { gap: space.xxs, alignItems: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: fontSize.label + 2, color: colors.errorTitle, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: fontSize.label, color: colors.textMuted, textAlign: 'center' },
});
