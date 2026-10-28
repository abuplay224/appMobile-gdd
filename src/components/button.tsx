import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, fontSize, radius, size, space } from '@/theme/tokens';

type Variant = 'primary' | 'dark' | 'outline' | 'darkSoft';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  busy?: boolean;
  /** Symbole décoratif placé avant le libellé (masqué aux lecteurs d'écran). */
  glyph?: string;
  glyphColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  testID?: string;
};

const palette: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onDark },
  dark: { bg: colors.text, pressed: colors.textSecondary, fg: colors.onDark },
  outline: { bg: colors.surface, pressed: colors.surfaceSoft, fg: colors.text, border: colors.borderControl },
  darkSoft: { bg: colors.darkSurface, pressed: colors.darkSurfaceAlt, fg: colors.onDarkSoft },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  busy,
  glyph,
  glyphColor,
  accessibilityLabel,
  accessibilityHint,
  style,
  compact,
  testID,
}: Props) {
  const p = palette[variant];
  const inactive = disabled || busy;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!inactive, busy: !!busy }}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        compact ? styles.compact : styles.regular,
        { backgroundColor: pressed ? p.pressed : p.bg },
        p.border ? { borderWidth: 1.5, borderColor: p.border } : null,
        inactive ? styles.inactive : null,
        style,
      ]}
    >
      {glyph ? (
        <Text accessible={false} importantForAccessibility="no" style={[styles.glyph, { color: glyphColor ?? p.fg }]}>
          {glyph}
        </Text>
      ) : null}
      <Text style={[styles.label, compact && styles.labelCompact, { color: p.fg }]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    borderRadius: radius.button,
    paddingHorizontal: space.lg,
  },
  regular: { minHeight: size.button, paddingVertical: space.sm },
  compact: { minHeight: size.touch, paddingVertical: space.xs, borderRadius: radius.control },
  inactive: { opacity: 0.55 },
  glyph: { fontFamily: fonts.bold, fontSize: fontSize.body },
  label: { fontFamily: fonts.bold, fontSize: fontSize.body, textAlign: 'center', flexShrink: 1 },
  labelCompact: { fontSize: fontSize.small },
});
