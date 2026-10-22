import { request } from './productsApi';

// Comptes et connexion (API : /auth/…, /users/…). Développement uniquement, comme la gestion des articles.

export type Role = 'user' | 'employee' | 'admin';

export interface User {
  id: number;
  email: string;
  role: Role;
  created_at: string;
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
