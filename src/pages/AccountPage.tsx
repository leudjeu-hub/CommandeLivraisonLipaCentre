import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button, Chip, Container, Paper, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import SessionWait from '../components/SessionWait';
import { showToast } from '../components/Toast';
import TimeClock from '../components/TimeClock';
import MyOrders from '../components/MyOrders';
import { ROLE_LABEL } from '../data/authApi';

// Mon compte (/compte) : session, pointage du personnel et commandes envoyées avec ce compte.
export default function AccountPage() {
  const { t, i18n } = useTranslation();
  const { user, ready, offline, logout } = useAuth();
  const navigate = useNavigate();
  // Déconnexion en cours : la session disparaît avant le retour à l'accueil, sans ce drapeau la page
  // redirigeait parfois vers /connexion au lieu de l'accueil
  const leaving = useRef(false);

  if (!ready || (offline && !user)) return <SessionWait />;
  if (!user) return leaving.current ? null : <Navigate to="/connexion?suite=/compte" replace />;

  const handleLogout = async () => {
    leaving.current = true;
    await logout();
    showToast(t('auth.loggedOut'));
    navigate('/', { replace: true });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="overline" color="secondary">{t('auth.eyebrow')}</Typography>
      <Typography variant="h4" component="h1" sx={{ fontFamily: 'Georgia, serif', mb: 3 }}>
        {t('auth.accountTitle')}
      </Typography>
      {/* Pointage : employés, responsables et administrateurs */}
      {user.role !== 'user' && <TimeClock />}
      {/* Client : ses commandes d'abord, c'est ce qu'il vient chercher */}
      {user.role === 'user' && <MyOrders first />}
      <Paper sx={{ p: 3, mt: user.role === 'user' ? 4 : 0 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>{t('auth.loggedAs', { email: user.email })}</Typography>
        <Chip
          label={t(ROLE_LABEL[user.role])}
          color={user.role === 'user' ? 'default' : 'primary'}
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
      {user.role !== 'user' && <MyOrders />}
    </Container>
  );
}
