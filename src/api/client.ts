import type { z } from 'zod';

import { clearTokens, getTokens, saveTokens, type Tokens } from '@/auth/storage';
import { API_URL, APP_VERSION, isApiUrlSecure, REQUEST_TIMEOUT_MS } from '@/config';
import { authResultSchema } from '@/validation/request.schema';

import { ApiError, MESSAGES } from './errors';

type SessionEvents = {
  /** Session perdue (401 après rafraîchissement, ou 403) : retour à la connexion. */
  onSessionLost: (message: string) => void;
  /** 426 : version de l'app trop ancienne. */
  onUpgradeRequired: (minVersion: string | null) => void;
};

let events: SessionEvents = { onSessionLost: () => {}, onUpgradeRequired: () => {} };

export function setSessionEvents(next: SessionEvents) {
  events = next;
}

/**
 * Requête HTTP brute : en-têtes communs, délai d'expiration, enveloppe `{ data }` / `{ error }`.
 * Ne journalise jamais ni le jeton, ni le corps.
 */
export async function rawRequest(path: string, init: RequestInit = {}, token?: string): Promise<unknown> {
  if (!isApiUrlSecure()) throw new ApiError(0, 'CONFIG_ERROR', MESSAGES.insecureUrl);

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-App-Version': APP_VERSION,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    let res: Response;
    try {
      res = await fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal });
    } catch {
      throw timedOut ? ApiError.timeout() : ApiError.network();
    }

    if (res.status === 426) events.onUpgradeRequired(res.headers.get('X-Min-App-Version'));

    const body: unknown = res.status === 204 ? null : await res.json().catch(() => null);
    if (timedOut) throw ApiError.timeout();
    if (!res.ok) throw ApiError.from(res.status, body);
    return (body as { data?: unknown } | null)?.data ?? null;
  } finally {
    clearTimeout(timer);
  }
}

async function loseSession(message: string) {
  await clearTokens();
  events.onSessionLost(message);
}

// Un seul rafraîchissement à la fois : les requêtes en 401 attendent le même.
// Rotation stricte côté serveur : deux rafraîchissements parallèles révoqueraient la session.
let refreshing: Promise<Tokens | null> | null = null;

export function refreshTokens(): Promise<Tokens | null> {
  refreshing ??= (async () => {
    try {
      const current = await getTokens();
      if (!current) {
        await loseSession(MESSAGES.sessionExpired);
        return null;
      }
      const data = authResultSchema
        .pick({ accessToken: true, refreshToken: true })
        .parse(
          await rawRequest('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken: current.refreshToken }),
          }),
        );
      const next = { accessToken: data.accessToken, refreshToken: data.refreshToken };
      await saveTokens(next); // enregistrer AVANT de rejouer
      return next;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        await loseSession(e.message);
        return null;
      }
      // Réseau ou délai : on garde les jetons, l'utilisateur réessaiera.
      throw e;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/** Requête authentifiée : un seul rafraîchissement sur 401 puis un seul rejeu ; 403 déconnecte. */
export async function api(path: string, init: RequestInit = {}): Promise<unknown> {
  const tokens = await getTokens();
  try {
    return await rawRequest(path, init, tokens?.accessToken);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.status === 403) {
      await loseSession(e.message);
      throw e;
    }
    if (e.status !== 401) throw e;
    const next = await refreshTokens();
    if (!next) throw e;
    return rawRequest(path, init, next.accessToken);
  }
}

/** Valide une réponse avec son schéma ; une forme inattendue devient une erreur contrôlée. */
export function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw ApiError.unexpected();
  return result.data;
}
