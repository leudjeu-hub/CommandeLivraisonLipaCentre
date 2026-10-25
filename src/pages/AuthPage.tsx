import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Container, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../data/productsApi';
import { showToast } from '../components/Toast';

// Connexion (/connexion) et création de compte (/inscription).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Après connexion : retour à la page demandée (?suite=/gestion), seulement un chemin interne
const safeNext = (next: string | null) => (next && /^\/(?!\/)/.test(next) ? next : '/compte');

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('suite'));
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  // Délai dépassé (serveur en veille) : bouton « Réessayer » dans le message
  const [timedOut, setTimedOut] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!EMAIL.test(email.trim())) found.email = t('auth.errEmail');
    if (isRegister && password.length < 8) found.password = t('auth.errPassword');
    if (!isRegister && !password) found.password = t('auth.errPassword');
    if (isRegister && confirm !== password) found.confirm = t('auth.errConfirm');
    setErrors(found);
    setError('');
    setTimedOut(false);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      if (isRegister) await auth.register(email.trim(), password);
      else await auth.login(email.trim(), password);
      showToast(t('auth.welcome'));
      navigate(next, { replace: true });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const late = err instanceof ApiError && err.timedOut;
      setTimedOut(late);
      setError(
        late ? t('auth.errTimeout')
          : status === 401 ? t('auth.errCredentials')
          : status === 403 ? t('auth.errBlocked')
          : status === 409 ? t('auth.errTaken')
          : status === 429 ? t(isRegister ? 'auth.errTooManyRegister' : 'auth.errTooMany')
          : (err as Error).message
      );
    } finally {
      setBusy(false);
    }
  };

  const other = isRegister ? '/connexion' : '/inscription';

  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Typography variant="overline" color="secondary">{t('auth.eyebrow')}</Typography>
      <Typography variant="h4" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 1 }}>
        {isRegister ? t('auth.registerTitle') : t('auth.loginTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{t('auth.intro')}</Typography>

      <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
        <Stack spacing={2}>
          <TextField
            label={t('auth.email')}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            required
            fullWidth
          />
          <TextField
            label={t('auth.password')}
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            helperText={errors.password || (isRegister ? t('auth.passwordHelp') : undefined)}
            required
            fullWidth
          />
          {isRegister && (
            <TextField
              label={t('auth.passwordConfirm')}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={!!errors.confirm}
              helperText={errors.confirm}
              required
              fullWidth
            />
          )}
          {error && (
            <Alert
              severity="error"
              action={timedOut ? <Button color="inherit" type="submit" disabled={busy}>{t('auth.retry')}</Button> : undefined}
            >
              {error}
            </Alert>
          )}
          {busy && <Alert severity="info">{t('auth.slow')}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
            {isRegister ? t('auth.registerSubmit') : t('auth.loginSubmit')}
          </Button>
          <Link component={RouterLink} to={`${other}${params.get('suite') ? `?suite=${encodeURIComponent(next)}` : ''}`} sx={{ textAlign: 'center' }}>
            {isRegister ? t('auth.toLogin') : t('auth.toRegister')}
          </Link>
        </Stack>
      </Paper>
    </Container>
  );
}
