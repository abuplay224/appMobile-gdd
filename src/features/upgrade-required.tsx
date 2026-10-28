import { StyleSheet, Text, View } from 'react-native';

import { DarkHeader } from '@/components/dark-header';
import { APP_VERSION } from '@/config';
import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

/** Réponse 426 : l'app est trop ancienne pour l'API. */
export function UpgradeRequired({ minVersion }: { minVersion: string | null }) {
  return (
    <View style={styles.screen}>
      <DarkHeader>
        <Text accessibilityRole="header" style={styles.title}>
          Mise à jour requise
        </Text>
      </DarkHeader>
      <View style={styles.card}>
        <Text style={styles.body}>
          Cette version de l’application n’est plus prise en charge. Installez la dernière version pour continuer.
        </Text>
        <Text style={styles.meta}>
          Version installée : {APP_VERSION}
          {minVersion ? ` · version minimale : ${minVersion}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  title: { fontFamily: fonts.extrabold, fontSize: fontSize.screenTitle, color: colors.onDark },
  card: { margin: space.gutter, backgroundColor: colors.surface, borderRadius: radius.card, padding: space.lg, gap: space.sm },
  body: { fontFamily: fonts.regular, fontSize: fontSize.body, lineHeight: 22, color: colors.textSecondary },
  meta: { fontFamily: fonts.semibold, fontSize: fontSize.caption, color: colors.textMuted },
});
