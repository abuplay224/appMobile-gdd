import {
  customerRequestSchema,
  priorityResultSchema,
  requestPageSchema,
  toCreatePayload,
  type CustomerRequest,
  type PriorityResult,
  type RequestFormValues,
  type RequestPage,
} from '@/validation/request.schema';

import { api, parse } from './client';

/** Liste paginée, triée par le serveur (prioritaires d'abord, puis plus récentes). */
export async function listRequests(page: number): Promise<RequestPage> {
  const n = Number.isInteger(page) && page > 0 ? page : 1;
  return parse(requestPageSchema, await api(`/requests?page=${n}`));
}

export async function getRequest(id: string): Promise<CustomerRequest> {
  return parse(customerRequestSchema, await api(`/requests/${encodeURIComponent(id)}`));
}

/** `submissionId` : clé anti-doublon, identique pour toutes les tentatives d'un même formulaire. */
export async function createRequest(submissionId: string, values: RequestFormValues): Promise<CustomerRequest> {
  return parse(
    customerRequestSchema,
    await api('/requests', {
      method: 'POST',
      body: JSON.stringify({ submissionId, ...toCreatePayload(values) }),
    }),
  );
}

/** Envoie la valeur souhaitée (booléen strict), jamais une inversion. */
export async function setRequestPriority(id: string, isPriority: boolean): Promise<PriorityResult> {
  return parse(
    priorityResultSchema,
    await api(`/requests/${encodeURIComponent(id)}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ isPriority: isPriority === true }),
    }),
  );
}
