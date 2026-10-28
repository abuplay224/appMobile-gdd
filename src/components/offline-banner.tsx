import { useNetworkState } from 'expo-network';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, fontSize, radius, space } from '@/theme/tokens';

/** Bandeau informatif ; l'app ne met aucune action en file d'attente hors ligne. */
export function OfflineBanner() {
  const net = useNetworkState();
  if (net.isConnected !== false && net.isInternetReachable !== false) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
      <Text style={styles.text}>
        <Text accessible={false}>! </Text>Pas de connexion
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.errorSurface,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radius.control,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  text: { fontFamily: fonts.bold, fontSize: fontSize.small, color: colors.errorTitle },
});
