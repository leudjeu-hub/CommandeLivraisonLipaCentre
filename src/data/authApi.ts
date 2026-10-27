import { request } from './productsApi';

// Comptes et connexion (API : /auth/…, /users/…). Développement uniquement, comme la gestion des articles.

export type Role = 'user' | 'employee' | 'manager' | 'admin';

export const ROLES: Role[] = ['user', 'employee', 'manager', 'admin'];
export const ROLE_LABEL = {
  user: 'auth.roleUser', employee: 'auth.roleEmployee', manager: 'auth.roleManager', admin: 'auth.roleAdmin',
} as const;

// Gestion (/gestion) : le responsable n'y voit que les heures
export const canManageHours = (role: Role) => role === 'manager' || role === 'admin';

export interface User {
  id: number;
  email: string;
  role: Role;
  created_at: string;
  // false = compte bloqué (connexion refusée)
  is_active: boolean;
  // Liste /users/ (administrateurs) seulement ; null = aucune connexion enregistrée depuis le suivi
  last_login_at?: string | null;
}

interface TokenResponse {
  token: string;
  user: User;
}

const credentials = (email: string, password: string) => ({
  method: 'POST',
  body: JSON.stringify({ email, password }),
});

export const register = (email: string, password: string) =>
  request<TokenResponse>('/auth/register', credentials(email, password));

export const login = (email: string, password: string) =>
  request<TokenResponse>('/auth/login', credentials(email, password));

export const logout = () => request<void>('/auth/logout', { method: 'POST' });

export const me = () => request<User>('/auth/me');

export const listUsers = () => request<User[]>('/users/');

export const setRole = (id: number, role: Role) =>
  request<User>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });

export const setActive = (id: number, active: boolean) =>
  request<User>(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) });

export const deleteUser = (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' });

// Mot de passe oublié : nouveau mot de passe aléatoire, renvoyé une seule fois (le site n'envoie pas d'e-mail)
export const resetPassword = (id: number) =>
  request<{ password: string }>(`/users/${id}/password`, { method: 'POST' }).then((r) => r.password);

// Employés, responsables et administrateurs (pour le tableau des heures ; responsable ou admin)
export const listStaff = () => request<User[]>('/time/staff');
