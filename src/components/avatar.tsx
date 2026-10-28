import { StyleSheet, Text, View } from 'react-native';

import { avatarColors, initials } from '@/lib/format';
import { fonts, fontSize, size } from '@/theme/tokens';

export function Avatar({ id, name, large }: { id: string; name: string; large?: boolean }) {
  const [bg, fg] = avatarColors(id);
  const d = large ? size.avatarLarge : size.avatar;
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { width: d, height: d, borderRadius: d / 2, backgroundColor: bg }]}
    >
      <Text style={[styles.text, { color: fg }]} maxFontSizeMultiplier={1.3}>
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { fontFamily: fonts.extrabold, fontSize: fontSize.caption },
});
