import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

import { ApiError } from '@/api/errors';

// Cache en mémoire uniquement : aucune donnée de demande n'est persistée sur l'appareil.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Pas de réessai sur une erreur 4xx : seules les erreurs transitoires sont rejouées.
      retry: (count, error) => (!(error instanceof ApiError) || error.isTransient) && count < 2,
    },
    mutations: {
      // Le réessai d'une écriture est toujours une action de l'utilisateur.
      retry: false,
    },
  },
});

/** Rafraîchit les requêtes actives au retour de l'app au premier plan. */
export function subscribeAppFocus() {
  const sub = AppState.addEventListener('change', (status: AppStateStatus) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  });
  return () => sub.remove();
}
