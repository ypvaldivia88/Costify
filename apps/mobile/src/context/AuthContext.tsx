import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SessionUser } from '@/auth/types';
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  setStoredToken,
} from '@/api/client';
import { setStorageScope, loadStorageScope } from '@/storage/scoped-storage';
import { setActiveWorkspaceId } from '@/sync/workspace-id';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  storageScope: string | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateSession: (user: SessionUser, token?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function applySessionScope(user: SessionUser | null): Promise<string | null> {
  if (user?.tenantId && user.workspaceId) {
    await setStorageScope(user.tenantId);
    setActiveWorkspaceId(user.workspaceId);
    return user.tenantId;
  }
  await setStorageScope(null);
  setActiveWorkspaceId(null);
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [storageScope, setStorageScopeState] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const sessionUser = await fetchCurrentUser();
    setUser(sessionUser);
    const scope = await applySessionScope(sessionUser);
    setStorageScopeState(scope);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const existingScope = await loadStorageScope();
        setStorageScopeState(existingScope);
        await refresh();
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: sessionUser } = await loginRequest(email, password);
    setUser(sessionUser);
    const scope = await applySessionScope(sessionUser);
    setStorageScopeState(scope);
    return sessionUser;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    await applySessionScope(null);
    setStorageScopeState(null);
  }, []);

  const updateSession = useCallback(async (sessionUser: SessionUser, token?: string) => {
    if (token) {
      await setStoredToken(token);
    }
    setUser(sessionUser);
    const scope = await applySessionScope(sessionUser);
    setStorageScopeState(scope);
  }, []);

  const value = useMemo(
    () => ({ user, loading, storageScope, login, logout, refresh, updateSession }),
    [user, loading, storageScope, login, logout, refresh, updateSession]
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
