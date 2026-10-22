import { useTranslation } from 'react-i18next';
import { Alert, Button, CircularProgress, Container, Stack, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

// Pages réservées (/compte, /gestion) tant que la session n'est pas vérifiée : attente (serveur
// Render qui se réveille, jusqu'à ~1 min) ou API injoignable, avec un bouton pour réessayer.
export default function SessionWait() {
  const { t } = useTranslation();
  const { ready, retry } = useAuth();
  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      {!ready ? (
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }} role="status">
          <CircularProgress size={28} />
          <Typography color="text.secondary">{t('auth.slow')}</Typography>
        </Stack>
      ) : (
        <Alert severity="warning" action={<Button color="inherit" onClick={retry}>{t('auth.retry')}</Button>}>
          {t('auth.offline')}
        </Alert>
      )}
    </Container>
  );
}
