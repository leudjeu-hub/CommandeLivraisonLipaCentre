import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel,
  MenuItem, Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow,
  TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import { listStaff, type User } from '../data/authApi';
import {
  allEntries, correctEntry, dayKey, deleteEntry, entryMs, formatDuration, isForgotten, periodBounds, shiftPeriod,
  type Period, type TimeEntry,
} from '../data/timeApi';
import { showToast } from '../components/Toast';

// Onglet « Heures » de la gestion : totaux par employé (jour, semaine, mois), détail et corrections.

// <input type="datetime-local"> attend l'heure locale « AAAA-MM-JJTHH:MM »
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Un responsable ne corrige pas ses propres heures (l'API le refuse aussi) ; un administrateur peut.
export default function HoursAdmin({ currentUser }: { currentUser: User }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';
  const [period, setPeriod] = useState<Period>('week');
  const [ref, setRef] = useState(() => new Date());
  const [entries, setEntries] = useState<TimeEntry[] | null>(null);
  const [staff, setStaff] = useState<User[]>([]);
  const [filter, setFilter] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<TimeEntry | null>(null);

  const { start, end } = periodBounds(period, ref);

  const load = useCallback(() => {
    const b = periodBounds(period, ref);
    setEntries(null);
    allEntries(b.start, b.end)
      .then((list) => { setEntries(list); setError(''); })
      .catch((err) => setError(err.message));
  }, [period, ref]);
  useEffect(load, [load]);

  useEffect(() => {
    listStaff().then(setStaff).catch(() => undefined);
  }, []);

  // Une ligne par employé : ceux qui ont le rôle, plus quiconque a pointé sur la période
  const rows = useMemo(() => {
    const byUser = new Map<number, { email: string; ms: number; days: Set<string>; forgotten: number }>();
    staff.forEach((u) => byUser.set(u.id, { email: u.email, ms: 0, days: new Set(), forgotten: 0 }));
    entries?.forEach((e) => {
      const row = byUser.get(e.user_id) ?? { email: e.user_email, ms: 0, days: new Set<string>(), forgotten: 0 };
      row.ms += entryMs(e);
      row.days.add(dayKey(e.started_at));
      if (isForgotten(e)) row.forgotten += 1;
      byUser.set(e.user_id, row);
    });
    return [...byUser.entries()].map(([id, r]) => ({ id, ...r })).sort((a, b) => a.email.localeCompare(b.email));
  }, [entries, staff]);

  const shown = (entries ?? []).filter((e) => filter === '' || e.user_id === filter);

  const label = (() => {
    if (period === 'day') return start.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (period === 'month') return start.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate() - 1);
    const f = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
    return t('hours.weekOf', { from: f(start), to: f(last) });
  })();

  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const date = (iso: string) => new Date(iso).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' });

  const exportCsv = () => {
    const quote = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [[t('hours.employee'), t('hours.date'), t('hours.in'), t('hours.out'), t('hours.hoursDecimal')].map(quote).join(';')];
    shown.forEach((e) => lines.push([
      e.user_email, dayKey(e.started_at), time(e.started_at), e.ended_at ? time(e.ended_at) : '',
      e.ended_at ? (entryMs(e) / 3600000).toFixed(2).replace('.', ',') : '',
    ].map(quote).join(';')));
    const url = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `heures-${dayKey(start.toISOString())}-${period}.csv`;
    a.click();
    // Révoqué un peu plus tard : certains navigateurs (Safari, Firefox) annulent sinon le téléchargement
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const totalAll = rows.reduce((s, r) => s + r.ms, 0);

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t('hours.intro')}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <ToggleButtonGroup size="small" exclusive value={period} onChange={(_, v) => v && setPeriod(v)} aria-label={t('hours.period')}>
          <ToggleButton value="day">{t('clock.day')}</ToggleButton>
          <ToggleButton value="week">{t('clock.week')}</ToggleButton>
          <ToggleButton value="month">{t('clock.month')}</ToggleButton>
        </ToggleButtonGroup>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <IconButton onClick={() => setRef(shiftPeriod(period, ref, -1))} aria-label={t('hours.previous')}><ChevronLeftIcon /></IconButton>
          <Typography data-testid="hours-period" sx={{ fontWeight: 700, textAlign: 'center', '&::first-letter': { textTransform: 'uppercase' } }}>{label}</Typography>
          <IconButton onClick={() => setRef(shiftPeriod(period, ref, 1))} aria-label={t('hours.next')}><ChevronRightIcon /></IconButton>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!entries && !error && <Typography color="text.secondary">{t('admin.loading')}</Typography>}

      {entries && (
        <>
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('hours.employee')}</TableCell>
                  <TableCell align="right">{t('hours.days')}</TableCell>
                  <TableCell align="right">{t('hours.hours')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow><TableCell colSpan={3}>{t('hours.noStaff')}</TableCell></TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id} data-testid="hours-row">
                    <TableCell sx={{ overflowWrap: 'anywhere' }}>
                      {r.email}
                      {r.forgotten > 0 && <Chip size="small" color="warning" label={t('clock.forgotten')} sx={{ ml: 1 }} />}
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{r.days.size}</TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{formatDuration(r.ms)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('hours.total')}</TableCell>
                  <TableCell />
                  <TableCell align="right" data-testid="hours-total" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatDuration(totalAll)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
            <Typography variant="h6" component="h2" sx={{ fontFamily: 'Georgia, serif' }}>{t('hours.detail')}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="hours-filter-label">{t('hours.employee')}</InputLabel>
                <Select labelId="hours-filter-label" label={t('hours.employee')} value={filter} onChange={(e) => setFilter(e.target.value as number | '')}>
                  <MenuItem value="">{t('hours.everyone')}</MenuItem>
                  {rows.map((r) => <MenuItem key={r.id} value={r.id}>{r.email}</MenuItem>)}
                </Select>
              </FormControl>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv} disabled={!shown.length}>{t('hours.export')}</Button>
            </Box>
          </Box>
          {shown.length === 0 ? (
            <Typography color="text.secondary">{t('hours.empty')}</Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('hours.date')}</TableCell>
                    <TableCell>{t('hours.employee')}</TableCell>
                    <TableCell>{t('hours.in')}</TableCell>
                    <TableCell>{t('hours.out')}</TableCell>
                    <TableCell align="right">{t('hours.duration')}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {shown.map((e) => (
                    <TableRow key={e.id} data-testid="entry-row">
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{date(e.started_at)}</TableCell>
                      <TableCell sx={{ overflowWrap: 'anywhere' }}>{e.user_email}</TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{time(e.started_at)}</TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {e.ended_at ? time(e.ended_at) : (
                          <Chip size="small" color={isForgotten(e) ? 'warning' : 'success'} label={isForgotten(e) ? t('clock.forgotten') : t('clock.running')} />
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {e.ended_at ? formatDuration(entryMs(e)) : '–'}
                        {e.edited_at && <Chip size="small" variant="outlined" label={t('hours.corrected')} sx={{ ml: 1 }} title={t('hours.correctedOn', { date: date(e.edited_at) })} />}
                      </TableCell>
                      <TableCell align="right">
                        {(currentUser.role === 'admin' || e.user_id !== currentUser.id) && (
                          <IconButton size="small" onClick={() => setEditing(e)} aria-label={t('hours.correctFor', { email: e.user_email, time: time(e.started_at) })}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {editing && <CorrectDialog entry={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}

function CorrectDialog({ entry, onClose, onSaved }: { entry: TimeEntry; onClose: () => void; onSaved: () => void }) {
  const { t } = useTranslation();
  const [started, setStarted] = useState(toLocalInput(entry.started_at));
  const [ended, setEnded] = useState(entry.ended_at ? toLocalInput(entry.ended_at) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    const s = new Date(started);
    const f = ended ? new Date(ended) : null;
    if (Number.isNaN(s.getTime()) || (f && (Number.isNaN(f.getTime()) || f <= s))) {
      setError(t('hours.errOrder'));
      return;
    }
    setBusy(true);
    try {
      await correctEntry(entry.id, s, f);
      showToast(t('hours.saved'));
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    try {
      await deleteEntry(entry.id);
      showToast(t('hours.deleted'));
      onSaved();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={() => !busy && onClose()} fullWidth maxWidth="xs">
      <form onSubmit={save} noValidate>
        <DialogTitle>{t('hours.correctTitle', { email: entry.user_email })}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField id="correct-in" type="datetime-local" label={t('hours.in')} value={started} onChange={(e) => setStarted(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField id="correct-out" type="datetime-local" label={t('hours.out')} value={ended} onChange={(e) => setEnded(e.target.value)} helperText={t('hours.outHelp')} slotProps={{ inputLabel: { shrink: true } }} />
            <Typography variant="body2" color="text.secondary">{t('hours.auditNote')}</Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button color="error" onClick={remove} disabled={busy}>{confirmDelete ? t('hours.confirmDelete') : t('admin.delete')}</Button>
          <Box>
            <Button onClick={onClose} disabled={busy}>{t('admin.cancel')}</Button>
            <Button type="submit" variant="contained" disabled={busy}>{t('admin.save')}</Button>
          </Box>
        </DialogActions>
      </form>
    </Dialog>
  );
}
