import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, type TextInputInstance } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, MESSAGES } from '@/api/errors';
import { useSession } from '@/auth/session';
import { Button } from '@/components/button';
import { DarkHeader } from '@/components/dark-header';
import { ErrorBanner } from '@/components/error-banner';
import { FormField } from '@/components/form-field';
import { OfflineBanner } from '@/components/offline-banner';
import { colors, fonts, fontSize, radius, size, space } from '@/theme/tokens';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { state, signIn } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<TextInputInstance>(null);

  // Message de fin de session (jeton révoqué, compte désactivé…) transmis par le serveur.
  const sessionMessage = state.status === 'signedOut' ? state.message : null;
  const shown = error ?? sessionMessage;

  const submit = async () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setError('Indiquez votre e-mail et votre mot de passe.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : MESSAGES.unexpected);
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <DarkHeader>
        <View style={styles.titles}>
          <Text accessibilityRole="header" style={styles.title} maxFontSizeMultiplier={1.4}>
            Connexion
          </Text>
          <Text style={styles.sub}>Doztra Demandes · accès réservé à l’équipe</Text>
        </View>
      </DarkHeader>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <OfflineBanner />
        {shown ? <ErrorBanner title="Connexion impossible" message={shown} /> : null}
        <View style={styles.card}>
          <FormField
            testID="login-email"
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="username"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!busy}
          />
          <FormField
            ref={passwordRef}
            testID="login-password"
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={submit}
            editable={!busy}
          />
          <Button label={busy ? 'Connexion…' : 'Se connecter'} onPress={submit} busy={busy} />
        </View>
        <Text style={styles.help}>
          Pas encore de compte ? Un administrateur le crée depuis le site web et vous transmet un mot de passe provisoire.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  titles: { gap: space.xs },
  title: { fontFamily: fonts.extrabold, fontSize: fontSize.screenTitle, letterSpacing: -0.5, color: colors.onDark },
  sub: { fontFamily: fonts.regular, fontSize: fontSize.label, color: colors.onDarkMuted },
  content: { padding: space.gutter, gap: space.lg, width: '100%', maxWidth: size.maxContentWidth, alignSelf: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg, gap: space.lg },
  help: { fontFamily: fonts.regular, fontSize: fontSize.small, color: colors.textMuted, textAlign: 'center' },
});
