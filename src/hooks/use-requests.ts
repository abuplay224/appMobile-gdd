import { keepPreviousData, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { getRequest, listRequests } from '@/api/requests';
import type { CustomerRequest, RequestPage } from '@/validation/request.schema';

export const requestKeys = {
  lists: ['requests'] as const,
  list: (page: number) => ['requests', page] as const,
  detail: (id: string) => ['request', id] as const,
};

/** Page serveur de 20 demandes ; le tri et la pagination viennent du serveur. */
export function useRequests(page: number) {
  return useQuery({
    queryKey: requestKeys.list(page),
    queryFn: () => listRequests(page),
    placeholderData: keepPreviousData,
  });
}

/** Cherche une demande dans les pages déjà chargées (le détail réutilise la page courante). */
export function findLoadedRequest(qc: QueryClient, id: string): CustomerRequest | undefined {
  for (const [, page] of qc.getQueriesData<RequestPage>({ queryKey: requestKeys.lists })) {
    const hit = page?.items.find((r) => r.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function useRequest(id: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => getRequest(id),
    initialData: () => findLoadedRequest(qc, id),
    initialDataUpdatedAt: () => qc.getQueryState(requestKeys.lists)?.dataUpdatedAt,
  });
}
