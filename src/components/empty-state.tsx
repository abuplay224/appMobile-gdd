import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

import { Button } from './button';

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View style={styles.box}>
      <View style={styles.icon} accessible={false} importantForAccessibility="no-hide-descendants">
        <Text style={styles.iconText}>+</Text>
      </View>
      <View style={styles.texts}>
        <Text accessibilityRole="header" style={styles.title}>
          Aucune demande pour le moment
        </Text>
        <Text style={styles.body}>Les demandes saisies par l’équipe apparaîtront ici.</Text>
      </View>
      <Button label="Ajouter une demande" onPress={onAdd} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: space.lg,
    paddingVertical: 56,
    paddingHorizontal: space.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.card,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: space.lg,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { color: colors.primary, fontSize: 26, fontFamily: fonts.medium },
  texts: { gap: space.xxs, alignItems: 'center' },
  title: { fontFamily: fonts.extrabold, fontSize: fontSize.sectionTitle, color: colors.text, textAlign: 'center' },
  body: { fontFamily: fonts.regular, fontSize: fontSize.label, color: colors.textMuted, textAlign: 'center' },
});
