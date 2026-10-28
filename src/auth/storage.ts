import * as SecureStore from 'expo-secure-store';

// Jetons uniquement dans le trousseau (Keychain / Keystore), jamais dans AsyncStorage.
// WHEN_UNLOCKED_THIS_DEVICE_ONLY : aucune propagation par les sauvegardes iCloud / Google.

export type Tokens = { accessToken: string; refreshToken: string };

const KEY = 'doztra.tokens';
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export async function getTokens(): Promise<Tokens | null> {
  const raw = await SecureStore.getItemAsync(KEY, OPTIONS);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Tokens>;
    return parsed.accessToken && parsed.refreshToken
      ? { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken }
      : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: Tokens): Promise<void> {
  return SecureStore.setItemAsync(KEY, JSON.stringify(tokens), OPTIONS);
}

export function clearTokens(): Promise<void> {
  return SecureStore.deleteItemAsync(KEY, OPTIONS);
}
