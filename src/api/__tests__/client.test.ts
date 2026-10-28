import * as SecureStore from 'expo-secure-store';

import { saveTokens } from '@/auth/storage';

import { api, setSessionEvents } from '../client';
import { ApiError } from '../errors';
import { setRequestPriority } from '../requests';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

type Reply = { status: number; body?: unknown; headers?: Record<string, string> };

function reply({ status, body, headers = {} }: Reply) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headers[k] ?? null },
    json: async () => body,
  };
}

const fetchMock = jest.fn();
const onSessionLost = jest.fn();
const onUpgradeRequired = jest.fn();

const authHeader = (call: unknown[]) => (call[1] as { headers: Record<string, string> }).headers.Authorization;
const unauthorized = { status: 401, body: { error: { code: 'UNAUTHORIZED', message: 'Session expirée.' } } };

beforeEach(async () => {
  fetchMock.mockReset();
  onSessionLost.mockReset();
  onUpgradeRequired.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  setSessionEvents({ onSessionLost, onUpgradeRequired });
  await saveTokens({ accessToken: 'dza_old', refreshToken: 'dzr_old' });
});

describe('api()', () => {
  it('envoie le Bearer et la version de l’app, et renvoie `data`', async () => {
    fetchMock.mockResolvedValueOnce(reply({ status: 200, body: { data: { ok: true } } }));
    await expect(api('/ping')).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/api/v1/ping');
    expect(init.headers.Authorization).toBe('Bearer dza_old');
    expect(init.headers['X-App-Version']).toBeDefined();
  });

  it('enregistre les jetons avec WHEN_UNLOCKED_THIS_DEVICE_ONLY', () => {
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('doztra.tokens', expect.any(String), {
      keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    });
  });

  it('mutualise un seul rafraîchissement pour des 401 simultanés, puis rejoue une fois', async () => {
    fetchMock.mockImplementation(async (url: string, init: { headers: Record<string, string> }) => {
      if (url.endsWith('/auth/refresh')) {
        return reply({ status: 200, body: { data: { accessToken: 'dza_new', refreshToken: 'dzr_new' } } });
      }
      return init.headers.Authorization === 'Bearer dza_new'
        ? reply({ status: 200, body: { data: url } })
        : reply(unauthorized);
    });

    const results = await Promise.all([api('/a'), api('/b'), api('/c')]);

    expect(results).toEqual(['https://api.test/api/v1/a', 'https://api.test/api/v1/b', 'https://api.test/api/v1/c']);
    const refreshCalls = fetchMock.mock.calls.filter(([u]: [string]) => u.endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(JSON.parse(refreshCalls[0][1].body)).toEqual({ refreshToken: 'dzr_old' });
    expect(fetchMock).toHaveBeenCalledTimes(7); // 3 échecs + 1 rafraîchissement + 3 rejeux
    expect(JSON.parse((await SecureStore.getItemAsync('doztra.tokens'))!)).toEqual({
      accessToken: 'dza_new',
      refreshToken: 'dzr_new',
    });
  });

  it('ne boucle jamais : rafraîchissement refusé → jetons effacés et session perdue', async () => {
    fetchMock.mockResolvedValue(reply(unauthorized));
    await expect(api('/requests')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(onSessionLost).toHaveBeenCalledWith('Session expirée.');
    expect(await SecureStore.getItemAsync('doztra.tokens')).toBeNull();
  });

  it('un seul réessai même si le rejeu reçoit encore 401', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.endsWith('/auth/refresh')
        ? reply({ status: 200, body: { data: { accessToken: 'dza_new', refreshToken: 'dzr_new' } } })
        : reply(unauthorized),
    );
    await expect(api('/requests')).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(authHeader(fetchMock.mock.calls[2])).toBe('Bearer dza_new');
  });

  it('403 : déconnexion immédiate, sans rafraîchissement', async () => {
    fetchMock.mockResolvedValueOnce(
      reply({ status: 403, body: { error: { code: 'UNAUTHORIZED', message: 'Compte désactivé.' } } }),
    );
    await expect(api('/requests')).rejects.toMatchObject({ status: 403 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onSessionLost).toHaveBeenCalledWith('Compte désactivé.');
    expect(await SecureStore.getItemAsync('doztra.tokens')).toBeNull();
  });

  it('426 : signale la version minimale requise', async () => {
    fetchMock.mockResolvedValueOnce(
      reply({
        status: 426,
        headers: { 'X-Min-App-Version': '2.0.0' },
        body: { error: { code: 'UPGRADE_REQUIRED', message: 'Mise à jour requise.' } },
      }),
    );
    await expect(api('/requests')).rejects.toMatchObject({ code: 'UPGRADE_REQUIRED' });
    expect(onUpgradeRequired).toHaveBeenCalledWith('2.0.0');
  });

  it('erreur réseau : erreur typée, jetons conservés', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(api('/requests')).rejects.toMatchObject({ code: 'NETWORK_ERROR' });
    expect(await SecureStore.getItemAsync('doztra.tokens')).not.toBeNull();
  });

  it('délai d’expiration explicite sur chaque requête', async () => {
    jest.useFakeTimers();
    try {
      fetchMock.mockImplementationOnce(
        (_: string, init: { signal: AbortSignal }) =>
          new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))),
      );
      const pending = api('/requests');
      const assertion = expect(pending).rejects.toMatchObject({ code: 'TIMEOUT' });
      await jest.advanceTimersByTimeAsync(15_000);
      await assertion;
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('setRequestPriority', () => {
  it('envoie la valeur souhaitée en booléen strict (R11)', async () => {
    fetchMock.mockResolvedValue(
      reply({ status: 200, body: { data: { id: 'x', isPriority: true, updatedAt: '2026-10-21T09:42:00.000Z' } } }),
    );
    await setRequestPriority('x', true);
    await setRequestPriority('x', true);
    for (const [url, init] of fetchMock.mock.calls) {
      expect(url).toBe('https://api.test/api/v1/requests/x/priority');
      expect(init.method).toBe('PATCH');
      expect(init.body).toBe('{"isPriority":true}');
    }
  });
});
