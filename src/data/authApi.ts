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

// Mot de passe oublié : la réponse est la même que le compte existe ou non (202).
// 60 s : souvent le premier appel après une longue pause (serveur en veille). Abandonner à 15 s
// ne servirait à rien : le serveur traiterait quand même la demande en se réveillant, et le lien,
// à usage unique, serait déjà consommé quand la personne réessaierait.
export const requestPasswordReset = (email: string) =>
  request<{ detail: string }>('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }), auth: false, timeout: 60_000 });

export const confirmPasswordReset = (token: string, password: string) =>
  request<void>('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, password }), auth: false, timeout: 60_000 });

export const logout = () => request<void>('/auth/logout', { method: 'POST' });

export const me = () => request<User>('/auth/me');

export const listUsers = () => request<User[]>('/users/');

export const setRole = (id: number, role: Role) =>
  request<User>(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });

export const setActive = (id: number, active: boolean) =>
  request<User>(`/users/${id}/active`, { method: 'PATCH', body: JSON.stringify({ active }) });

export const deleteUser = (id: number) => request<void>(`/users/${id}`, { method: 'DELETE' });

// Employés, responsables et administrateurs (pour le tableau des heures ; responsable ou admin)
export const listStaff = () => request<User[]>('/time/staff');
