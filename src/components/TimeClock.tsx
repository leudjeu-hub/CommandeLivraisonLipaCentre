import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  clockIn, clockOut, currentEntry, formatDuration, isForgotten, myEntries, periodBounds, totalMs,
  type TimeEntry,
} from '../data/timeApi';
import { showToast } from './Toast';

// Pointage de l'employé connecté (sur /compte) : entrée, sortie, et ses heures du jour, de la semaine et du mois.
export default function TimeClock() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';
  const [open, setOpen] = useState<TimeEntry | null | undefined>(undefined);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const today = new Date();
    const week = periodBounds('week', today);
    const month = periodBounds('month', today);
    const start = week.start < month.start ? week.start : month.start;
    const end = week.end > month.end ? week.end : month.end;
    try {
      const [cur, list] = await Promise.all([currentEntry(), myEntries(start, end)]);
      setOpen(cur);
      setEntries(list);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [load]);

  const time = (iso: string) => new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const forgotten = open ? isForgotten(open, now) : false;

  const punch = async () => {
    setBusy(true);
    setError('');
    try {
      const entry = open ? await clockOut() : await clockIn();
      showToast(open ? t('clock.outDone', { time: time(entry.ended_at!) }) : t('clock.inDone', { time: time(entry.started_at) }));
      await load();
      setNow(Date.now());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const today = new Date();
  const inPeriod = (p: 'day' | 'week' | 'month') => {
    const { start, end } = periodBounds(p, today);
    return entries.filter((e) => Date.parse(e.started_at) >= start.getTime() && Date.parse(e.started_at) < end.getTime());
  };
  const todays = inPeriod('day');

  return (
    <Paper sx={{ p: 3, mb: 3 }} data-testid="time-clock">
      <Typography variant="h6" component="h2" sx={{ fontFamily: 'Georgia, serif', mb: 1 }}>{t('clock.title')}</Typography>
      {open === undefined && !error && <Typography color="text.secondary">{t('admin.loading')}</Typography>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {open !== undefined && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              size="small"
              color={forgotten ? 'warning' : open ? 'success' : 'default'}
              label={forgotten ? t('clock.forgotten') : open ? t('clock.inSince', { time: time(open.started_at) }) : t('clock.out')}
            />
          </Box>
          {forgotten && <Alert severity="warning" sx={{ mb: 2 }}>{t('clock.forgottenHelp')}</Alert>}
          <Button
            variant="contained"
            size="large"
            color={open ? 'secondary' : 'primary'}
            startIcon={open ? <LogoutIcon /> : <LoginIcon />}
            onClick={punch}
            disabled={busy}
            fullWidth
            sx={{ py: 1.5, mb: 1 }}
          >
            {busy ? t('clock.busy') : open ? t('clock.punchOut') : t('clock.punchIn')}
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t('clock.breakHelp')}</Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }} useFlexGap flexWrap="wrap">
            {(['day', 'week', 'month'] as const).map((p) => (
              <Paper key={p} variant="outlined" sx={{ p: 1.5, flex: '1 1 90px', minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">{t(`clock.${p}`)}</Typography>
                <Typography data-testid={`total-${p}`} sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {formatDuration(totalMs(inPeriod(p), now))}
                </Typography>
              </Paper>
            ))}
          </Stack>

          {todays.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{t('clock.todayEntries')}</Typography>
              {todays.map((e) => (
                <Typography key={e.id} variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                  {time(e.started_at)} – {e.ended_at ? time(e.ended_at) : t('clock.running')}
                </Typography>
              ))}
            </>
          )}
        </>
      )}
    </Paper>
  );
}
