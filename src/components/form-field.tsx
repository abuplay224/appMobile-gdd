import { forwardRef, type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputInstance, type TextInputProps } from 'react-native';

import { colors, fonts, fontSize, radius, size, space } from '@/theme/tokens';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  /** Élément affiché à droite du libellé (compteur). */
  aside?: ReactNode;
  testID?: string;
};

export const FormField = forwardRef<TextInputInstance, Props>(function FormField(
  { label, required, optional, error, aside, multiline, testID, ...input },
  ref,
) {
  const a11yLabel = `${label}${required ? ', obligatoire' : ''}${optional ? ', facultatif' : ''}`;
  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={styles.label} nativeID={`${testID}-label`}>
          {label}
          {required ? ' *' : null}
          {optional ? <Text style={styles.optional}> (facultatif)</Text> : null}
        </Text>
        {aside}
      </View>
      <TextInput
        ref={ref}
        testID={testID}
        accessibilityLabel={a11yLabel}
        accessibilityHint={error}
        accessibilityState={{ disabled: input.editable === false }}
        aria-invalid={!!error}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.multiline, { borderColor: error ? colors.fieldInvalid : colors.borderControl }]}
        {...input}
      />
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  field: { gap: 7 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: space.sm - 2 },
  label: { flexShrink: 1, fontFamily: fonts.bold, fontSize: fontSize.label, color: colors.text },
  optional: { fontFamily: fonts.medium, color: colors.textMuted },
  input: {
    minHeight: size.input,
    borderWidth: 1.5,
    borderRadius: radius.control,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontFamily: fonts.regular,
    fontSize: fontSize.input,
    color: colors.text,
    backgroundColor: colors.field,
  },
  multiline: { minHeight: size.textareaMin, lineHeight: 24 },
  error: { fontFamily: fonts.semibold, fontSize: fontSize.small, color: colors.errorText },
});
