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
import { setStorageScope } from '@/lib/storage/scoped-storage';
import { setActiveWorkspaceId } from '@/lib/sync/workspace-id';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
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

  const refresh = useCallback(async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
    });
    if (!response.ok) {
      const fallback = await fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' });
      if (!fallback.ok) {
        setUser(null);
        applySessionScope(null);
        return;
      }
      const json = (await fallback.json()) as { user: SessionUser };
      setUser(json.user);
      applySessionScope(json.user);
      return;
    }
    const json = (await response.json()) as { user: SessionUser };
    setUser(json.user);
    applySessionScope(json.user);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const json = (await response.json()) as { user?: SessionUser; error?: string };
      if (!response.ok || !json.user) {
        throw new Error(json.error || 'No se pudo iniciar sesión.');
      }
      setUser(json.user);
      applySessionScope(json.user);
      return json.user;
    },
    []
  );

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    applySessionScope(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, logout, refresh }),
    [user, loading, login, logout, refresh]
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
