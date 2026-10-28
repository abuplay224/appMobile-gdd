import { useIsMutating, useMutation, useQueryClient } from '@tanstack/react-query';

import { setRequestPriority } from '@/api/requests';
import { PRIORITY } from '@/lib/labels';
import { showToast } from '@/lib/toast';

import { requestKeys } from './use-requests';

const priorityKey = (id: string) => ['priority', id] as const;

/**
 * Changement de priorité d'une demande.
 * Pas de mise à jour optimiste : le badge ne change qu'après confirmation du serveur,
 * donc un échec laisse l'état précédent intact.
 */
export function useSetPriority(id: string) {
  const qc = useQueryClient();
  const pending = useIsMutating({ mutationKey: priorityKey(id) }) > 0;

  const mutation = useMutation({
    mutationKey: priorityKey(id),
    mutationFn: (isPriority: boolean) => setRequestPriority(id, isPriority),
    onSuccess: (result) => {
      showToast(result.isPriority ? PRIORITY.markedToast : PRIORITY.unmarkedToast);
    },
    onError: () => {
      showToast(PRIORITY.failedToast, 'error');
    },
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: requestKeys.lists }),
        qc.invalidateQueries({ queryKey: requestKeys.detail(id) }),
      ]),
  });

  /** `target` : valeur souhaitée calculée au moment du geste depuis l'état affiché. */
  const setPriority = (target: boolean) => {
    if (pending) return;
    mutation.mutate(target);
  };

  return { setPriority, pending };
}
