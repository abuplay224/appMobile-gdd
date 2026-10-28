import Constants from 'expo-constants';

/** URL de base de l'API, ex. https://<domaine>/api/v1 — HTTPS obligatoire, y compris en développement. */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

/** Délai d'expiration explicite appliqué à chaque requête. */
export const REQUEST_TIMEOUT_MS = 15_000;

export const PAGE_SIZE = 20;

export function isApiUrlSecure(url: string = API_URL): boolean {
  return /^https:\/\/[^/]+/i.test(url);
}
