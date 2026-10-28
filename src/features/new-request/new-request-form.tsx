import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type ScrollViewInstance, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, MESSAGES } from '@/api/errors';
import { Button } from '@/components/button';
import { ErrorBanner } from '@/components/error-banner';
import { FormField } from '@/components/form-field';
import { requestKeys } from '@/hooks/use-requests';
import { formatCount } from '@/lib/format';
import { colors, fonts, fontSize, radius, size, space } from '@/theme/tokens';
import {
  EMPTY_REQUEST_FORM,
  REQUEST_FORM_FIELDS,
  validateRequestForm,
  type CustomerRequest,
  type RequestFormErrors,
  type RequestFormField,
  type RequestFormValues,
} from '@/validation/request.schema';

import { ModalHeader } from './modal-header';
import { useCreateRequest } from './use-create-request';

type Props = {
  onSuccess: (created: CustomerRequest) => void;
  onCancel: () => void;
  onDirtyChange?: (dirty: boolean) => void;
};

export function NewRequestForm({ onSuccess, onCancel, onDirtyChange }: Props) {
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { mutation, renewSubmission } = useCreateRequest();
  const [values, setValues] = useState<RequestFormValues>(EMPTY_REQUEST_FORM);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const refs = useRef<Partial<Record<RequestFormField, TextInputInstance | null>>>({});
  const submitting = mutation.isPending;

  const setField = (field: RequestFormField, text: string) => {
    const next = { ...values, [field]: text };
    setValues(next);
    onDirtyChange?.(REQUEST_FORM_FIELDS.some((f) => next[f].trim() !== ''));
    // Une erreur déjà affichée se met à jour pendant la saisie.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: validateRequestForm(next)[field] }));
  };

  const blur = (field: RequestFormField) => {
    if (!values[field].trim() && !errors[field]) return;
    setErrors((e) => ({ ...e, [field]: validateRequestForm(values)[field] }));
  };

  const focusFirst = (errs: RequestFormErrors) => {
    const first = REQUEST_FORM_FIELDS.find((f) => errs[f]);
    if (first) setTimeout(() => refs.current[first]?.focus(), 50);
  };

  const submit = async () => {
    if (submitting) return; // double appui : une seule requête en vol
    const errs = validateRequestForm(values);
    if (Object.keys(errs).length) {
      setErrors(errs);
      setServerError(null);
      focusFirst(errs);
      return;
    }
    setServerError(null);
    try {
      // Même submissionId à chaque tentative : un réessai ne crée jamais de doublon.
      const created = await mutation.mutateAsync(values);
      // Confirmé par le serveur : formulaire vidé, prêt pour une nouvelle demande.
      setValues(EMPTY_REQUEST_FORM);
      setErrors({});
      onDirtyChange?.(false);
      renewSubmission();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      onSuccess(created);
    } catch (e) {
      // La saisie reste intégralement à l'écran, aucun faux succès.
      const err = e instanceof ApiError ? e : ApiError.unexpected();
      if (err.code === 'VALIDATION_ERROR' && err.fields) {
        const fieldErrors: RequestFormErrors = {};
        for (const f of REQUEST_FORM_FIELDS) if (err.fields[f]) fieldErrors[f] = err.fields[f];
        setErrors(fieldErrors);
        focusFirst(fieldErrors);
      }
      if (err.code === 'CONFLICT') qc.invalidateQueries({ queryKey: requestKeys.lists });
      setServerError(err.message || MESSAGES.unexpected);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const descLength = values.description.trim().length;
  const descOut = descLength > 5000 || (descLength > 0 && descLength < 10);
  const submitLabel = submitting ? 'Enregistrement…' : 'Enregistrer';

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ModalHeader title="Nouvelle demande" onCancel={onCancel} onSave={submit} saveLabel={submitLabel} busy={submitting} />
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text style={styles.hint}>Les champs marqués d’un astérisque (*) sont obligatoires.</Text>
        {serverError ? <ErrorBanner title="L’enregistrement a échoué" message={serverError} /> : null}

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.legend}>
            Client
          </Text>
          <FormField
            ref={(r) => {
              refs.current.customerName = r;
            }}
            testID="field-customerName"
            label="Nom du client ou de l’entreprise"
            required
            value={values.customerName}
            onChangeText={(t) => setField('customerName', t)}
            onBlur={() => blur('customerName')}
            error={errors.customerName}
            autoCapitalize="words"
            autoComplete="organization"
            textContentType="organizationName"
            maxLength={160}
            returnKeyType="next"
          />
          <FormField
            ref={(r) => {
              refs.current.customerEmail = r;
            }}
            testID="field-customerEmail"
            label="E-mail"
            optional
            value={values.customerEmail}
            onChangeText={(t) => setField('customerEmail', t)}
            onBlur={() => blur('customerEmail')}
            error={errors.customerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
          />
          <FormField
            ref={(r) => {
              refs.current.customerPhone = r;
            }}
            testID="field-customerPhone"
            label="Téléphone"
            optional
            // Saisie conservée telle quelle : ni masque ni formatage.
            value={values.customerPhone}
            onChangeText={(t) => setField('customerPhone', t)}
            onBlur={() => blur('customerPhone')}
            error={errors.customerPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="+224 6XX XX XX XX"
          />
        </View>

        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.legend}>
            Demande
          </Text>
          <FormField
            ref={(r) => {
              refs.current.subject = r;
            }}
            testID="field-subject"
            label="Objet"
            required
            value={values.subject}
            onChangeText={(t) => setField('subject', t)}
            onBlur={() => blur('subject')}
            error={errors.subject}
            autoCapitalize="sentences"
            returnKeyType="next"
          />
          <FormField
            ref={(r) => {
              refs.current.description = r;
            }}
            testID="field-description"
            label="Description"
            required
            multiline
            value={values.description}
            onChangeText={(t) => setField('description', t)}
            onBlur={() => blur('description')}
            error={errors.description}
            autoCapitalize="sentences"
            aside={
              <Text
                accessibilityLiveRegion="polite"
                accessibilityLabel={`${descLength} caractères sur 5 000`}
                style={[styles.counter, descOut && styles.counterOut]}
              >
                {formatCount(descLength)} / 5 000
              </Text>
            }
          />
        </View>

        <View style={styles.actions}>
          <Button
            testID="submit"
            label={submitLabel}
            onPress={submit}
            busy={submitting}
            style={styles.actionButton}
          />
          <Button label="Annuler" variant="outline" onPress={onCancel} disabled={submitting} style={styles.actionButton} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: space.gutter, gap: space.lg, width: '100%', maxWidth: size.maxContentWidth, alignSelf: 'center' },
  hint: { fontFamily: fonts.regular, fontSize: fontSize.label, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg, gap: space.lg },
  legend: {
    fontFamily: fonts.extrabold,
    fontSize: fontSize.overline,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  counter: { fontFamily: fonts.medium, fontSize: fontSize.caption, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  counterOut: { color: colors.errorText },
  actions: { gap: space.sm - 2 },
  actionButton: { alignSelf: 'stretch' },
});
