import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../data/authApi';
import { getToken, setToken, setUnauthorizedHandler } from '../data/productsApi';

// Session de l'utilisateur connecté. Développement uniquement : le site publié n'a pas d'API,
// il utilise StaticAuthProvider (personne n'est connecté) et le code de connexion est retiré du build.

interface AuthContextType {
  user: authApi.User | null;
  // false tant que la session enregistrée n'a pas été vérifiée auprès de l'API
  ready: boolean;
  login: (email: string, password: string) => Promise<authApi.User>;
  register: (email: string, password: string) => Promise<authApi.User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function DevAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<authApi.User | null>(null);
  const [ready, setReady] = useState(!getToken());

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    if (getToken()) {
      authApi
        .me()
        .then(setUser)
        .catch(clear)
        .finally(() => setReady(true));
    }
    return () => setUnauthorizedHandler(null);
  }, [clear]);

  const start = (res: { token: string; user: authApi.User }) => {
    setToken(res.token);
    setUser(res.user);
    return res.user;
  };

  const value: AuthContextType = {
    user,
    ready,
    login: async (email, password) => start(await authApi.login(email, password)),
    register: async (email, password) => start(await authApi.register(email, password)),
    logout: async () => {
      await authApi.logout().catch(() => undefined); // déconnexion locale même si l'API ne répond pas
      clear();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const noApi = () => Promise.reject(new Error('API indisponible sur le site publié'));
const STATIC_AUTH: AuthContextType = { user: null, ready: true, login: noApi, register: noApi, logout: noApi };

function StaticAuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={STATIC_AUTH}>{children}</AuthContext.Provider>;
}

export const AuthProvider = import.meta.env.DEV ? DevAuthProvider : StaticAuthProvider;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
