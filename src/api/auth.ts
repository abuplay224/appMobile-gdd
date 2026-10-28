import { clearTokens, getTokens, saveTokens } from '@/auth/storage';
import { authResultSchema, userSchema, type User } from '@/validation/request.schema';

import { api, parse, rawRequest } from './client';

export async function login(email: string, password: string, deviceName?: string): Promise<User> {
  const data = parse(
    authResultSchema,
    await rawRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password, deviceName }),
    }),
  );
  await saveTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.user;
}

export async function fetchMe(): Promise<User> {
  return parse(userSchema, await api('/auth/me'));
}

/** Révoque la session de cet appareil (best effort) puis efface les jetons. */
export async function logout(): Promise<void> {
  const tokens = await getTokens();
  if (tokens) {
    await rawRequest(
      '/auth/logout',
      { method: 'POST', body: JSON.stringify({ refreshToken: tokens.refreshToken }) },
      tokens.accessToken,
    ).catch(() => {});
  }
  await clearTokens();
}
