import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts, fontSize, radius, size, space } from '@/theme/tokens';

type Props = {
  /** Initiales de l'utilisateur connecté (pastille à droite). */
  userInitials?: string;
  onUserPress?: () => void;
  userLabel?: string;
  children?: ReactNode;
};

/** En-tête sombre : la couleur s'étend sous l'encoche, le contenu est décalé. */
export function DarkHeader({ userInitials, onUserPress, userLabel, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + space.md }]}>
      <View style={styles.top}>
        <View style={styles.brand} accessible accessibilityRole="header" accessibilityLabel="Doztra">
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={styles.brandText}>Doztra</Text>
        </View>
        {userInitials ? (
          <Pressable
            onPress={onUserPress}
            accessibilityRole="button"
            accessibilityLabel={userLabel ?? 'Mon compte'}
            hitSlop={6}
            style={({ pressed }) => [styles.user, pressed && styles.userPressed]}
          >
            <Text style={styles.userText} maxFontSizeMultiplier={1.3}>
              {userInitials}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.dark,
    borderBottomLeftRadius: radius.header,
    borderBottomRightRadius: radius.header,
    paddingHorizontal: space.gutter + 2,
    paddingBottom: space.xxl,
    gap: space.xxl,
  },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: space.lg },
  brand: { flexDirection: 'row', alignItems: 'center', gap: space.sm - 2 },
  logo: {
    width: size.logo,
    height: size.logo,
    borderRadius: radius.logo,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.onDark, fontFamily: fonts.extrabold, fontSize: fontSize.logo },
  brandText: { color: colors.onDark, fontFamily: fonts.extrabold, fontSize: fontSize.logo },
  user: {
    width: size.touch,
    height: size.touch,
    borderRadius: size.touch / 2,
    backgroundColor: colors.darkSurfaceAlt,
    borderWidth: 1.5,
    borderColor: colors.darkBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPressed: { backgroundColor: colors.darkSurface },
  userText: { color: colors.onDarkSoft, fontFamily: fonts.bold, fontSize: fontSize.overline },
});
