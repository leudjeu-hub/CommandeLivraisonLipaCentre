import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Button, Container, Link, Paper, Stack, TextField, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../data/productsApi';
import { showToast } from '../components/Toast';
import { whatsappLink } from '../data/catalogue';

// Connexion (/connexion) et création de compte (/inscription).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Après connexion : retour à la page demandée (?suite=/gestion), seulement un chemin interne
const safeNext = (next: string | null) => (next && /^\/(?!\/)/.test(next) ? next : '/compte');

// Serveur Render en veille : ~40 s pour démarrer, chaque requête abandonnée après 15 s. On réessaie
// tout seul jusqu'à 4 fois (≈ 1 min) au lieu d'afficher une erreur au bout de 15 s.
const ATTEMPTS = 4;
// Délai dépassé, ou passerelle Render qui répond pendant le démarrage
const isWaking = (err: unknown) => err instanceof ApiError && (err.timedOut || [502, 503, 504].includes(err.status));

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
  // Toujours pas de réponse après tous les essais : bouton « Réessayer » dans le message
  const [timedOut, setTimedOut] = useState(false);
  const [busy, setBusy] = useState(false);
  // Essai en cours (1 à ATTEMPTS) : à partir du 2e, le message dit que le serveur démarre
  const [attempt, setAttempt] = useState(1);
  // Page quittée pendant l'attente : ne plus réessayer ni naviguer
  const left = useRef(false);
  useEffect(() => {
    // Remis à false au montage : en développement, React monte, démonte puis remonte (StrictMode)
    left.current = false;
    return () => {
      left.current = true;
    };
  }, []);

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
      let lateBefore = false;
      for (let n = 1; ; n++) {
        if (left.current) return;
        setAttempt(n);
        try {
          if (isRegister) {
            try {
              await auth.register(email.trim(), password);
            } catch (err) {
              // Inscription dont la réponse s'est perdue (délai dépassé) : le compte existe peut-être déjà,
              // et le nouvel essai répond 409. On se connecte alors avec les mêmes identifiants.
              if (!(lateBefore && err instanceof ApiError && err.status === 409)) throw err;
              await auth.login(email.trim(), password).catch(() => {
                throw err;
              });
            }
          } else await auth.login(email.trim(), password);
          break;
        } catch (err) {
          if (!isWaking(err) || n >= ATTEMPTS) throw err;
          lateBefore = true;
        }
      }
      if (left.current) return;
      showToast(t('auth.welcome'));
      navigate(next, { replace: true });
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      const late = isWaking(err);
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
          {busy && <Alert severity="info" role="status">{t(attempt > 1 ? 'auth.waking' : 'auth.slow', { n: attempt, total: ATTEMPTS })}</Alert>}
          <Button type="submit" variant="contained" size="large" disabled={busy} fullWidth>
            {isRegister ? t('auth.registerSubmit') : t('auth.loginSubmit')}
          </Button>
          <Link component={RouterLink} to={`${other}${params.get('suite') ? `?suite=${encodeURIComponent(next)}` : ''}`} sx={{ textAlign: 'center' }}>
            {isRegister ? t('auth.toLogin') : t('auth.toRegister')}
          </Link>
          {/* Aucun e-mail envoyé par le site : la librairie donne un mot de passe provisoire (Gestion › Utilisateurs) */}
          {!isRegister && (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              {t('auth.forgot')}{' '}
              <Link href={whatsappLink(t('auth.forgotWhatsapp', { email: email.trim() }))} target="_blank" rel="noopener">{t('auth.forgotLink')}</Link>
            </Typography>
          )}
        </Stack>
      </Paper>
    </Container>
  );
}
