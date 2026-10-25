import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Alert, Button, Container, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { confirmPasswordReset, requestPasswordReset } from '../data/authApi';
import { ApiError } from '../data/productsApi';
import { showToast } from '../components/Toast';

// Mot de passe oublié (/mot-de-passe-oublie) : demande du lien par e-mail.
// Nouveau mot de passe (/nouveau-mot-de-passe#token=…) : la page ouverte depuis ce lien.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Le jeton est dans le fragment (#token=…) : le navigateur ne l'envoie jamais à un serveur.
const tokenFromHash = () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';

export default function PasswordResetPage({ mode }: { mode: 'request' | 'reset' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isReset = mode === 'reset';

  const [token] = useState(() => (isReset ? tokenFromHash() : ''));
  // Une fois lu, le jeton est retiré de la barre d'adresse (historique, capture d'écran partagée)
  useEffect(() => {
    if (token) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  }, [token]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [invalidLink, setInvalidLink] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found: Record<string, string> = {};
    if (!isReset && !EMAIL.test(email.trim())) found.email = t('auth.errEmail');
    if (isReset && password.length < 8) found.password = t('auth.errPassword');
    if (isReset && confirm !== password) found.confirm = t('auth.errConfirm');
    setErrors(found);
    setError('');
    setTimedOut(false);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      if (isReset) {
        await confirmPasswordReset(token, password);
        showToast(t('reset.done'));
        navigate('/connexion', { replace: true });
      } else {
        await requestPasswordReset(email.trim());
        setSent(true);
      }
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const late = err instanceof ApiError && err.timedOut;
      setTimedOut(late);
      if (isReset && status === 400) setInvalidLink(true);
      else setError(late ? t('auth.errTimeout') : status === 429 ? t('reset.errTooMany') : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const askAgain = (
    <Link component={RouterLink} to="/mot-de-passe-oublie">{t('reset.askAgain')}</Link>
  );

  let content;
  if (sent) {
    content = (
      <Stack spacing={2}>
        <Alert severity="success">{t('reset.sent', { email: email.trim() })}</Alert>
        <Typography variant="body2" color="text.secondary">{t('reset.sentHelp')}</Typography>
        <Link component={RouterLink} to="/connexion" sx={{ textAlign: 'center' }}>{t('reset.backToLogin')}</Link>
      </Stack>
    );
  } else if (isReset && (!token || invalidLink)) {
    content = (
      <Stack spacing={2}>
        <Alert severity="error">{token ? t('reset.expired') : t('reset.noToken')}</Alert>
        {askAgain}
      </Stack>
    );
  } else {
    content = (
      <Stack spacing={2}>
        {isReset ? (
          <>
            <TextField
              label={t('reset.newPassword')}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password || t('auth.passwordHelp')}
              required
              fullWidth
            />
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
          </>
        ) : (
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
          {isReset ? t('reset.resetSubmit') : t('reset.requestSubmit')}
        </Button>
        <Link component={RouterLink} to="/connexion" sx={{ textAlign: 'center' }}>{t('reset.backToLogin')}</Link>
      </Stack>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ py: 4 }}>
      <Typography variant="overline" color="secondary">{t('auth.eyebrow')}</Typography>
      <Typography variant="h4" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 1 }}>
        {isReset ? t('reset.resetTitle') : t('reset.requestTitle')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {isReset ? t('reset.resetIntro') : t('reset.requestIntro')}
      </Typography>
      <Paper component="form" onSubmit={handleSubmit} noValidate sx={{ p: 3 }}>
        {content}
      </Paper>
    </Container>
  );
}
