import * as Device from 'expo-device';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchMe, login, logout } from '@/api/auth';
import { setSessionEvents } from '@/api/client';
import { ApiError } from '@/api/errors';
import { queryClient } from '@/lib/query-client';
import type { User } from '@/validation/request.schema';

import { getTokens } from './storage';

type SessionState =
  | { status: 'loading' }
  | { status: 'signedOut'; message: string | null }
  | { status: 'signedIn'; user: User | null }
  | { status: 'upgrade'; minVersion: string | null };

type SessionContextValue = {
  state: SessionState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// La garde de navigation n'est qu'une commodité d'interface :
// le contrôle d'accès réel est fait par le serveur sur chaque requête.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });

  useEffect(() => {
    setSessionEvents({
      onSessionLost: (message) => {
        queryClient.clear();
        setState({ status: 'signedOut', message });
      },
      onUpgradeRequired: (minVersion) => setState({ status: 'upgrade', minVersion }),
    });

    let cancelled = false;
    (async () => {
      const tokens = await getTokens().catch(() => null);
      if (!tokens) {
        if (!cancelled) setState({ status: 'signedOut', message: null });
        return;
      }
      try {
        const user = await fetchMe();
        if (!cancelled) setState((s) => (s.status === 'loading' ? { status: 'signedIn', user } : s));
      } catch (e) {
        // Hors ligne au démarrage : on garde la session, la liste affichera son état d'erreur.
        if (!cancelled && e instanceof ApiError && e.isTransient) {
          setState((s) => (s.status === 'loading' ? { status: 'signedIn', user: null } : s));
        } else if (!cancelled) {
          setState((s) => (s.status === 'loading' ? { status: 'signedOut', message: null } : s));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await login(email, password, Device.deviceName ?? undefined);
    setState({ status: 'signedIn', user });
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    queryClient.clear();
    setState({ status: 'signedOut', message: null });
  }, []);

  const value = useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession doit être utilisé sous <SessionProvider>.');
  return ctx;
}
