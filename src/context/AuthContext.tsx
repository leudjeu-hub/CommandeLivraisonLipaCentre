import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../data/authApi';
import { ApiError, getToken, setToken, setUnauthorizedHandler } from '../data/productsApi';

// Session de l'utilisateur connecté (jeton dans localStorage, vérifié auprès de l'API au démarrage).
// Seul un refus de l'API (401) efface la session : une coupure réseau ou un serveur Render qui ne
// répond pas (3G, mise en veille) garde le jeton et propose de réessayer (offline).

interface AuthContextType {
  user: authApi.User | null;
  // false tant que la session enregistrée n'a pas été vérifiée auprès de l'API
  ready: boolean;
  // true quand la session enregistrée n'a pas pu être vérifiée (API injoignable) ; voir retry
  offline: boolean;
  retry: () => void;
  login: (email: string, password: string) => Promise<authApi.User>;
  register: (email: string, password: string) => Promise<authApi.User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  const [ready, setReady] = useState(!getToken());
  const [offline, setOffline] = useState(false);

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const check = useCallback(() => {
    if (!getToken()) return;
    setReady(false);
    setOffline(false);
    authApi
      .me()
      .then(setUser)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) clear();
        else setOffline(true);
      })
      .finally(() => setReady(true));
  }, [clear]);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    check();
    return () => setUnauthorizedHandler(null);
  }, [clear, check]);

  const start = (res: { token: string; user: authApi.User }) => {
    setOffline(false);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const value: AuthContextType = {
    user,
    ready,
    offline,
    retry: check,
    login: async (email, password) => start(await authApi.login(email, password)),
    register: async (email, password) => start(await authApi.register(email, password)),
    logout: async () => {
      await authApi.logout().catch(() => undefined); // déconnexion locale même si l'API ne répond pas
      clear();
      setOffline(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
