import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Container, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { whatsappLink } from '../data/catalogue';

// Adresse inconnue (lien mal copié, ancienne page) : GitHub Pages sert 404.html, le routeur arrive ici.
// Jamais de page vide : retour à l'accueil, au catalogue, ou WhatsApp.
export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
      <Typography variant="h2" component="h1" sx={{ mb: 2 }}>{t('notFound.title')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>{t('notFound.text')}</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button variant="contained" size="large" component={Link} to="/">{t('notFound.home')}</Button>
        <Button variant="outlined" size="large" component={Link} to="/catalogue" sx={{ bgcolor: '#fff' }}>{t('nav.catalogue')}</Button>
      </Box>
      <Button color="success" href={whatsappLink()} target="_blank" rel="noopener" startIcon={<WhatsAppIcon />} sx={{ mt: 2 }}>
        {t('nav.whatsapp')}
      </Button>
    </Container>
  );
}
