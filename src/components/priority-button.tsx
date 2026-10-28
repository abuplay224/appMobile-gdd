import type { StyleProp, ViewStyle } from 'react-native';

import { useSetPriority } from '@/hooks/use-set-priority';
import { GLYPH, PRIORITY } from '@/lib/labels';
import { colors } from '@/theme/tokens';

import { Button } from './button';

type Props = {
  id: string;
  isPriority: boolean;
  customerName: string;
  /** `outline` dans les cartes, `dark` en pied de détail. */
  variant?: 'outline' | 'dark';
  style?: StyleProp<ViewStyle>;
};

export function PriorityButton({ id, isPriority, customerName, variant = 'outline', style }: Props) {
  const { setPriority, pending } = useSetPriority(id);
  const onDark = variant === 'dark';
  const label = pending ? PRIORITY.pending : isPriority ? PRIORITY.unmark : PRIORITY.mark;
  const glyphColor = isPriority
    ? onDark
      ? colors.starUnmarkOnDark
      : colors.starUnmark
    : onDark
      ? colors.starMarkOnDark
      : colors.starMark;

  return (
    <Button
      testID={`priority-${id}`}
      label={label}
      glyph={isPriority ? GLYPH.unmark : GLYPH.mark}
      glyphColor={glyphColor}
      variant={variant}
      compact={!onDark}
      busy={pending}
      // Valeur souhaitée explicite, calculée depuis l'état affiché au moment du geste.
      onPress={() => setPriority(!isPriority)}
      accessibilityLabel={`${label} — ${customerName}`}
      style={style}
    />
  );
}
