import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

export function ErrorBanner({ title, message }: { title: string; message: string }) {
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="assertive" style={styles.box} testID="error-banner">
      <View style={styles.icon} accessible={false} importantForAccessibility="no-hide-descendants">
        <Text style={styles.iconText}>!</Text>
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radius.control + 2,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: space.xs,
    backgroundColor: colors.errorIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.errorText, fontFamily: fonts.extrabold, fontSize: fontSize.small },
  texts: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.extrabold, fontSize: fontSize.label, color: colors.errorTitle },
  message: { fontFamily: fonts.regular, fontSize: fontSize.small + 0.5, color: colors.textSubtle },
});
