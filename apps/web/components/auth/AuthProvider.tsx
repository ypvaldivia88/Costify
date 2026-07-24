'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@/lib/auth/types';
import {
  clearCachedSession,
  isBrowserOffline,
  isCachedSessionValid,
  isNetworkError,
  loadCachedSession,
  saveCachedSession,
} from '@/lib/auth/offline-session';
import { fetchCurrentSession } from '@/lib/auth/session-client';
import { setStorageScope } from '@/lib/storage/scoped-storage';
import { setActiveWorkspaceId } from '@/lib/sync/workspace-id';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  isOfflineSession: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applySessionScope(user: SessionUser | null) {
  if (user?.tenantId && user.workspaceId) {
    setStorageScope(user.tenantId);
    setActiveWorkspaceId(user.workspaceId);
    return;
  }
  setStorageScope(null);
  setActiveWorkspaceId(null);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineSession, setIsOfflineSession] = useState(false);

  const refresh = useCallback(async (): Promise<SessionUser | null> => {
    const wasOffline = isBrowserOffline();
    const sessionUser = await fetchCurrentSession();

    if (sessionUser) {
      setUser(sessionUser);
      applySessionScope(sessionUser);
      setIsOfflineSession(wasOffline || isBrowserOffline());
      return sessionUser;
    }

    setUser(null);
    applySessionScope(null);
    setIsOfflineSession(false);
    return null;
  }, []);

  useEffect(() => {
    const cached = loadCachedSession();
    if (isCachedSessionValid(cached)) {
      setUser(cached.user);
      applySessionScope(cached.user);
      setIsOfflineSession(isBrowserOffline());
      setLoading(false);
      void refresh();
      return;
    }

    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    const onOnline = () => {
      void refresh();
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || isBrowserOffline()) return;
      void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    if (isBrowserOffline()) {
      throw new Error(
        'Sin conexión. Necesitas internet para iniciar sesión por primera vez en este dispositivo.'
      );
    }

    let response: Response;
    try {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error(
          'Sin conexión. Necesitas internet para iniciar sesión por primera vez en este dispositivo.'
        );
      }
      throw error;
    }

    const json = (await response.json()) as {
      user?: SessionUser;
      token?: string;
      error?: string;
    };
    if (!response.ok || !json.user) {
      throw new Error(json.error || 'No se pudo iniciar sesión.');
    }

    saveCachedSession(json.user, json.token);
    setUser(json.user);
    applySessionScope(json.user);
    setIsOfflineSession(false);
    return json.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      if (!isBrowserOffline()) {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      }
    } catch {
      // Ignore network errors during logout.
    }
    clearCachedSession();
    setUser(null);
    applySessionScope(null);
    setIsOfflineSession(false);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, isOfflineSession, login, logout, refresh }),
    [user, loading, isOfflineSession, login, logout, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider.');
  }
  return context;
}
