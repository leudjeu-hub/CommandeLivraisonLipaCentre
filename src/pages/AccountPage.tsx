import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Chip, Container, Paper, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../components/Toast';

// Mon compte (/compte). Développement uniquement (App.tsx).
export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();

  if (!ready) return null;
  if (!user) return <Navigate to="/connexion?suite=/compte" replace />;

  const handleLogout = async () => {
    await logout();
    showToast(t('auth.loggedOut'));
    navigate('/', { replace: true });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="overline" color="secondary">{t('auth.devOnly')}</Typography>
      <Typography variant="h4" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 3 }}>
        {t('auth.accountTitle')}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>{t('auth.loggedAs', { email: user.email })}</Typography>
        <Chip
          label={user.role === 'admin' ? t('auth.roleAdmin') : t('auth.roleUser')}
          color={user.role === 'admin' ? 'primary' : 'default'}
          size="small"
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {t('auth.memberSince', {
            date: new Date(user.created_at).toLocaleDateString(i18n.language === 'fr' ? 'fr-FR' : 'en-GB'),
          })}
        </Typography>
        <Button variant="outlined" onClick={handleLogout}>{t('auth.logout')}</Button>
      </Paper>
    </Container>
  );
}
