import * as Haptics from 'expo-haptics';
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

import { motion } from '@/theme/tokens';

export type Toast = { id: number; text: string; kind: 'ok' | 'error' };

// Petit magasin hors React : les retours de mutation s'affichent même si l'écran
// qui a déclenché l'action a été fermé entre-temps.
let current: Toast | null = null;
let seq = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function showToast(text: string, kind: Toast['kind'] = 'ok') {
  clearTimeout(timer);
  current = { id: ++seq, text, kind };
  emit();
  AccessibilityInfo.announceForAccessibility(text);
  Haptics.notificationAsync(
    kind === 'ok' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
  ).catch(() => {});
  timer = setTimeout(hideToast, motion.toastMs);
}

export function hideToast() {
  clearTimeout(timer);
  current = null;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToast(): Toast | null {
  return useSyncExternalStore(subscribe, () => current, () => current);
}
