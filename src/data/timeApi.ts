import { request } from './productsApi';

// Pointage des employés (API : /time/…). L'heure est celle du serveur, jamais celle du téléphone.
// Une pause = pointer la sortie puis l'entrée : l'écart entre deux pointages n'est pas compté.

export interface TimeEntry {
  id: number;
  user_id: number;
  user_email: string;
  started_at: string;
  ended_at: string | null;
  edited_at: string | null;
  edited_by_id: number | null;
}

export type Period = 'day' | 'week' | 'month';

// Un pointage resté ouvert plus longtemps est un oubli : signalé, et non compté
export const MAX_OPEN_MS = 14 * 3600 * 1000;

const range = (start: Date, end: Date) =>
  new URLSearchParams({ start: start.toISOString(), end: end.toISOString() }).toString();

export const currentEntry = () => request<TimeEntry | null>('/time/me/current');
export const clockIn = () => request<TimeEntry>('/time/me/clock-in', { method: 'POST' });
export const clockOut = () => request<TimeEntry>('/time/me/clock-out', { method: 'POST' });
export const myEntries = (start: Date, end: Date) => request<TimeEntry[]>(`/time/me/entries?${range(start, end)}`);
export const allEntries = (start: Date, end: Date) => request<TimeEntry[]>(`/time/entries?${range(start, end)}`);

export const correctEntry = (id: number, started_at: Date, ended_at: Date | null) =>
  request<TimeEntry>(`/time/entries/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ started_at: started_at.toISOString(), ended_at: ended_at?.toISOString() ?? null }),
  });

export const deleteEntry = (id: number) => request<void>(`/time/entries/${id}`, { method: 'DELETE' });

// Bornes de la période contenant `ref`, en heure locale (la semaine commence le lundi)
export function periodBounds(period: Period, ref: Date): { start: Date; end: Date } {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  if (period === 'day') return { start: d, end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1) };
  if (period === 'week') {
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
  }
  return { start: new Date(d.getFullYear(), d.getMonth(), 1), end: new Date(d.getFullYear(), d.getMonth() + 1, 1) };
}

export function shiftPeriod(period: Period, ref: Date, dir: 1 | -1): Date {
  if (period === 'day') return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + dir);
  if (period === 'week') return new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 7 * dir);
  return new Date(ref.getFullYear(), ref.getMonth() + dir, 1);
}

export const isForgotten = (e: TimeEntry, now = Date.now()) =>
  e.ended_at === null && now - Date.parse(e.started_at) > MAX_OPEN_MS;

// Durée comptée : un pointage en cours compte jusqu'à maintenant, un oubli ne compte pas
export function entryMs(e: TimeEntry, now = Date.now()): number {
  if (e.ended_at) return Math.max(0, Date.parse(e.ended_at) - Date.parse(e.started_at));
  return isForgotten(e, now) ? 0 : Math.max(0, now - Date.parse(e.started_at));
}

export const totalMs = (entries: TimeEntry[], now = Date.now()) => entries.reduce((s, e) => s + entryMs(e, now), 0);

export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000);
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`;
}

export const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
